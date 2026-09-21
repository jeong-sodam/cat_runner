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
      "AND excluded.distance_m > best_scores.distance_m)",
  ).run(userId, score, distanceM, achievedAt);

  return getBestScore(db, userId);
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

module.exports = { getBestScore, upsertIfBetter, getTopScores };
