const express = require("express");
const crypto = require("node:crypto");
const path = require("node:path");
const { loadConfig } = require("./config");
const session = require("express-session");
const { openDatabase } = require("./db/database");
const { migrateDatabase } = require("./db/migrate");
const { SQLiteSessionStore } = require("./auth/sqlite-session-store");
const { createMsalClient } = require("./auth/msal-client");
const { registerAuthRoutes } = require("./auth/auth-routes");
const { registerUserRoutes } = require("./routes/user-routes");
const { registerRunRoutes } = require("./routes/run-routes");
const { registerLeaderboardRoutes } = require("./routes/leaderboard-routes");
const { closeDatabase } = require("./db/database");
const {
  apiError,
  errorHandler,
  notFoundHandler,
} = require("./middleware/error-handler");

function createApp(config = loadConfig(), dependencies = {}) {
  const appConfig = { ...loadConfig(), ...config };
  const app = express();
  const publicDirectory = path.resolve(__dirname, "..", "public");
  const database = dependencies.db || openDatabase(appConfig.databasePath);
  migrateDatabase(database);
  const sessionStore = new SQLiteSessionStore(database);
  const sessionSecret =
    appConfig.sessionSecret || crypto.randomBytes(32).toString("hex");
  const msalClient =
    dependencies.msalClient === undefined
      ? createMsalClient(appConfig)
      : dependencies.msalClient;

  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));
  app.use(
    session({
      store: sessionStore,
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 86400000,
      },
    }),
  );
  registerAuthRoutes(app, {
    config: appConfig,
    db: database,
    msalClient,
    authUrlBuilder: dependencies.authUrlBuilder,
    codeRedeemer: dependencies.codeRedeemer,
  });
  registerUserRoutes(app, { db: database, config: appConfig });
  registerRunRoutes(app, {
    db: database,
    runService: dependencies.runService,
    clock: dependencies.clock,
  });
  registerLeaderboardRoutes(app, {
    db: database,
    leaderboardRepository: dependencies.leaderboardRepository,
  });
  app.use(express.static(publicDirectory));

  app.locals.database = database;
  app.locals.ownsDatabase = !dependencies.db;

  app.get("/api/health", (_request, response) => {
    response.status(200).json({ ok: true, service: "cat-runner" });
  });

  app.use((request, response, next) => {
    if (request.method !== "GET" || request.path.startsWith("/api/")) {
      return next();
    }
    return response.sendFile(path.join(publicDirectory, "index.html"));
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

function startServer(config = loadConfig()) {
  const app = createApp(config);
  const server = app.listen(config.port, () => {
    console.log("Cat Runner listening on http://localhost:" + config.port);
  });
  const signals = ["SIGINT", "SIGTERM"];
  const shutdown = () => {
    server.close(() => {
      if (app.locals.ownsDatabase) {
        closeDatabase(app.locals.database);
      }
    });
  };
  for (const signal of signals) {
    process.once(signal, shutdown);
  }
  server.once("close", () => {
    for (const signal of signals) {
      process.removeListener(signal, shutdown);
    }
  });
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { apiError, createApp, startServer };
