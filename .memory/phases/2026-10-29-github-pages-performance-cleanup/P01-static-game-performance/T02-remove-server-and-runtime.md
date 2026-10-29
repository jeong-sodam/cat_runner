# Task: T02 Remove Server and Runtime Stack

## Status: pending

## Goal
Remove the unused Node/Express application and server-only dependencies/configuration while leaving a clean Node 24 test command for contributors and updating project instructions to describe browser-local play.

## Decision Summary
- Delete all backend runtime and Render files after T01 removes the browser app's references.
- Keep Node 24 metadata and the Node test runner only for repository development/CI. The public site is static and does not run npm on visitors' devices.

## Implementation

### I01. Delete backend implementation, fixtures, and deployment configuration

- Related Files:
  - `src/**` — all Express, Entra authentication, SQLite, API routes, server validation, and server services — delete
  - `test/auth.test.js`, `test/db.test.js`, `test/integration.test.js`, `test/leaderboard.test.js`, `test/run-resume.test.js`, `test/score-validation.test.js`, `test/security-regression.test.js`, `test/server.test.js` — backend-only suites — delete
  - `test/helpers/fake-auth.js`, `test/helpers/test-database.js` — backend test helpers — delete
  - `.env.example` — server environment variables — delete
  - `render.yaml` — Render Node web service — delete
  - `.gitignore` — remove only obsolete `.env.example`, SQLite data, and server log ignore entries; modify

#### Details
- **Data & Schema Fields**:
  - Remove the server-owned SQLite `users`, `runs`, `run_events`, `sessions`, and leaderboard schemas with their entire backend directory; browser localStorage records are not part of this deletion.
- **Execution Flow / Logic**:
  1. Delete the complete `src/` tree; no file under `public/` or retained game tests imports it after T01.
  2. Delete the listed server test suites and helpers. In `test/app-flow.test.js`, retain only the local scenarios specified by T01.
  3. Delete `.env.example` and `render.yaml`; keep historical decision records under `.memory/decisions/` as audit history.
  4. Remove `.env`, `.env.*`, `!.env.example`, `data/*.sqlite*`, and `logs/` ignore rules from `.gitignore`; keep the `node_modules` rule.
  5. Keep `.nvmrc` at `24` and the existing Node compatibility test workflow's Node 24 matrix; these serve contributors and test runners.
- **Error & Exception Handling**: No server fallback or local database is recreated. Browser-local persistence remains available through `public/js/sync/local-run-store.js`.

### I02. Reduce package metadata to the retained test runner and rewrite developer guidance

- Related Files:
  - `package.json` :: root scripts/engines/dependencies — modify
  - `package-lock.json` :: root package lock — regenerate after package metadata changes
  - `README.md` :: player and contributor instructions — modify
  - `docs/development.md` :: browser gameplay checks and developer/test guide — modify

#### Details
- **Signatures & Types**:
  ```json
  {
    "name": "cat-runner",
    "version": "0.1.0",
    "private": true,
    "description": "A cartoon cat endless runner for the web",
    "scripts": {
      "test": "node --test --test-concurrency=1"
    },
    "engines": {
      "node": "^24"
    }
  }
  ```
- **Execution Flow / Logic**:
  1. Remove `main`, `start`, `dev`, and production `dependencies` from `package.json`; preserve the package identity and Node 24 engine for development tests.
  2. Regenerate `package-lock.json` so its root package has no dependencies and retains the Node engine declaration.
  3. Rewrite README for players: link to `https://jeong-sodam.github.io/cat_runner/`, explain browser-local play/records, and state that visitors do not install Node.
  4. Rewrite developer documentation to explain Node 24 is only for running `npm test`; retain the browser gameplay/manual checklist, remove Entra, guest API, SQLite reset, Render setup and server endpoint instructions.
  5. Keep documentation UTF-8 Korean text readable; do not include secret placeholders or removed server commands.
- **Error & Exception Handling**: A clean `npm ci` must succeed with no backend packages; `npm test` remains the only root script.

## Acceptance Criteria
- [ ] No `src/`, Render manifest, server environment sample, or backend-only test suite remains.
- [ ] Root package has no runtime dependencies and retains Node 24 test metadata.
- [ ] README and developer guide describe static local play, local records, and contributor-only Node testing.
- [ ] Retained browser game tests still run from a clean install.

## Validation
- `npm ci` — installs the dependency-free test project from the lockfile.
- `npm test` — all retained tests pass.

## Commit Message
```text
chore(server): remove the unused backend stack

Plan: 2026-10-29-github-pages-performance-cleanup
Phase: P01-static-game-performance
Task: T02-remove-server-and-runtime

- Delete Express, authentication, SQLite, API, and Render code
- Retain Node 24 test tooling and document browser-only play
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
