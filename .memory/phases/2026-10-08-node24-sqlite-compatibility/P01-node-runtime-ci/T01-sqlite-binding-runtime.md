# Task: T01 SQLite Binding and Runtime Support

## Status: done

## Goal

Upgrade the SQLite binding so the existing application and full test suite run on Node.js 24, while formally supporting the Node.js 22 and 24 LTS lines and updating the developer prerequisite.

## Decision Summary

- Upgrade `better-sqlite3` to `^13.0.3`, the first N-API-based major release; the package requires Node.js 22 or later.
- Set the project engine range to `^22 || ^24`; Node 20 and Node 23 are outside the supported range.
- Preserve existing database schema, repository behavior, and application APIs. Do not add a migration or new functional test files.

## Implementation

### I01. Upgrade SQLite dependency and project runtime range

- Related Files:
  - `package.json` :: root dependency and `engines.node`; modify
  - `package-lock.json` :: npm lockfile v3 dependency resolution and root engine metadata; modify
  - `src/db/database.js` :: existing database construction and pragma calls; read-only
  - `src/db/repositories/*.js` :: existing prepared statement and transaction calls; read-only

#### Details

- Set `dependencies.better-sqlite3` to the semver range `^13.0.3`.
- Set `engines.node` to the exact string `^22 || ^24`. Do not leave an unbounded `>=22` range.
- Keep all other dependencies and npm scripts unchanged.
- Regenerate the root package and resolved dependency records in `package-lock.json` with npm; retain `lockfileVersion: 3`.
- Preserve the existing `Database`, `.pragma()`, `.prepare()`, `.transaction()`, `.exec()`, `.get()`, and `.run()` usage. The current schema remains unchanged.

#### Execution Flow / Logic

1. Update the dependency range and engine range in the root package manifest.
2. Regenerate the lockfile using Node.js 24.21.0 and npm, confirming the resolved `better-sqlite3` package is in major version 13.
3. Run a clean `npm ci` to verify the lockfile can install the package on the current Windows x64 development environment.
4. Run the complete existing test suite; database migration, repository, session-store, integration, resume, and security tests must all finish with exit code 0.
5. Do not change SQL, schema migrations, repositories, or application behavior to work around the old binding.

### I02. Update the documented Node prerequisite

- Related Files:
  - `README.md` :: Prerequisites bullet; modify

#### Details

- Replace `Node.js LTS (20 or newer)` with `Node.js 22 or 24 LTS`.
- Keep the npm prerequisite and all other README setup instructions unchanged.

## Acceptance Criteria

- [x] `package.json` declares `better-sqlite3: ^13.0.3` and `engines.node: ^22 || ^24`.
- [x] `package-lock.json` is consistent with the manifest and resolves `better-sqlite3` major version 13.
- [x] README clearly lists Node.js 22 or 24 as the supported local runtime.
- [x] `npm ci` succeeds on Node.js 24.21.0 on Windows x64.
- [x] `npm test` passes completely on Node.js 24.21.0; no native SQLite cleanup assertion remains.
- [x] No application logic, database schema, or data migration changes are introduced.

## Validation

- `npm.cmd ci` — clean lockfile installation succeeds on Node.js 24.21.0.
- `npm.cmd test` — all existing tests pass with exit code 0 on Node.js 24.21.0.
- `git diff --check` — no whitespace errors.

## Commit Message

```text
fix(runtime): upgrade SQLite binding for Node 24

Plan: 2026-10-08-node24-sqlite-compatibility
Phase: P01-node-runtime-ci
Task: T01-sqlite-binding-runtime

- Upgrade better-sqlite3 to the N-API based v13 line
- Declare and document Node.js 22 and 24 support
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending

### Validation Notes

- `npm.cmd ci` succeeded on Node.js v24.21.0 / Windows x64 with lockfile version 3 and resolved `better-sqlite3` 13.0.3.
- `npm.cmd test` passed: 162 tests, 0 failures. The previous native SQLite cleanup crash no longer occurs.
- npm reported 2 moderate audit findings and a deprecation warning for transitive `uuid@8.3.2`; dependency audit remediation is outside this task.
