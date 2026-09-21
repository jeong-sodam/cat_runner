const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { createApp } = require("../src/server");

let server;
let baseUrl;
let app;

before(async () => {
  app = createApp({ port: 0, databasePath: ":memory:" });
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  baseUrl = "http://127.0.0.1:" + port;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  app.locals.database.close();
});

test("health endpoint returns the service status", async () => {
  const response = await fetch(baseUrl + "/api/health");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    service: "cat-runner",
  });
});

test("index fallback serves the static game shell", async () => {
  const response = await fetch(baseUrl + "/some/future/route");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.match(await response.text(), /고양이 러너/);
});

test("unknown API routes use the JSON error contract", async () => {
  const response = await fetch(baseUrl + "/api/unknown");
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    error: {
      code: "NOT_FOUND",
      message: "API endpoint not found.",
    },
  });
});
