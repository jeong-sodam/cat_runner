const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const { createApp } = require("../src/server");
const { openDatabase, closeDatabase } = require("../src/db/database");
const { migrateDatabase } = require("../src/db/migrate");

const fixtures = new Set();

async function startApp(overrides = {}) {
  const db = openDatabase(":memory:");
  migrateDatabase(db);
  const app = createApp(
    {
      port: 0,
      databasePath: ":memory:",
      sessionSecret: "test-session-secret",
      authConfigured: false,
      guestMode: false,
      ...overrides.config,
    },
    {
      db,
      msalClient: overrides.msalClient,
      authUrlBuilder: overrides.authUrlBuilder,
      codeRedeemer: overrides.codeRedeemer,
    },
  );
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const port = server.address().port;
  const fixture = {
    app,
    db,
    server,
    baseUrl: "http://127.0.0.1:" + port,
  };
  fixtures.add(fixture);
  return fixture;
}

async function stopApp(fixture) {
  await new Promise((resolve, reject) => {
    fixture.server.close((error) => (error ? reject(error) : resolve()));
  });
  closeDatabase(fixture.db);
  fixtures.delete(fixture);
}

function cookieFrom(response) {
  const value =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()[0]
      : response.headers.get("set-cookie");
  return value ? value.split(";")[0] : "";
}

afterEach(async () => {
  for (const fixture of [...fixtures]) {
    await stopApp(fixture);
  }
});

test("missing Entra configuration returns a setup error", async () => {
  const fixture = await startApp();
  const response = await fetch(fixture.baseUrl + "/auth/signin", {
    redirect: "manual",
  });

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: {
      code: "AUTH_CONFIG_MISSING",
      message: "Microsoft Entra ID configuration is missing.",
      retryable: true,
    },
  });
});

test("local guest mode creates a playable session without Entra", async () => {
  const fixture = await startApp({
    config: { guestMode: true },
  });
  const meBefore = await fetch(fixture.baseUrl + "/api/me");
  assert.deepEqual(await meBefore.json(), {
    authenticated: false,
    guestMode: true,
  });

  const guest = await fetch(fixture.baseUrl + "/auth/guest", {
    redirect: "manual",
  });
  assert.equal(guest.status, 302);
  const cookie = cookieFrom(guest);
  const meAfter = await fetch(fixture.baseUrl + "/api/me", {
    headers: { Cookie: cookie },
  });
  const payload = await meAfter.json();
  assert.equal(payload.authenticated, true);
  assert.equal(payload.user.nickname, "Guest Cat");
  assert.match(payload.user.email, /^guest-[a-f0-9]{8}@local\.invalid$/);
});

test("configured sign-in redirects and callback creates a session user", async () => {
  const fixture = await startApp({
    config: {
      authConfigured: true,
      entraClientId: "client-id",
      entraClientSecret: "client-secret",
      entraAuthority: "https://login.microsoftonline.com/organizations",
      entraRedirectUri: "http://localhost:3000/auth/callback",
    },
    msalClient: {},
    authUrlBuilder: async () => "https://login.microsoftonline.com/authorize",
    codeRedeemer: async () => ({
      idTokenClaims: {
        oid: "object-1",
        tid: "tenant-1",
      },
      account: { username: "cat@example.com" },
    }),
  });

  const signIn = await fetch(fixture.baseUrl + "/auth/signin", {
    redirect: "manual",
  });
  assert.equal(signIn.status, 302);
  assert.equal(signIn.headers.get("location"), "https://login.microsoftonline.com/authorize");

  const callback = await fetch(
    fixture.baseUrl + "/auth/callback?code=fake-code",
    { redirect: "manual" },
  );
  assert.equal(callback.status, 302);
  const cookie = cookieFrom(callback);
  assert.match(cookie, /^connect\.sid=/);

  const me = await fetch(fixture.baseUrl + "/api/me", {
    headers: { Cookie: cookie },
  });
  assert.deepEqual(await me.json(), {
    authenticated: true,
    user: {
      id: 1,
      email: "cat@example.com",
      nickname: null,
    },
  });

  const nickname = await fetch(fixture.baseUrl + "/api/me/nickname", {
    method: "PATCH",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nickname: "같은 고양이" }),
  });
  assert.equal(nickname.status, 200);
  assert.deepEqual((await nickname.json()).user.nickname, "같은 고양이");

  const signedOut = await fetch(fixture.baseUrl + "/auth/signout", {
    headers: { Cookie: cookie },
    redirect: "manual",
  });
  assert.equal(signedOut.status, 302);
  const afterSignout = await fetch(fixture.baseUrl + "/api/me", {
    headers: { Cookie: cookie },
  });
  assert.deepEqual(await afterSignout.json(), { authenticated: false });
});

test("callback and protected nickname API reject invalid authentication states", async () => {
  const fixture = await startApp({
    config: {
      authConfigured: true,
      entraClientId: "client-id",
      entraClientSecret: "client-secret",
    },
    msalClient: {},
    codeRedeemer: async () => ({
      idTokenClaims: { oid: "object-without-tenant" },
    }),
  });

  const callback = await fetch(
    fixture.baseUrl + "/auth/callback?code=fake-code",
    { redirect: "manual" },
  );
  assert.equal(callback.status, 401);
  assert.deepEqual(await callback.json(), {
    error: {
      code: "AUTH_CLAIMS_MISSING",
      message: "Required Entra claims are missing.",
      retryable: false,
    },
  });

  const protectedResponse = await fetch(fixture.baseUrl + "/api/me/nickname", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname: "unauthorized" }),
  });
  assert.equal(protectedResponse.status, 401);
  assert.deepEqual(await protectedResponse.json(), {
    error: {
      code: "AUTH_REQUIRED",
      message: "Authentication is required.",
      retryable: false,
    },
  });
});

test("empty nickname is rejected while duplicate nicknames remain allowed", async () => {
  const fixture = await startApp({
    config: {
      authConfigured: true,
      entraClientId: "client-id",
      entraClientSecret: "client-secret",
    },
    msalClient: {},
    codeRedeemer: async () => ({
      idTokenClaims: {
        oid: "object-2",
        tid: "tenant-2",
        email: "second@example.com",
      },
    }),
  });

  const callback = await fetch(
    fixture.baseUrl + "/auth/callback?code=fake-code",
    { redirect: "manual" },
  );
  const cookie = cookieFrom(callback);

  const empty = await fetch(fixture.baseUrl + "/api/me/nickname", {
    method: "PATCH",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nickname: "   " }),
  });
  assert.equal(empty.status, 400);
  assert.deepEqual(await empty.json(), {
    error: {
      code: "NICKNAME_REQUIRED",
      message: "Nickname is required.",
      retryable: false,
    },
  });

  const valid = await fetch(fixture.baseUrl + "/api/me/nickname", {
    method: "PATCH",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nickname: "같은 고양이" }),
  });
  assert.equal(valid.status, 200);
  assert.equal((await valid.json()).user.nickname, "같은 고양이");
});
