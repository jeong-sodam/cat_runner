const express = require("express");
const path = require("node:path");
const { loadConfig } = require("./config");

function apiError(code, message, status = 500) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function createApp(config = loadConfig()) {
  const app = express();
  const publicDirectory = path.resolve(__dirname, "..", "public");

  app.disable("x-powered-by");
  app.use(express.json({ limit: "64kb" }));
  app.use(express.static(publicDirectory));

  app.get("/api/health", (_request, response) => {
    response.status(200).json({ ok: true, service: "cat-runner" });
  });

  app.use("/api", (_request, _response, next) => {
    next(apiError("NOT_FOUND", "API endpoint not found.", 404));
  });

  app.use((request, response, next) => {
    if (request.method !== "GET" || request.path.startsWith("/api/")) {
      return next();
    }
    return response.sendFile(path.join(publicDirectory, "index.html"));
  });

  app.use((request, _response, next) => {
    if (request.path.startsWith("/api/")) {
      return next(apiError("NOT_FOUND", "API endpoint not found.", 404));
    }
    return next(apiError("NOT_FOUND", "Page not found.", 404));
  });

  app.use((error, _request, response, _next) => {
    const status = Number.isInteger(error.status) ? error.status : 500;
    response.status(status).json({
      error: {
        code: error.code || "INTERNAL_ERROR",
        message: status >= 500 ? "Internal server error." : error.message,
      },
    });
  });

  return app;
}

function startServer(config = loadConfig()) {
  const app = createApp(config);
  return app.listen(config.port, () => {
    console.log("Cat Runner listening on http://localhost:" + config.port);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { apiError, createApp, startServer };
