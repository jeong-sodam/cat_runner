# Task: T04 Documentation and Regression Coverage

## Status: pending

## Goal

Make clone-and-run instructions accurate for configuration-independent local mode, document deferred login and local resume, and run focused plus full regression validation.

## Decision Summary

- A clone can start local play without copying/editing .env.
- Entra setup remains optional documentation for future authenticated use.
- Local records/runs are browser-specific and not shared through the server leaderboard.

## Implementation

### I01. Update setup and acceptance documentation

- Related Files:
  - README.md :: prerequisites, local setup, Entra, guest, and auth behavior; modify
  - .env.example :: comments clarifying local play does not require it; modify only if needed
  - docs/manual-acceptance.md :: setup/auth/recovery checklist; modify

#### Details

- Make Copy-Item .env.example .env and Entra values optional for local play.
- Document first access with no .env changes: choice screen, local play to cat selection, login development notice.
- Document browser-only results, no server ID/shared leaderboard, 이어하기 / 새 게임, indefinite retention, 1-second autosave, and pagehide save.
- Keep optional Entra app registration and backend notes. Clarify ENABLE_GUEST_MODE is not required for browser-local play or its UI entry.
- Add manual acceptance for clone-without-.env, local start, refresh/reopen resume, new-game discard, local result persistence, and login notice.

### I02. Run complete regression validation

- Related Files:
  - test/app-flow.test.js :: final uncovered regressions; modify only if needed
  - test/run-resume.test.js :: final uncovered regressions; modify only if needed
  - test/auth.test.js, test/server.test.js, test/integration.test.js :: read-only targets

#### Details

- Run focused auth/app/storage tests, then npm.cmd test.
- Confirm no local UI path calls /auth/guest, the server starts without .env, and public/index.html is served.
- Report known Windows/Node better-sqlite3 cleanup-hook failures accurately if assertions pass but file-level cleanup fails.

## Acceptance Criteria

- [ ] README/manual acceptance no longer require .env edits for local play.
- [ ] Future/legacy Entra setup remains documented.
- [ ] Local resume/discard/persistence/deferred-login behavior is documented.
- [ ] Focused and full test commands are run and results recorded.

## Validation

- node --test test/app-flow.test.js test/run-resume.test.js test/auth.test.js test/server.test.js test/integration.test.js
- npm.cmd test

## Commit Message

    docs(test): document and verify configuration-free local play

    Plan: 2026-09-29-optional-login-local-play
    Phase: P01-optional-login-local-play
    Task: T04-documentation-and-regression-coverage

    - document clone-and-run local mode and deferred login
    - run focused and full regression coverage

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
