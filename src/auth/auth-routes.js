const {
  buildAuthUrl,
  redeemAuthorizationCode,
} = require("./msal-client");
const { getOrCreateUserFromClaims } = require("../services/user-service");
const { sendApiError } = require("../middleware/error-handler");

function sendError(response, status, code, message) {
  return sendApiError(response, status, code, message);
}

function registerAuthRoutes(app, dependencies) {
  const {
    config,
    db,
    msalClient,
    authUrlBuilder = buildAuthUrl,
    codeRedeemer = redeemAuthorizationCode,
  } = dependencies;

  app.get("/auth/signin", async (_request, response, next) => {
    if (!config.authConfigured || !msalClient) {
      return sendError(
        response,
        503,
        "AUTH_CONFIG_MISSING",
        "Microsoft Entra ID configuration is missing.",
      );
    }

    try {
      const url = await authUrlBuilder(msalClient, config);
      return response.redirect(url);
    } catch (error) {
      return next(error);
    }
  });

  app.get("/auth/callback", async (request, response, next) => {
    if (!config.authConfigured || !msalClient) {
      return sendError(
        response,
        503,
        "AUTH_CONFIG_MISSING",
        "Microsoft Entra ID configuration is missing.",
      );
    }
    if (request.query.error) {
      return sendError(response, 401, "AUTH_FAILED", "Sign-in was not completed.");
    }
    if (typeof request.query.code !== "string" || !request.query.code) {
      return sendError(response, 400, "AUTH_CODE_MISSING", "Authorization code is missing.");
    }

    try {
      const tokenResponse = await codeRedeemer(
        msalClient,
        config,
        request.query.code,
      );
      const claims = {
        ...(tokenResponse.idTokenClaims || {}),
        ...(tokenResponse.account || {}),
      };
      const user = getOrCreateUserFromClaims(db, claims);
      request.session.user = {
        userId: user.id,
        entraSubject: user.entraSubject,
        tenantId: user.tenantId,
        email: user.email,
        nickname: user.nickname,
      };
      return response.redirect("/");
    } catch (error) {
      return next(error);
    }
  });

  app.get("/auth/signout", (request, response, next) => {
    if (!request.session) {
      return response.redirect("/");
    }
    request.session.destroy((error) => {
      if (error) {
        return next(error);
      }
      return response.redirect("/");
    });
  });
}

module.exports = { registerAuthRoutes };
