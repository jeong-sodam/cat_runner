const assert = require("node:assert/strict");
const { test } = require("node:test");

test("local active runs persist without a user id", async () => {
  const { createLocalRunStore } = await import("../public/js/sync/local-run-store.js");
  const storage = new Map();
  const store = createLocalRunStore({
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  });

  assert.equal(store.saveLocalRun({
    runId: "local-run",
    catId: "chaos",
    seed: "local-seed",
    snapshotVersion: 1,
    snapshot: { score: 42, zoneId: "outside" },
    savedAt: 123,
  }), true);
  assert.deepEqual(store.loadLocalRun(), {
    mode: "local",
    runId: "local-run",
    catId: "chaos",
    seed: "local-seed",
    snapshotVersion: 1,
    snapshot: { score: 42, zoneId: "outside" },
    savedAt: 123,
  });
  assert.equal("userId" in store.loadLocalRun(), false);
  assert.equal("expiresAt" in store.loadLocalRun(), false);
});

test("local active runs generate an internal run id when omitted", async () => {
  const { createLocalRunStore } = await import("../public/js/sync/local-run-store.js");
  const storage = new Map();
  const store = createLocalRunStore({
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  });

  assert.equal(store.saveLocalRun({
    catId: "white",
    seed: "generated-seed",
    snapshotVersion: 1,
    snapshot: { score: 0 },
    savedAt: 456,
  }), true);
  assert.match(store.loadLocalRun().runId, /^local-\d+-white$/);
});

test("invalid local active runs are cleared safely", async () => {
  const { createLocalRunStore } = await import("../public/js/sync/local-run-store.js");
  const invalidRecords = [
    "not-json",
    { mode: "server", runId: "server-run" },
    { mode: "local", catId: "black", seed: "seed", snapshotVersion: 1, snapshot: {} },
    { mode: "local", runId: "local-run", seed: "seed", snapshotVersion: 1, snapshot: {} },
    { mode: "local", runId: "local-run", catId: "black", snapshotVersion: 1, snapshot: {} },
    { mode: "local", runId: "local-run", catId: "black", seed: "seed", snapshotVersion: 2, snapshot: {} },
    { mode: "local", runId: "local-run", catId: "black", seed: "seed", snapshotVersion: 1, snapshot: [] },
  ];

  for (const invalidRecord of invalidRecords) {
    const storage = new Map([[
      "cat-runner:active-run",
      typeof invalidRecord === "string"
        ? invalidRecord
        : JSON.stringify(invalidRecord),
    ]]);
    const store = createLocalRunStore({
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    });

    assert.equal(store.loadLocalRun(), null);
    assert.equal(storage.has("cat-runner:active-run"), false);
  }
});

test("clearing a local active run preserves completed score history", async () => {
  const { LOCAL_HISTORY_KEY, createLocalRunStore } = await import("../public/js/sync/local-run-store.js");
  const storage = new Map([
    ["cat-runner:active-run", JSON.stringify({
      mode: "local",
      runId: "local-run",
      catId: "black",
      seed: "seed",
      snapshotVersion: 1,
      snapshot: { score: 1 },
      savedAt: 1,
    })],
    [LOCAL_HISTORY_KEY, JSON.stringify([{ score: 10 }])],
  ]);
  const store = createLocalRunStore({
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  });

  store.clearLocalRun();

  assert.equal(storage.has("cat-runner:active-run"), false);
  assert.equal(storage.has(LOCAL_HISTORY_KEY), true);
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
    rhythmAccuracy: 0.8,
    rhythmMultiplier: 1.3,
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
    rhythmMultiplier: 0.5,
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
    rhythmMultiplier: 0.5,
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
    rhythmMultiplier: 0.5,
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
