function mapRun(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    catId: row.cat_id,
    seed: row.seed,
    status: row.status,
    score: row.score,
    distanceM: row.distance_m,
    mouseCount: row.mouse_count,
    snapshot: row.snapshot_json ? JSON.parse(row.snapshot_json) : null,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
    completedAt: row.completed_at,
  };
}

function findById(db, runId) {
  return mapRun(db.prepare("SELECT * FROM runs WHERE id = ?").get(runId));
}

function createRun(
  db,
  { id, userId, catId, seed, now = Date.now(), expiresAt },
) {
  db.prepare(
    "INSERT INTO runs " +
      "(id, user_id, cat_id, seed, status, score, distance_m, mouse_count, " +
      "snapshot_json, started_at, updated_at, expires_at, completed_at) " +
      "VALUES (@id, @userId, @catId, @seed, 'active', NULL, NULL, NULL, " +
      "NULL, @now, @now, @expiresAt, NULL)",
  ).run({ id, userId, catId, seed, now, expiresAt });

  return findById(db, id);
}

function saveSnapshot(db, runId, snapshot, now = Date.now()) {
  const result = db
    .prepare(
      "UPDATE runs SET snapshot_json = ?, updated_at = ? " +
        "WHERE id = ? AND status = 'active'",
    )
    .run(JSON.stringify(snapshot), now, runId);

  return result.changes > 0 ? findById(db, runId) : null;
}

function findEvents(db, runId) {
  return db
    .prepare(
      "SELECT seq, type, occurred_at_ms, payload_json, created_at " +
        "FROM run_events WHERE run_id = ? ORDER BY seq ASC",
    )
    .all(runId)
    .map((row) => ({
      seq: row.seq,
      type: row.type,
      occurredAtMs: row.occurred_at_ms,
      payload: JSON.parse(row.payload_json),
      createdAt: row.created_at,
    }));
}

function appendEvents(db, runId, events, now = Date.now()) {
  if (!Array.isArray(events)) {
    throw new TypeError("events must be an array");
  }

  const seen = new Set();
  let previousSeq = null;
  for (const event of events) {
    if (
      !Number.isInteger(event.seq) ||
      seen.has(event.seq) ||
      typeof event.type !== "string" ||
      !Number.isInteger(event.occurredAtMs) ||
      event.occurredAtMs < 0 ||
      !event.payload ||
      typeof event.payload !== "object"
    ) {
      throw new TypeError("invalid run event");
    }
    if (previousSeq !== null && event.seq <= previousSeq) {
      throw new TypeError("events must be ordered by sequence");
    }
    seen.add(event.seq);
    previousSeq = event.seq;
  }

  const transaction = db.transaction(() => {
    const run = db.prepare("SELECT status FROM runs WHERE id = ?").get(runId);
    if (!run || run.status !== "active") {
      throw new Error("run is not active");
    }

    const maxRow = db
      .prepare(
        "SELECT COALESCE(MAX(seq), -1) AS max_seq " +
          "FROM run_events WHERE run_id = ?",
      )
      .get(runId);
    if (events.some((event) => event.seq <= maxRow.max_seq)) {
      throw new Error("event sequence must increase");
    }

    const insert = db.prepare(
      "INSERT INTO run_events " +
        "(run_id, seq, type, occurred_at_ms, payload_json, created_at) " +
        "VALUES (?, ?, ?, ?, ?, ?)",
    );

    for (const event of events) {
      insert.run(
        runId,
        event.seq,
        event.type,
        event.occurredAtMs,
        JSON.stringify(event.payload),
        now,
      );
    }

    db.prepare("UPDATE runs SET updated_at = ? WHERE id = ?").run(now, runId);
  });

  transaction();
  return findEvents(db, runId);
}

function findResumableRun(db, userId, now = Date.now()) {
  return mapRun(
    db
      .prepare(
        "SELECT * FROM runs " +
          "WHERE user_id = ? AND status = 'active' AND expires_at > ? " +
          "ORDER BY updated_at DESC LIMIT 1",
      )
      .get(userId, now),
  );
}

function expireActiveRuns(db, now = Date.now()) {
  return db
    .prepare(
      "UPDATE runs SET status = 'abandoned', updated_at = ? " +
        "WHERE status = 'active' AND expires_at <= ?",
    )
    .run(now, now).changes;
}

function completeRun(
  db,
  runId,
  { score, distanceM, mouseCount, completedAt = Date.now() },
) {
  const result = db
    .prepare(
      "UPDATE runs SET score = ?, distance_m = ?, mouse_count = ?, " +
        "status = 'completed', updated_at = ?, completed_at = ? " +
        "WHERE id = ? AND status = 'active'",
    )
    .run(score, distanceM, mouseCount, completedAt, completedAt, runId);

  return result.changes > 0 ? findById(db, runId) : null;
}

function abandonRun(db, runId, now = Date.now()) {
  const result = db
    .prepare(
      "UPDATE runs SET status = 'abandoned', updated_at = ? " +
        "WHERE id = ? AND status = 'active'",
    )
    .run(now, runId);

  return result.changes > 0 ? findById(db, runId) : null;
}

module.exports = {
  createRun,
  findById,
  saveSnapshot,
  appendEvents,
  findEvents,
  findResumableRun,
  expireActiveRuns,
  completeRun,
  abandonRun,
};
