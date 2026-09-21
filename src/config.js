const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config();

function parsePort(value) {
  const port = Number.parseInt(value ?? "3000", 10);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : 3000;
}

function optionalValue(value) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || null;
}

function loadConfig(env = process.env) {
  const databasePath = env.DATABASE_PATH?.trim() || "data/cat-runner.sqlite";
  const entraClientId = optionalValue(env.ENTRA_CLIENT_ID);
  const entraClientSecret = optionalValue(env.ENTRA_CLIENT_SECRET);
  const entraAuthority =
    optionalValue(env.ENTRA_TENANT_AUTHORITY) ||
    "https://login.microsoftonline.com/organizations";
  const entraRedirectUri =
    optionalValue(env.ENTRA_REDIRECT_URI) ||
    "http://localhost:3000/auth/callback";
  const guestMode =
    env.NODE_ENV !== "production" &&
    String(env.ENABLE_GUEST_MODE || "").toLowerCase() === "true";

  return {
    port: parsePort(env.PORT),
    databasePath: path.resolve(databasePath),
    sessionSecret: optionalValue(env.SESSION_SECRET),
    entraClientId,
    entraClientSecret,
    entraAuthority,
    entraRedirectUri,
    authConfigured: Boolean(entraClientId && entraClientSecret && entraAuthority),
    guestMode,
  };
}

module.exports = { loadConfig };
