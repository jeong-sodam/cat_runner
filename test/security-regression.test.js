const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const { createTestApp } = require("./helpers/fake-auth");

const fixtures = new Set();

async function startFixture(options = {}) {
  const fixture = await createTestApp(options);
  fixtures.add(fixture);
  return fixture;
}

afterEach(async () => {
  for (const fixture of [...fixtures]) {
    await fixture.close();
    fixtures.delete(fixture);
  }
});

test("run endpoints enforce ownership for events, snapshots, completion, and abandon", async () => {
  const fixture = await startFixture();
  const userACookie = await fixture.signIn();
  const jsonHeaders = { Cookie: userACookie, "Content-Type": "application/json" };
  const created = await fetch(fixture.baseUrl + "/api/runs", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ catId: "black" }),
  });
  const run = await created.json();

  fixture.setIdentity({ oid: "fake-user-b", email: "cat-b@example.com" });
  const userBCookie = await fixture.signIn();
  const otherHeaders = { Cookie: userBCookie, "Content-Type": "application/json" };
  const eventBody = JSON.stringify({ events: [] });
  const events = await fetch(fixture.baseUrl + "/api/runs/" + run.runId + "/events", {
    method: "POST",
    headers: otherHeaders,
    body: eventBody,
  });
  const snapshot = await fetch(fixture.baseUrl + "/api/runs/" + run.runId + "/snapshot", {
    method: "PUT",
    headers: otherHeaders,
    body: JSON.stringify({ snapshotVersion: 1, snapshot: {} }),
  });
  const complete = await fetch(fixture.baseUrl + "/api/runs/" + run.runId + "/complete", {
    method: "POST",
    headers: otherHeaders,
    body: JSON.stringify({ events: [], clientFinishedAt: Date.now() }),
  });
  const abandon = await fetch(fixture.baseUrl + "/api/runs/" + run.runId + "/abandon", {
    method: "POST",
    headers: otherHeaders,
    body: "{}",
  });
  for (const response of [events, snapshot, complete, abandon]) {
    assert.equal(response.status, 404);
    assert.deepEqual((await response.json()).error, {
      code: "RUN_NOT_FOUND",
      message: "Run not found.",
      retryable: false,
    });
  }
});

test("malformed, oversized, invalid, and expired requests use stable safe errors", async () => {
  const fixture = await startFixture();
  const cookie = await fixture.signIn();
  const headers = { Cookie: cookie, "Content-Type": "application/json" };

  const malformed = await fetch(fixture.baseUrl + "/api/runs", {
    method: "POST",
    headers,
    body: "{\"catId\":",
  });
  assert.equal(malformed.status, 400);
  assert.deepEqual((await malformed.json()).error, {
    code: "BAD_JSON",
    message: "Request body must be valid JSON.",
    retryable: false,
  });

  const oversized = await fetch(fixture.baseUrl + "/api/me/nickname", {
    method: "PATCH",
    headers,
    body: JSON.stringify({ nickname: "x".repeat(20000) }),
  });
  assert.equal(oversized.status, 413);
  assert.equal((await oversized.json()).error.code, "PAYLOAD_TOO_LARGE");

  const tooLong = await fetch(fixture.baseUrl + "/api/me/nickname", {
    method: "PATCH",
    headers,
    body: JSON.stringify({ nickname: "x".repeat(81) }),
  });
  assert.equal(tooLong.status, 400);
  assert.equal((await tooLong.json()).error.code, "NICKNAME_TOO_LONG");

  const invalidCat = await fetch(fixture.baseUrl + "/api/runs", {
    method: "POST",
    headers,
    body: JSON.stringify({ catId: "not-a-cat" }),
  });
  assert.equal(invalidCat.status, 400);
  assert.equal((await invalidCat.json()).error.code, "INVALID_CAT_ID");

  const created = await fetch(fixture.baseUrl + "/api/runs", {
    method: "POST",
    headers,
    body: JSON.stringify({ catId: "white" }),
  });
  const run = await created.json();
  const invalidEvent = await fetch(fixture.baseUrl + "/api/runs/" + run.runId + "/complete", {
    method: "POST",
    headers,
    body: JSON.stringify({
      events: [
        { seq: 0, type: "run_started", occurredAtMs: 0, payload: { seed: run.seed, catId: run.catId } },
        { seq: 1, type: "unsafe_event", occurredAtMs: 1, payload: {} },
      ],
      clientFinishedAt: Date.now(),
    }),
  });
  assert.equal(invalidEvent.status, 422);
  assert.deepEqual((await invalidEvent.json()).error, {
    code: "SCORE_EVENT_INVALID",
    message: "Event type is not allowed.",
    retryable: false,
    reason: "EVENT_TYPE_INVALID",
  });

  const invalidFall = await fetch(fixture.baseUrl + "/api/runs/" + run.runId + "/complete", {
    method: "POST",
    headers,
    body: JSON.stringify({
      events: [
        {
          seq: 0,
          type: "run_started",
          occurredAtMs: 0,
          payload: {
            seed: run.seed,
            catId: run.catId,
            patternVersion: "cat-runner-patterns-v3",
          },
        },
        {
          seq: 1,
          type: "fall_damage",
          occurredAtMs: 1,
          payload: { gapId: "unknown-gap", damage: 999 },
        },
      ],
      clientFinishedAt: Date.now(),
    }),
  });
  assert.equal(invalidFall.status, 422);
  assert.deepEqual((await invalidFall.json()).error, {
    code: "SCORE_EVENT_INVALID",
    message: "Fall gap does not exist in the server manifest.",
    retryable: false,
    reason: "GAP_UNKNOWN",
  });

  await fetch(fixture.baseUrl + "/auth/signout", {
    headers: { Cookie: cookie },
    redirect: "manual",
  });
  const expiredSession = await fetch(fixture.baseUrl + "/api/leaderboard", {
    headers: { Cookie: cookie },
  });
  assert.equal(expiredSession.status, 401);
  assert.equal((await expiredSession.json()).error.code, "AUTH_REQUIRED");
});

test("unknown APIs and internal errors never expose paths, stacks, or secrets", async () => {
  const fixture = await startFixture({
    dependencies: {
      leaderboardRepository: {
        getTopLeaderboardEntries() {
          throw new Error("secret filesystem path C:\\private\\token");
        },
      },
    },
  });
  const unknown = await fetch(fixture.baseUrl + "/api/does-not-exist");
  assert.equal(unknown.status, 404);
  assert.deepEqual((await unknown.json()).error, {
    code: "NOT_FOUND",
    message: "API endpoint not found.",
    retryable: false,
  });

  const cookie = await fixture.signIn();
  const internal = await fetch(fixture.baseUrl + "/api/leaderboard", {
    headers: { Cookie: cookie },
  });
  assert.equal(internal.status, 500);
  const body = await internal.json();
  assert.deepEqual(body.error, {
    code: "INTERNAL_ERROR",
    message: "Internal server error.",
    retryable: true,
  });
  assert.doesNotMatch(JSON.stringify(body), /secret|private|token|stack/i);
});
