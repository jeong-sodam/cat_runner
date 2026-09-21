const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { afterEach, test } = require("node:test");
const { openDatabase, closeDatabase } = require("../src/db/database");
const { migrateDatabase } = require("../src/db/migrate");
const userRepository = require("../src/db/repositories/user-repository");
const runRepository = require("../src/db/repositories/run-repository");
const leaderboardRepository = require("../src/db/repositories/leaderboard-repository");
const { SQLiteSessionStore } = require("../src/auth/sqlite-session-store");

const databases = new Set();
const temporaryDirectories = new Set();

function createMemoryDatabase() {
  const db = openDatabase(":memory:");
  migrateDatabase(db);
  databases.add(db);
  return db;
}

function createUser(db, suffix = "one") {
  return userRepository.createUser(db, {
    entraSubject: "tenant:" + suffix,
    tenantId: "tenant",
    email: suffix + "@example.test",
    now: 1000,
  });
}

afterEach(() => {
  for (const db of databases) {
    closeDatabase(db);
  }
  databases.clear();
  for (const directory of temporaryDirectories) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
  temporaryDirectories.clear();
});

test("migration creates all tables and indexes idempotently", () => {
  const db = createMemoryDatabase();
  migrateDatabase(db);

  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master " +
        "WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all()
    .map((row) => row.name);
  assert.deepEqual(tables, [
    "best_scores",
    "run_events",
    "runs",
    "sessions",
    "users",
  ]);

  const indexes = db
    .prepare(
      "SELECT name FROM sqlite_master " +
        "WHERE type = 'index' AND name LIKE 'idx_%' ORDER BY name",
    )
    .all()
    .map((row) => row.name);
  assert.deepEqual(indexes, [
    "idx_best_scores_rank",
    "idx_run_events_run_seq",
    "idx_runs_expires_at",
    "idx_runs_user_status",
  ]);
});

test("user repository creates, finds, and updates duplicate-safe nicknames", () => {
  const db = createMemoryDatabase();
  const user = createUser(db);
  assert.equal(user.email, "one@example.test");
  assert.equal(userRepository.findByEntraSubject(db, "tenant:one").id, user.id);

  const updated = userRepository.updateNickname(db, user.id, "같은 고양이", 2000);
  assert.equal(updated.nickname, "같은 고양이");

  const other = createUser(db, "two");
  userRepository.updateNickname(db, other.id, "같은 고양이", 3000);
  assert.equal(userRepository.findById(db, other.id).nickname, "같은 고양이");

  assert.throws(
    () => createUser(db),
    /UNIQUE constraint failed: users\.entra_subject/,
  );
});

test("run event insertion is transactional and rejects duplicate sequence", () => {
  const db = createMemoryDatabase();
  const user = createUser(db);
  runRepository.createRun(db, {
    id: "run-1",
    userId: user.id,
    catId: "black",
    seed: "seed-1",
    now: 1000,
    expiresAt: 9000,
  });

  runRepository.appendEvents(db, "run-1", [
    {
      seq: 0,
      type: "run_started",
      occurredAtMs: 0,
      payload: { seed: "seed-1" },
    },
  ]);

  assert.throws(
    () =>
      runRepository.appendEvents(db, "run-1", [
        { seq: 1, type: "mouse_collected", occurredAtMs: 10, payload: {} },
        { seq: 1, type: "grass_collected", occurredAtMs: 11, payload: {} },
      ]),
    /invalid run event/,
  );
  assert.equal(runRepository.findEvents(db, "run-1").length, 1);

  assert.throws(
    () =>
      runRepository.appendEvents(db, "run-1", [
        { seq: 0, type: "distance_checkpoint", occurredAtMs: 20, payload: {} },
      ]),
    /event sequence must increase/,
  );
  assert.equal(runRepository.findEvents(db, "run-1").length, 1);
});

test("resumable run ignores expired state and completion stores result", () => {
  const db = createMemoryDatabase();
  const user = createUser(db);
  runRepository.createRun(db, {
    id: "active-run",
    userId: user.id,
    catId: "white",
    seed: "seed-active",
    now: 1000,
    expiresAt: 5000,
  });
  runRepository.createRun(db, {
    id: "expired-run",
    userId: user.id,
    catId: "black",
    seed: "seed-expired",
    now: 1000,
    expiresAt: 2000,
  });

  assert.equal(
    runRepository.findResumableRun(db, user.id, 2500).id,
    "active-run",
  );
  assert.equal(runRepository.findResumableRun(db, user.id, 6000), null);

  const completed = runRepository.completeRun(db, "active-run", {
    score: 42,
    distanceM: 32.5,
    mouseCount: 1,
    completedAt: 4000,
  });
  assert.equal(completed.status, "completed");
  assert.equal(completed.score, 42);
});

test("leaderboard keeps only better score and orders ties by distance then time", () => {
  const db = createMemoryDatabase();
  const first = createUser(db, "first");
  const second = createUser(db, "second");
  const third = createUser(db, "third");

  leaderboardRepository.upsertIfBetter(db, first.id, {
    score: 100,
    distanceM: 10,
    achievedAt: 300,
  });
  leaderboardRepository.upsertIfBetter(db, second.id, {
    score: 100,
    distanceM: 20,
    achievedAt: 400,
  });
  leaderboardRepository.upsertIfBetter(db, third.id, {
    score: 100,
    distanceM: 20,
    achievedAt: 200,
  });
  leaderboardRepository.upsertIfBetter(db, first.id, {
    score: 90,
    distanceM: 99,
    achievedAt: 100,
  });

  assert.deepEqual(
    leaderboardRepository.getTopScores(db).map((row) => row.userId),
    [third.id, second.id, first.id],
  );
  assert.equal(leaderboardRepository.getRankForUser(db, third.id), 1);
  assert.equal(leaderboardRepository.getRankForUser(db, second.id), 2);
  assert.equal(leaderboardRepository.getRankForUser(db, first.id), 3);
  assert.equal(leaderboardRepository.getBestScore(db, first.id).score, 100);
});

test("sqlite session store persists, touches, and destroys sessions across reopen", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "cat-runner-db-"));
  temporaryDirectories.add(directory);
  const databasePath = path.join(directory, "sessions.sqlite");
  const firstDb = openDatabase(databasePath);
  migrateDatabase(firstDb);
  const firstStore = new SQLiteSessionStore(firstDb);
  const sessionData = { cookie: { maxAge: 60000 }, userId: 7 };

  firstStore.set("sid-1", sessionData, (error) => assert.ifError(error));
  closeDatabase(firstDb);

  const secondDb = openDatabase(databasePath);
  migrateDatabase(secondDb);
  const secondStore = new SQLiteSessionStore(secondDb);
  secondStore.get("sid-1", (error, stored) => {
    assert.ifError(error);
    assert.equal(stored.userId, 7);
  });
  secondStore.touch("sid-1", sessionData, (error) => assert.ifError(error));
  secondStore.destroy("sid-1", (error) => assert.ifError(error));
  secondStore.get("sid-1", (error, stored) => {
    assert.ifError(error);
    assert.equal(stored, null);
  });
  closeDatabase(secondDb);
});
