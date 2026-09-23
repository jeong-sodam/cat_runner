const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const { createApp } = require("../src/server");
const { closeDatabase } = require("../src/db/database");
const { getOrCreateUserFromClaims } = require("../src/services/user-service");
const runService = require("../src/services/run-service");
const { createServerManifest } = require("../src/game/server-pattern-manifest");

const fixtures = new Set();

async function startApp(overrides = {}) {
  const app = createApp(
    {
      port: 0,
      databasePath: ":memory:",
      sessionSecret: "run-test-secret",
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
        idTokenClaims: { oid: "object-1", tid: "tenant-1" },
        account: { username: "runner@example.test" },
      }),
      ...overrides,
    },
  );
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const port = server.address().port;
  const fixture = { app, server, baseUrl: "http://127.0.0.1:" + port };
  fixtures.add(fixture);
  return fixture;
}

function cookieFrom(response) {
  const value =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()[0]
      : response.headers.get("set-cookie");
  return value ? value.split(";")[0] : "";
}

async function signIn(fixture) {
  const response = await fetch(fixture.baseUrl + "/auth/callback?code=run-test", {
    redirect: "manual",
  });
  return cookieFrom(response);
}

afterEach(async () => {
  for (const fixture of [...fixtures]) {
    await new Promise((resolve, reject) =>
      fixture.server.close((error) => (error ? reject(error) : resolve())),
    );
    closeDatabase(fixture.app.locals.database);
    fixtures.delete(fixture);
  }
});

test("run lifecycle stores ordered events and snapshots for its owner", async () => {
  const fixture = await startApp();
  const cookie = await signIn(fixture);
  const headers = { Cookie: cookie, "Content-Type": "application/json" };
  const created = await fetch(fixture.baseUrl + "/api/runs", {
    method: "POST",
    headers,
    body: JSON.stringify({ catId: "black" }),
  });
  assert.equal(created.status, 201);
  const run = await created.json();
  assert.equal(run.catId, "black");
  assert.ok(run.runId);
  assert.ok(run.seed);

  const events = await fetch(fixture.baseUrl + "/api/runs/" + run.runId + "/events", {
    method: "POST",
    headers,
    body: JSON.stringify({
      events: [
        { seq: 0, type: "run_started", occurredAtMs: 0, payload: { catId: "black" } },
        { seq: 1, type: "mouse_collected", occurredAtMs: 125, payload: { points: 10 } },
      ],
    }),
  });
  assert.deepEqual(await events.json(), { acceptedThroughSeq: 1 });

  const snapshot = await fetch(fixture.baseUrl + "/api/runs/" + run.runId + "/snapshot", {
    method: "PUT",
    headers,
    body: JSON.stringify({
      snapshotVersion: 1,
      snapshot: { catId: "black", worldOffset: 420, score: 14, health: 30 },
    }),
  });
  assert.equal(snapshot.status, 200);

  const resumable = await fetch(fixture.baseUrl + "/api/runs/resumable", {
    headers: { Cookie: cookie },
  });
  const payload = await resumable.json();
  assert.equal(payload.run.runId, run.runId);
  assert.equal(payload.run.snapshot.worldOffset, 420);
  assert.deepEqual(payload.run.events.map((event) => event.seq), [0, 1]);
});

test("a user cannot mutate another user's active run", async () => {
  const fixture = await startApp({
    codeRedeemer: async () => ({
      idTokenClaims: { oid: "object-" + Math.random(), tid: "tenant-1" },
      account: { username: "runner-" + Math.random() + "@example.test" },
    }),
  });
  const firstCookie = await signIn(fixture);
  const headers = { Cookie: firstCookie, "Content-Type": "application/json" };
  const created = await fetch(fixture.baseUrl + "/api/runs", {
    method: "POST",
    headers,
    body: JSON.stringify({ catId: "white" }),
  });
  const run = await created.json();
  const secondCookie = await signIn(fixture);
  const response = await fetch(fixture.baseUrl + "/api/runs/" + run.runId + "/events", {
    method: "POST",
    headers: { Cookie: secondCookie, "Content-Type": "application/json" },
    body: JSON.stringify({ events: [] }),
  });
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, "RUN_NOT_FOUND");
});

test("expired runs are abandoned and cannot be resumed", () => {
  const db = require("../src/db/database").openDatabase(":memory:");
  require("../src/db/migrate").migrateDatabase(db);
  const user = getOrCreateUserFromClaims(db, { oid: "expire", tid: "tenant", email: "expire@example.test" });
  runService.startRun(db, {
    userId: user.id,
    catId: "chaos",
    now: 1000,
    expiresAt: 2000,
    idFactory: () => "expired-run",
    seedFactory: () => "seed",
  });
  assert.equal(runService.getResumableRun(db, user.id, { now: 2000 }), null);
  assert.equal(require("../src/db/repositories/run-repository").findById(db, "expired-run").status, "abandoned");
  closeDatabase(db);
});

test("completion endpoint stores an authoritative score and personal best", async () => {
  const fixture = await startApp();
  const cookie = await signIn(fixture);
  const headers = { Cookie: cookie, "Content-Type": "application/json" };
  const created = await fetch(fixture.baseUrl + "/api/runs", {
    method: "POST",
    headers,
    body: JSON.stringify({ catId: "black" }),
  });
  const run = await created.json();
  const manifest = createServerManifest(run.seed);
  const obstacles = manifest.entities.filter((entity) => entity.type === "obstacle").slice(0, 1);
  const events = [
    { seq: 0, type: "run_started", occurredAtMs: 0, payload: { seed: run.seed, catId: run.catId } },
    { seq: 1, type: "distance_checkpoint", occurredAtMs: 100, payload: { distanceM: 12 } },
    ...obstacles.map((obstacle, index) => ({
      seq: index + 2,
      type: "obstacle_collision",
      occurredAtMs: 200 + index * 10,
      payload: { entityId: obstacle.id },
    })),
    { seq: obstacles.length + 2, type: "run_gameover", occurredAtMs: 240, payload: {} },
  ];
  const completed = await fetch(fixture.baseUrl + "/api/runs/" + run.runId + "/complete", {
    method: "POST",
    headers,
    body: JSON.stringify({ events, clientFinishedAt: Date.now(), score: 999999, distanceM: 999999 }),
  });
  assert.equal(completed.status, 200);
  const payload = await completed.json();
  assert.deepEqual(payload.result, {
    score: 12,
    distanceM: 12,
    mouseCount: 0,
    isPersonalBest: true,
    rank: 1,
  });
});

test("run sync preserves event order and flushes events before snapshots", async () => {
  const { createLocalRunStore } = await import("../public/js/sync/local-run-store.js");
  const { createRunSync } = await import("../public/js/sync/run-sync.js");
  const storage = new Map();
  const store = createLocalRunStore({
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  });
  const calls = [];
  const api = {
    startRun: async () => ({ runId: "sync-run", catId: "black", seed: "seed", expiresAt: 5000 }),
    appendEvents: async (_runId, events) => {
      calls.push({ type: "events", events });
      return { acceptedThroughSeq: events[events.length - 1].seq };
    },
    saveSnapshot: async (_runId, version, snapshot) => {
      calls.push({ type: "snapshot", version, snapshot });
    },
  };
  const sync = createRunSync(api, store, {
    now: () => 1000,
    autoRetry: false,
  });

  await sync.startRun({ userId: 7, catId: "black" });
  sync.recordEvent("run_started", 0, { seed: "seed" });
  sync.recordEvent("mouse_collected", 25, { points: 10 });
  sync.saveSnapshot({ catId: "black", worldOffset: 300, score: 10 });
  assert.deepEqual(store.load().pendingEvents.map((event) => event.seq), [0, 1, 2]);

  assert.equal(await sync.flush(), true);
  assert.deepEqual(calls.map((call) => call.type), ["events", "snapshot"]);
  assert.deepEqual(calls[0].events.map((event) => event.seq), [0, 1, 2]);
  assert.deepEqual(store.load().pendingEvents, []);
});

test("offline sync pauses persistence and resumes after a successful reconnect", async () => {
  const { createLocalRunStore } = await import("../public/js/sync/local-run-store.js");
  const { createRunSync } = await import("../public/js/sync/run-sync.js");
  const storage = new Map();
  const store = createLocalRunStore({
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  });
  let eventCalls = 0;
  const onlineStates = [];
  const sync = createRunSync(
    {
      startRun: async () => ({ runId: "offline-run", catId: "white", seed: "seed", expiresAt: 5000 }),
      appendEvents: async (_runId, events) => {
        eventCalls += 1;
        assert.deepEqual(events.map((event) => event.seq), [0, 1]);
        return { acceptedThroughSeq: 1 };
      },
      saveSnapshot: async () => {},
    },
    store,
    {
      now: () => 1000,
      autoRetry: false,
      onOnline: (state) => onlineStates.push(state.offline),
    },
  );
  await sync.startRun({ userId: 3, catId: "white" });
  sync.recordEvent("run_started", 0, {});
  sync.handleOffline({ catId: "white", score: 3 });
  assert.equal(sync.getState().offline, true);
  assert.equal(store.load().snapshot.score, 3);
  assert.equal(await sync.handleOnline(), true);
  assert.equal(eventCalls, 1);
  assert.deepEqual(onlineStates, [false]);
  assert.equal(sync.getState().offline, false);
});

test("resume candidate requires matching unexpired server and local runs", async () => {
  const { createLocalRunStore } = await import("../public/js/sync/local-run-store.js");
  const { createRunSync } = await import("../public/js/sync/run-sync.js");
  const storage = new Map();
  const store = createLocalRunStore({
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  });
  store.save({
    runId: "resume-run",
    userId: 9,
    catId: "chaos",
    expiresAt: 5000,
    snapshotVersion: 1,
    snapshot: { worldOffset: 900, score: 22 },
    pendingEvents: [{ seq: 2, type: "mouse_collected", occurredAtMs: 90, payload: {} }],
  });
  const sync = createRunSync({}, store, { now: () => 2000, autoRetry: false });
  const candidate = sync.getLocalResumeCandidate(
    {
      runId: "resume-run",
      userId: 9,
      catId: "chaos",
      seed: "resume-seed",
      expiresAt: 5000,
      snapshot: { worldOffset: 800, score: 18 },
      events: [{ seq: 1 }],
    },
    9,
  );
  assert.ok(candidate);
  const restored = sync.continueRun(candidate);
  assert.equal(restored.seed, "resume-seed");
  assert.equal(restored.snapshot.worldOffset, 900);
  assert.deepEqual(restored.pendingEvents.map((event) => event.seq), [2]);
  assert.equal(
    sync.getLocalResumeCandidate({ ...candidate.serverRun, expiresAt: 2000 }, 9),
    null,
  );
});

test("local best records replace only when score or earlier time improves", async () => {
  const { LOCAL_BEST_KEY, createLocalRunStore } = await import("../public/js/sync/local-run-store.js");
  const storage = new Map();
  const store = createLocalRunStore({
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  });

  assert.equal(store.bestKey, LOCAL_BEST_KEY);
  assert.equal(store.saveLocalBest({
    score: 10,
    distanceM: 5,
    mouseCount: 2,
    rhythmAccuracy: 80,
    catId: "black",
    achievedAt: 200,
  }), true);
  assert.equal(store.saveLocalBest({
    score: 10,
    distanceM: 4,
    achievedAt: 100,
  }), true);
  assert.equal(store.saveLocalBest({
    score: 10,
    distanceM: 5,
    achievedAt: 100,
  }), false);
  assert.deepEqual(store.getLocalBest(), {
    score: 10,
    distanceM: 4,
    mouseCount: 0,
    rhythmAccuracy: 0,
    catId: "black",
    achievedAt: 100,
  });
  store.clearLocalBest();
  assert.equal(store.getLocalBest(), null);
});

test("local score history keeps all records and exposes a top five view", async () => {
  const { LOCAL_HISTORY_KEY, LOCAL_SCORES_KEY, LOCAL_LAST_RESULT_KEY, createLocalRunStore } = await import("../public/js/sync/local-run-store.js");
  const storage = new Map();
  const store = createLocalRunStore({
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  });

  for (const [score, distanceM, achievedAt, catId] of [
    [20, 10, 5, "black"],
    [50, 4, 4, "white"],
    [50, 6, 3, "calico"],
    [40, 20, 2, "cheese"],
    [30, 10, 1, "mackerel"],
    [10, 100, 0, "chaos"],
  ]) {
    assert.equal(store.saveLocalResult({ score, distanceM, achievedAt, catId }).saved, true);
  }
  assert.deepEqual(
    store.getLocalScores().map((record) => [record.score, record.distanceM, record.catId]),
    [
      [50, 6, "calico"],
      [50, 4, "white"],
      [40, 20, "cheese"],
      [30, 10, "mackerel"],
      [20, 10, "black"],
    ],
  );
  assert.equal(store.getLocalHistory().length, 6);
  assert.equal(store.getLocalHistory()[0].catId, "calico");
  assert.equal(store.getLocalRank({ score: 10, distanceM: 100, achievedAt: 0, catId: "chaos" }), 6);

  const latest = { score: 1, distanceM: 1, achievedAt: 99, catId: "chaos" };
  assert.equal(store.saveLocalResult(latest).rank, 7);
  assert.equal(store.saveLastResult(latest), true);
  assert.deepEqual(store.getLastResult(), {
    score: 1,
    distanceM: 1,
    mouseCount: 0,
    rhythmAccuracy: 0,
    catId: "chaos",
    achievedAt: 99,
  });
  assert.equal(store.getLocalRank(store.getLastResult()), 7);
  assert.equal(storage.has(LOCAL_HISTORY_KEY), true);
  assert.equal(storage.has(LOCAL_SCORES_KEY), true);
  assert.equal(storage.has(LOCAL_LAST_RESULT_KEY), true);
});

test("local score history migrates legacy data and clears malformed data safely", async () => {
  const { LOCAL_BEST_KEY, LOCAL_HISTORY_KEY, LOCAL_SCORES_KEY, LOCAL_LAST_RESULT_KEY, createLocalRunStore } = await import("../public/js/sync/local-run-store.js");
  const storage = new Map([
    [LOCAL_BEST_KEY, JSON.stringify({ score: 12, distanceM: 3, catId: "white", achievedAt: 10 })],
    [LOCAL_LAST_RESULT_KEY, "not-json"],
  ]);
  const store = createLocalRunStore({
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  });

  assert.deepEqual(store.getLocalScores(), [{
    score: 12,
    distanceM: 3,
    mouseCount: 0,
    rhythmAccuracy: 0,
    catId: "white",
    achievedAt: 10,
  }]);
  assert.equal(storage.has(LOCAL_SCORES_KEY), true);
  assert.equal(storage.has(LOCAL_HISTORY_KEY), true);
  assert.deepEqual(store.getLocalBest(), store.getLocalScores()[0]);
  assert.equal(store.getLastResult(), null);
  store.clearLocalBest();
  assert.equal(store.getLocalScores().length, 0);
});

test("local score history migrates an existing top-five array without losing records", async () => {
  const { LOCAL_HISTORY_KEY, LOCAL_SCORES_KEY, createLocalRunStore } = await import("../public/js/sync/local-run-store.js");
  const legacyScores = [
    { score: 30, distanceM: 3, catId: "black", achievedAt: 30 },
    { score: 20, distanceM: 2, catId: "white", achievedAt: 20 },
  ];
  const storage = new Map([[LOCAL_SCORES_KEY, JSON.stringify(legacyScores)]]);
  const store = createLocalRunStore({
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  });

  assert.deepEqual(store.getLocalHistory().map((record) => record.score), [30, 20]);
  assert.equal(storage.has(LOCAL_HISTORY_KEY), true);
});

test("local score history stays available in memory when storage rejects writes", async () => {
  const { createLocalRunStore } = await import("../public/js/sync/local-run-store.js");
  const store = createLocalRunStore({
    getItem: () => null,
    setItem: () => { throw new Error("storage blocked"); },
    removeItem() {},
  });

  for (const score of [10, 20, 30, 40, 50, 60]) {
    const result = store.saveLocalResult({ score, distanceM: score / 2, achievedAt: score });
    assert.equal(result.saved, true);
    assert.equal(result.persisted, false);
    assert.equal(result.warning, true);
  }
  assert.deepEqual(store.getLocalScores().map((record) => record.score), [60, 50, 40, 30, 20]);
  assert.equal(store.getLocalHistory().length, 6);
  assert.equal(store.getLocalRank({ score: 10, distanceM: 5, achievedAt: 10 }), 6);
  assert.equal(store.saveLastResult({ score: 10, distanceM: 5, achievedAt: 10 }), true);
  assert.equal(store.getLastResult().score, 10);
  assert.deepEqual(store.getStorageStatus(), { persistent: false, warning: true });
});
