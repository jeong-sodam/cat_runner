const { requireAuth } = require("../auth/auth-middleware");
const leaderboardRepository = require("../db/repositories/leaderboard-repository");

function registerLeaderboardRoutes(app, dependencies = {}) {
  const repository = dependencies.leaderboardRepository || leaderboardRepository;

  app.get("/api/leaderboard", requireAuth, (request, response, next) => {
    try {
      const rows = repository.getTopLeaderboardEntries(dependencies.db, 10);
      return response.json({
        entries: rows.map((row, index) => ({
          rank: index + 1,
          nickname: row.nickname,
          email: row.email,
          score: row.score,
          distanceM: row.distanceM,
          achievedAt: row.achievedAt,
        })),
      });
    } catch (error) {
      return next(error);
    }
  });
}

module.exports = { registerLeaderboardRoutes };
