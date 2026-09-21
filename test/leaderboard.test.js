const assert = require("node:assert/strict");
const { after, test } = require("node:test");
const { createApp } = require("../src/server");
const { closeDatabase } = require("../src/db/database");
const userRepository = require("../src/db/repositories/user-repository");
const leaderboardRepository = require("../src/db/repositories/leaderboard-repository");

let fixture;

function cookieFrom(response) {
  const value =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()[0]
      : response.headers.get("set-cookie");
  return value ? value.split(";")[0] : "";
}

test("leaderboard returns ten ordered personal bests with safe duplicate identities", async () => {
  const app = createApp(
    {
      port: 0,
      databasePath: ":memory:",
      sessionSecret: "leaderboard-test-secret",
      authConfigured: true,
      entraClientId: "client-id",
      entraClientSecret: "client-secret",
      entraAuthority: "https://login.microsoftonline.com/organizations",
      entraRedirectUri: "http://localhost:3000/auth/callback",
    },
    {
      msalClient: {},
      authUrlBuilder: async () => "https://login.example.test/authorize",
      codeRedeemer: async () => ({
        idTokenClaims: { oid: "leaderboard-viewer", tid: "tenant-1" },
        account: { username: "viewer@example.test" },
      }),
    },
  );
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  fixture = { app, server };
  const baseUrl = "http://127.0.0.1:" + server.address().port;
  const signIn = await fetch(baseUrl + "/auth/callback?code=leaderboard-test", {
    redirect: "manual",
  });
  const cookie = cookieFrom(signIn);

  const db = app.locals.database;
  const seeded = [];
  for (let index = 0; index < 12; index += 1) {
    const user = userRepository.createUser(db, {
      entraSubject: "leaderboard-user-" + index,
      tenantId: "tenant-1",
      email: "cat-" + index + "@example.com",
      now: 1000 + index,
    });
    if (index !== 9) {
      userRepository.updateNickname(
        db,
        user.id,
        index === 0 ? "<img src=x onerror=alert(1)>" : index < 2 ? "Twin" : "Cat " + index,
        1100 + index,
      );
    }
    leaderboardRepository.upsertIfBetter(db, user.id, {
      score: 100,
      distanceM: 1000 - index,
      achievedAt: 2000 + index,
    });
    seeded.push(user);
  }

  const response = await fetch(baseUrl + "/api/leaderboard?limit=1000", {
    headers: { Cookie: cookie },
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.entries.length, 10);
  assert.deepEqual(payload.entries.map((entry) => entry.rank), [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  ]);
  assert.deepEqual(
    payload.entries.map((entry) => entry.email),
    seeded.slice(0, 10).map((_user, index) => "cat-" + index + "@example.com"),
  );
  assert.equal(payload.entries[0].nickname, "<img src=x onerror=alert(1)>");
  assert.equal(payload.entries[0].email, "cat-0@example.com");
  assert.equal(payload.entries[1].nickname, "Twin");
  assert.equal(payload.entries[9].nickname, "이름 없음");

  assert.equal(leaderboardRepository.getRankForUser(db, seeded[11].id), 12);
});

after(async () => {
  if (fixture) {
    await new Promise((resolve, reject) =>
      fixture.server.close((error) => (error ? reject(error) : resolve())),
    );
    closeDatabase(fixture.app.locals.database);
    fixture = null;
  }
});
