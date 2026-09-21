function mapScore(row) {
  if (!row) {
    return null;
  }

  return {
    userId: row.user_id,
    score: row.score,
    distanceM: row.distance_m,
    achievedAt: row.achieved_at,
  };
}

function getBestScore(db, userId) {
  return mapScore(
    db.prepare("SELECT * FROM best_scores WHERE user_id = ?").get(userId),
  );
}

function upsertIfBetter(
  db,
  userId,
  { score, distanceM, achievedAt = Date.now() },
) {
  db.prepare(
    "INSERT INTO best_scores (user_id, score, distance_m, achieved_at) " +
      "VALUES (?, ?, ?, ?) " +
      "ON CONFLICT(user_id) DO UPDATE SET " +
      "score = excluded.score, distance_m = excluded.distance_m, " +
      "achieved_at = excluded.achieved_at " +
      "WHERE excluded.score > best_scores.score " +
      "OR (excluded.score = best_scores.score " +
      "AND (excluded.distance_m > best_scores.distance_m " +
      "OR (excluded.distance_m = best_scores.distance_m " +
      "AND excluded.achieved_at < best_scores.achieved_at)))",
  ).run(userId, score, distanceM, achievedAt);

  return getBestScore(db, userId);
}

function getRankForUser(db, userId) {
  const best = getBestScore(db, userId);
  if (!best) {
    return null;
  }
  const row = db
    .prepare(
      "SELECT COUNT(*) + 1 AS rank FROM best_scores " +
        "WHERE score > ? " +
        "OR (score = ? AND distance_m > ?) " +
        "OR (score = ? AND distance_m = ? AND achieved_at < ?)",
    )
    .get(
      best.score,
      best.score,
      best.distanceM,
      best.score,
      best.distanceM,
      best.achievedAt,
    );
  return row.rank;
}

function getTopScores(db, limit = 10) {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
  return db
    .prepare(
      "SELECT * FROM best_scores " +
        "ORDER BY score DESC, distance_m DESC, achieved_at ASC LIMIT ?",
    )
    .all(safeLimit)
    .map(mapScore);
}

function getTopLeaderboardEntries(db, limit = 10) {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
  return db
    .prepare(
      "SELECT best_scores.user_id, " +
        "COALESCE(users.nickname, '이름 없음') AS nickname, " +
        "users.email, best_scores.score, best_scores.distance_m, " +
        "best_scores.achieved_at " +
        "FROM best_scores INNER JOIN users ON users.id = best_scores.user_id " +
        "ORDER BY best_scores.score DESC, best_scores.distance_m DESC, " +
        "best_scores.achieved_at ASC LIMIT ?",
    )
    .all(safeLimit)
    .map((row) => ({
      userId: row.user_id,
      nickname: row.nickname,
      email: row.email,
      score: row.score,
      distanceM: row.distance_m,
      achievedAt: row.achieved_at,
    }));
}

module.exports = {
  getBestScore,
  getRankForUser,
  getTopLeaderboardEntries,
  upsertIfBetter,
  getTopScores,
};
