const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function createTestDatabasePath() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "cat-runner-test-"));
  return {
    directory,
    databasePath: path.join(directory, "cat-runner.sqlite"),
  };
}

function removeTestDatabasePath(directory) {
  fs.rmSync(directory, { recursive: true, force: true });
}

module.exports = { createTestDatabasePath, removeTestDatabasePath };
