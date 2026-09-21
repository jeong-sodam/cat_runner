function migrateDatabase(db) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS users (" +
      "id INTEGER PRIMARY KEY, " +
      "entra_subject TEXT NOT NULL UNIQUE, " +
      "tenant_id TEXT NOT NULL, " +
      "email TEXT NOT NULL, " +
      "nickname TEXT NULL, " +
      "created_at INTEGER NOT NULL, " +
      "updated_at INTEGER NOT NULL" +
    ");" +
    "CREATE TABLE IF NOT EXISTS runs (" +
      "id TEXT PRIMARY KEY, " +
      "user_id INTEGER NOT NULL, " +
      "cat_id TEXT NOT NULL, " +
      "seed TEXT NOT NULL, " +
      "status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'abandoned')), " +
      "score INTEGER NULL, distance_m REAL NULL, mouse_count INTEGER NULL, " +
      "snapshot_json TEXT NULL, started_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, " +
      "expires_at INTEGER NOT NULL, completed_at INTEGER NULL, " +
      "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE" +
    ");" +
    "CREATE TABLE IF NOT EXISTS run_events (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
      "run_id TEXT NOT NULL, seq INTEGER NOT NULL, type TEXT NOT NULL, " +
      "occurred_at_ms INTEGER NOT NULL, payload_json TEXT NOT NULL, created_at INTEGER NOT NULL, " +
      "UNIQUE (run_id, seq), " +
      "FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE" +
    ");" +
    "CREATE TABLE IF NOT EXISTS best_scores (" +
      "user_id INTEGER PRIMARY KEY, score INTEGER NOT NULL, distance_m REAL NOT NULL, " +
      "achieved_at INTEGER NOT NULL, " +
      "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE" +
    ");" +
    "CREATE TABLE IF NOT EXISTS sessions (" +
      "sid TEXT PRIMARY KEY, sess TEXT NOT NULL, expired_at INTEGER NOT NULL" +
    ");" +
    "CREATE INDEX IF NOT EXISTS idx_runs_user_status ON runs(user_id, status);" +
    "CREATE INDEX IF NOT EXISTS idx_runs_expires_at ON runs(expires_at);" +
    "CREATE INDEX IF NOT EXISTS idx_run_events_run_seq ON run_events(run_id, seq);" +
    "CREATE INDEX IF NOT EXISTS idx_best_scores_rank ON best_scores(score DESC, distance_m DESC);",
  );
}

module.exports = { migrateDatabase };
