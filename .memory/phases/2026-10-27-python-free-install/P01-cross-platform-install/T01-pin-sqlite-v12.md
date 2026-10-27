# Task: T01 Pin better-sqlite3 12.x

## Status: done

## Goal
Make a clean npm dependency install use a `better-sqlite3` 12.x prebuilt binary on the supported Windows x64 and macOS x64/arm64 targets, avoiding the Python-based source-build path while retaining the current SQLite API and stored database format.

## Decision Summary
- Set the declared dependency to `^12.11.1`; let npm regenerate and pin the exact resolved package in `package-lock.json`. This is the latest 12.x version published to npm at execution time; the 12.12.0 GitHub tag was not available in the npm registry.
- Preserve Node.js `^22 || ^24`, application database code, schema, SQLite file path, and Linux/Render compatibility. Normalize CSS line endings in the existing Windows layout test so the full suite remains valid on Windows checkouts.

## Implementation

### I01. Update dependency metadata and lockfile

- Related Files:
  - `package.json` :: root `dependencies` and `engines` — declare the selected SQLite dependency while preserving the supported Node range; modify.
  - `package-lock.json` :: root package metadata and `node_modules/better-sqlite3` entry — record the exact dependency resolution and transitive metadata produced by npm; modify.
  - `src/db/database.js` :: `openDatabase`, `closeDatabase` — read-only compatibility reference; do not change.
  - `src/db/migrate.js` :: `migrateDatabase` — read-only database schema reference; do not change.

#### Details
- **Signatures & Types**:
  - No application function signatures or TypeScript types change. This task changes npm dependency metadata only.
- **Data & Schema Fields**:
  - No SQLite tables, columns, keys, nullable fields, or persisted data change.
- **Execution Flow / Logic**:
  1. Precondition & Validation: Confirm current `package.json` declares `better-sqlite3` as `^13.0.3`, the lockfile resolves `13.0.3`, and `engines.node` is `^22 || ^24`.
  2. Core Processing: Run `npm.cmd install "better-sqlite3@^12.11.1"` from the repository root so npm updates the package manifest and lockfile. The manifest range must be `^12.11.1`, and the lockfile must resolve version `12.11.1` or a later compatible 12.x version. Do not loosen the range to 13.x.
  3. Error & Exception Handling: If npm reports a dependency-resolution error or uses a 13.x version, stop and resolve the package metadata before proceeding. Do not manually fabricate integrity hashes or platform binaries in the lockfile.
  4. State Transition & Return: A clean `npm.cmd ci` installs the locked dependency; the existing database module still opens SQLite, executes prepared statements/transactions, and closes the database. Existing database schema and data remain unchanged.

### I02. Verify SQLite binding load and application suite
- Related Files:
  - `test/db.test.js` :: database behavior tests — read-only; existing tests exercise database behavior.
  - `test/integration.test.js` :: HTTP and database integration tests — read-only; existing integration coverage.
  - `test/security-regression.test.js` :: security regression tests — read-only; run as part of the existing suite.
  - `test/fullscreen-layout.test.js` :: `styles` fixture — normalize CRLF to LF when reading CSS so its selector check works with Windows Git checkouts; modify.

#### Details
- Do not add new tests. In `test/fullscreen-layout.test.js`, normalize only the loaded CSS fixture with `.replace(/\r\n/g, "\n")` immediately after reading `public/styles.css`; preserve the existing test assertions and do not modify the stylesheet. Then load the native binding and run the existing test suite. The same checks must pass on the Windows, macOS Intel, macOS Apple Silicon, and Ubuntu jobs added in T02.
- Binding smoke query: `node -e "const Database = require('better-sqlite3'); const db = new Database(':memory:'); console.log(db.prepare('SELECT 1 AS ok').get().ok); db.close();"`; expected output is `1` and exit code `0`.

## Acceptance Criteria
- [ ] `package.json` declares `better-sqlite3` as `^12.11.1`; `engines.node` remains `^22 || ^24`.
- [ ] `package-lock.json` resolves a 12.x `better-sqlite3` release and is sufficient for `npm.cmd ci`.
- [ ] The SQLite binding smoke query prints `1`; `npm.cmd test` passes with the CSS line-ending normalization and without source changes to the database implementation or schema.
- [ ] Supported platform jobs can install from the lockfile and run the same existing test suite without requiring Python/compiler setup steps in the project.

## Validation
- `npm.cmd ci` — clean install from `package-lock.json` succeeds.
- `node -e "const Database = require('better-sqlite3'); const db = new Database(':memory:'); console.log(db.prepare('SELECT 1 AS ok').get().ok); db.close();"` — prints `1` and exits successfully.
- `npm.cmd test` — all existing Node tests pass.

## Commit Message
```text
fix(deps): use prebuilt SQLite binding for local installs

Plan: 2026-10-27-python-free-install
Phase: P01-cross-platform-install
Task: T01-pin-sqlite-v12

- Pin better-sqlite3 to the compatible 12.x line
- Refresh the npm lockfile without changing database code
- Normalize CSS fixture line endings in the Windows layout test
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- Validation: `npm.cmd ci` succeeded; the SQLite binding smoke query printed `1`; `npm.cmd test` passed all 162 tests after normalizing CSS fixture line endings for Windows.
- commit: see Git history
