const { createApp } = require("../../src/server");
const { closeDatabase } = require("../../src/db/database");
const {
  createTestDatabasePath,
  removeTestDatabasePath,
} = require("./test-database");

function cookieFrom(response) {
  const value =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()[0]
      : response.headers.get("set-cookie");
  return value ? value.split(";")[0] : "";
}

async function createTestApp(options = {}) {
  const database = createTestDatabasePath();
  const identity = {
    oid: "fake-user-a",
    tid: "fake-tenant",
    email: "cat-a@example.com",
    ...(options.identity || {}),
  };
  const clock = {
    value: options.now ?? Date.now(),
    now() {
      return this.value;
    },
  };
  const app = createApp(
    {
      port: 0,
      databasePath: database.databasePath,
      sessionSecret: "fake-auth-test-secret",
      authConfigured: true,
      entraClientId: "fake-client-id",
      entraClientSecret: "fake-client-secret",
      entraAuthority: "https://login.microsoftonline.com/organizations",
      entraRedirectUri: "http://localhost:3000/auth/callback",
      ...(options.config || {}),
    },
    {
      msalClient: {},
      authUrlBuilder: async () => "https://login.example.test/authorize",
      codeRedeemer: async () => ({
        idTokenClaims: { oid: identity.oid, tid: identity.tid },
        account: { username: identity.email },
      }),
      clock,
      ...(options.dependencies || {}),
    },
  );
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const fixture = {
    app,
    server,
    baseUrl: "http://127.0.0.1:" + server.address().port,
    clock,
    setIdentity(nextIdentity) {
      Object.assign(identity, nextIdentity);
    },
    async signIn() {
      const response = await fetch(this.baseUrl + "/auth/callback?code=fake-code", {
        redirect: "manual",
      });
      return cookieFrom(response);
    },
    async close() {
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      closeDatabase(app.locals.database);
      removeTestDatabasePath(database.directory);
    },
  };
  return fixture;
}

module.exports = { createTestApp, cookieFrom };
