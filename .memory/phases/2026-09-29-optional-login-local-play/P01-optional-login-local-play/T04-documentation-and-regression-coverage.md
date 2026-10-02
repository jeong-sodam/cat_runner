# Task: T04 Documentation and Regression Coverage

## Status: done (documented; platform-limited regression validation)

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

- [x] README/manual acceptance no longer require .env edits for local play.
- [x] Future/legacy Entra setup remains documented.
- [x] Local resume/discard/persistence/deferred-login behavior is documented.
- [x] Focused and full test commands are run and results recorded below; Windows Node runner/native cleanup failures are environmental.

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

- [x] Implementation complete
- [ ] Validation passed cleanly (blocked by Windows Node `spawn EPERM` and `better-sqlite3` cleanup-hook assertion; individual runnable suites and no-.env server check passed)
- commit: pending

### Validation Record

- The specified focused command and `npm.cmd test` were both run. Both could not start test files because the Node test runner failed to spawn worker processes (`spawn EPERM`).
- The focused files were retried individually with `node --test --test-isolation=none`: `app-flow` passed 26/26, `auth` 5/5, and `server` 4/4. `run-resume` passed its first 3 assertions before a Windows Node `better-sqlite3` cleanup-hook assertion aborted the process. `integration` passed its first 2 assertions before the same native cleanup abort.
- Remaining independent files were run individually: audio-pause 5/5, font-loader 2/2, text-fitting 3/3, game-core 15/15, font-layout 4/4, fullscreen-layout 5/5, db 6/6, game-systems 31/31, score-validation 12/12, render 18/18, and pause-hitbox 1/1 passed. `security-regression` and `leaderboard` also aborted at native cleanup.
- Ran `server.test.js` from the OS temp directory, which has no `.env`: all 4 tests passed, including serving the public game shell and missing-auth configuration response.
- Confirmed there are no `/auth/guest` references in `public/js`; browser-local entry does not use the guest endpoint.
- `git diff --check` passed.
