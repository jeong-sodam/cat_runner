const { getSessionUser, requireAuth } = require("../auth/auth-middleware");
const { setNickname } = require("../services/user-service");
const userRepository = require("../db/repositories/user-repository");

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
  };
}

function registerUserRoutes(app, { db, config }) {
  app.get("/api/me", (request, response) => {
    const sessionUser = getSessionUser(request);
    if (!sessionUser) {
      if (config && !config.authConfigured) {
        return response.status(503).json({
          error: {
            code: "AUTH_CONFIG_MISSING",
            message: "Microsoft Entra ID configuration is missing.",
          },
        });
      }
      return response.json({ authenticated: false });
    }

    const user = userRepository.findById(db, sessionUser.userId);
    if (!user) {
      request.session.destroy(() => {});
      return response.json({ authenticated: false });
    }

    return response.json({ authenticated: true, user: publicUser(user) });
  });

  app.patch("/api/me/nickname", requireAuth, (request, response, next) => {
    try {
      const user = setNickname(
        db,
        request.session.user.userId,
        request.body?.nickname,
      );
      request.session.user.nickname = user.nickname;
      return response.json({ user: publicUser(user) });
    } catch (error) {
      return next(error);
    }
  });
}

module.exports = { registerUserRoutes };
