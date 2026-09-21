function getSessionUser(request) {
  return request.session?.user || null;
}

function requireAuth(request, response, next) {
  if (!getSessionUser(request)) {
    return response.status(401).json({
      error: {
        code: "AUTH_REQUIRED",
        message: "Authentication is required.",
      },
    });
  }
  return next();
}

module.exports = { getSessionUser, requireAuth };
