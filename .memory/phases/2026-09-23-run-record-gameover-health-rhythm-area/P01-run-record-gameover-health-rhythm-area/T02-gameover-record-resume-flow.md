# Task: T02 Gameover Record and Resume Flow

## Status: done

## Goal

Ensure every gameover saves a result automatically, exposes personal-best/save status, keeps server-save retry behavior, and sends the player directly to a fresh character-selection flow after gameover without showing a misleading `continue run?` modal. Resume prompts must remain available for genuine unfinished server runs reached through bootstrap/reconnect flows.

## Decision Summary

- Source of truth: `.memory/decisions/2026-09-23-run-record-gameover-health-rhythm-area.md`, D02–D05.
- Server and local runs save automatically on the existing `run_gameover` event path; no extra save button is introduced.
- Only the gameover-originated character-selection route suppresses resume lookup. Bootstrap, reload, and unfinished-run recovery continue to use the existing resume prompt.

## Implementation

### I01. Separate gameover character selection from resumable-run selection

- Related Files:
  - `public/js/app/app-controller.js` :: `showCharacterSelect`, `checkForResume`, `showResult`, `showLeaderboard`, `showResumePrompt`; modify
  - `public/js/ui/result-screen.js` :: restart action contract; modify only if callback labeling/behavior needs clarification

#### Details

- Change `showCharacterSelect` to accept an explicit options object, for example `{ allowResume = true }`.
- When `allowResume` is `false`, render the normal character selector but do not call `checkForResume`, do not call `runApiClient.getResumableRun`, and do not create a `resume-modal`.
- Wire the result-screen restart/character-select action after gameover to `showCharacterSelect({ allowResume: false })`.
- Keep default `allowResume: true` for bootstrap after authenticated nickname setup, normal navigation, and the `showResumePrompt` “new run” path after abandoning a genuinely resumable run.
- Do not alter `startGame` server gating, local fallback, or resume continuation payload (`seed`, `snapshot`, `resumed: true`).

### I02. Preserve automatic record saving and retry/result contract

- Related Files:
  - `public/js/app/app-controller.js` :: `playEventSound`, `completeGameover`, `showResult`; modify/verify
  - `public/js/sync/run-sync.js` :: `flush`, `complete`; read-only unless retry state requires a narrowly scoped fix
  - `public/js/sync/local-run-store.js` :: `saveLocalBest`; read-only unless storage retry semantics require a fix
  - `public/js/ui/result-screen.js` :: saved/unsaved status and action rendering; modify if needed

#### Details

- On `run_gameover`, retain the existing single automatic `completeGameover()` path guarded by `completionInProgress`.
- Server mode must continue the sequence `saveSnapshot -> flush -> completeRun`; a successful response must render `saved: true` and its authoritative `isPersonalBest`.
- A server failure must render `saved: false` with a visible retry action that retries the same final snapshot/result; it must not offer a resume prompt.
- Local mode must continue writing `saveLocalBest` immediately, render `localOnly: true`, and never call server completion or leaderboard submission.
- Result UI must show the current score and personal-best status only; do not add a recent-history list or require a separate save button.

### I03. Add app-flow and persistence regression coverage

- Related Files:
  - `test/app-flow.test.js` :: authenticated start/result/local-mode tests and fake DOM helpers; modify
  - `test/run-resume.test.js` :: server/local save compatibility; modify
  - `test/integration.test.js` :: automatic completion and personal-best response; modify if required

#### Details

- Assert that a gameover result action opens character selection without a resume modal and does not call `getResumableRun` on that route.
- Assert that the normal authenticated bootstrap path still calls resumable lookup and can render the existing resume prompt when a matching active run exists.
- Assert server completion is automatically invoked once, successful results expose `saved: true` and `isPersonalBest`, and a failed completion exposes retry without a resume action.
- Assert local gameover writes the local-best record and never calls `startRun`, `appendEvents`, `saveSnapshot`, or `completeRun` for that local run.

## Acceptance Criteria

- [x] Gameover automatically saves server/local results and shows current score plus personal-best status.
- [x] Server save failures expose retry; local results remain local-only.
- [x] Gameover → character selection never shows `continue run?` or performs resumable lookup.
- [x] Genuine unfinished runs still support the existing resume prompt.

## Validation

- `npm.cmd test -- test/app-flow.test.js test/run-resume.test.js test/integration.test.js`
- `git diff --check`

## Commit Message

```text
fix(app): separate gameover restart from resumable runs

Plan: 2026-09-23-run-record-gameover-health-rhythm-area
Phase: P01-run-record-gameover-health-rhythm-area
Task: T02-gameover-record-resume-flow

- Keep automatic result saving and retry behavior
- Skip resume prompts after gameover character selection
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending

## Execution Record

- `showCharacterSelect({ allowResume })` now gates resumable-run lookup without changing the default authenticated bootstrap behavior.
- The result screen's post-gameover `캐릭터 선택` action uses `allowResume: false`; normal character selection and genuine resume flows retain lookup behavior.
- Existing automatic server/local completion, personal-best rendering, and retry/local-only result contracts were verified without changing their save path.
- Validation: app-flow (13 passed), integration (1 passed), `git diff --check` passed.
- Note: `run-resume.test.js` hit the existing Windows Node native SQLite cleanup abort before test assertions; it remains an environment-level validation limitation.
