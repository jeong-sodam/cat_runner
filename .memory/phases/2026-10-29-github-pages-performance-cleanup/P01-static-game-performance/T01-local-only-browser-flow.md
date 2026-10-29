# Task: T01 Local-Only Browser Flow

## Status: done

## Goal
Make the browser app enter its existing welcome screen and run the game without any API, identity, or server-sync request, while preserving local resume, local score saving, personal records, and the local score list.

## Decision Summary
- The app is a static, local-only game. Keep the welcome screen and character-selection flow; remove login and authenticated-run branches.
- Browser local storage remains the source for resumable runs and personal records. Do not claim that records are shared across browsers or accounts.

## Implementation

### I01. Remove server-only browser controllers and route the entry flow locally

- Related Files:
  - `public/js/app/app-controller.js` :: `createAppController`, `bootstrap`, `showAuth`, `showCharacterSelect`, `completeGameover`, `playEventSound`, `initializeGame`, `startGame`, `destroy` — remove API and authenticated-run branches; modify
  - `public/js/ui/auth-screen.js` :: `renderAuthScreen`, `renderAuthConfigError` — replace with a welcome-only renderer exposing the local-play button; modify
  - `public/js/ui/nickname-screen.js` :: nickname/API onboarding — delete
  - `public/js/app/api-client.js` :: pending API result and HTTP client — delete
  - `public/js/sync/run-api-client.js` :: server run HTTP client — delete
  - `public/js/sync/run-sync.js` :: authenticated run event/snapshot synchronization — delete
  - `public/js/sync/network-monitor.js` :: server reconnection monitor — delete
  - `public/js/sync/local-run-store.js` :: local run snapshots and local score persistence — read-only; preserve behavior
  - `public/js/ui/leaderboard.js` :: local score-list path and server API path — remove server mode; keep local mode
  - `public/js/ui/result-screen.js` :: result actions — remove server-only ranking affordance and preserve personal-record navigation
  - `test/app-flow.test.js` :: browser app flow coverage — modify
  - `test/run-resume.test.js` :: remove the three frontend server-sync scenarios that import `run-sync.js`; backend resume coverage is removed with the server-only suite in T02

#### Details
- **Signatures & Types**:
  ```javascript
  function createAppController(options = {})
  async function bootstrap()
  function showWelcome()
  function showCharacterSelect({ allowResume = true } = {})
  async function startGame(catId = "black", runOptions = {})
  async function completeGameover()
  ```
- **Data & Schema Fields**:
  - Preserve local run records with the existing fields consumed by `createLocalRunStore`: `runId`, `catId`, `seed`, `mode: "local"`, `snapshotVersion`, `snapshot`.
  - Preserve score records with the existing fields: `score`, `distanceM`, `mouseCount`, `rhythmAccuracy`, `rhythmMultiplier`, `isPersonalBest`, `saved`, `catId`, `achievedAt`.
  - All app/game run modes must resolve to `"local"`; do not call `fetch`, `/api/*`, or a server sync factory.
- **Execution Flow / Logic**:
  1. `bootstrap` renders loading, waits for fonts, attempts asset preload with the existing best-effort fallback, then renders the welcome screen without checking `fetch` or requesting `/api/me`.
  2. The welcome screen has one primary local-play action and no login/development-notice action. That action opens character selection.
  3. Character selection retains local resume detection through `getLocalRunStore().loadLocalRun()`; continue restores the local snapshot and a new game clears it.
  4. `startGame` initializes only local mode. Keep page-hide and one-second local snapshots.
  5. Game over always saves the result and clears the local active run through `createLocalRunStore`; remove network retries, pending API results, authenticated snapshots/events, and server completion branches.
  6. Local score list and personal records read from local storage. Result actions must not offer a disabled shared-server ranking or call a backend.
  7. Remove dead auth/error UI exports and imports. Keep unrelated local fallback behavior when localStorage is unavailable.
- **Error & Exception Handling**: Keep existing best-effort font/asset loading and local-storage failure messages. No authentication, network, or API error state remains in the public flow.
- **State Transition & Return**: `bootstrap()` resolves to controller state with the welcome screen active; local start, resume, game-over, records, and score-list navigation continue to work.

### I02. Update app-flow coverage to assert the backend-free contract

- Related Files:
  - `test/app-flow.test.js` :: bootstrap, welcome, local resume, local result, records, and score-list tests — modify

#### Details
- Rename/update the bootstrap test so it verifies font readiness before the welcome screen and asserts that the injected fetch function is never called.
- Retain and adapt tests for local welcome-to-character selection, local resume/new game, initial/one-second/pagehide snapshots, six-cat selection, local game over, local storage failure, personal records, and local score-list rendering.
- Remove tests whose behavior is deleted: authenticated bootstrap/nickname onboarding, auth config or request error screens, login development notice, API client pending-result/401 handling, server resume checks, authenticated run setup, and server leaderboard rendering/retry.
- In `test/run-resume.test.js`, remove only the test blocks named `run sync preserves event order and flushes events before snapshots`, `offline sync pauses persistence and resumes after a successful reconnect`, and `resume candidate requires matching unexpired server and local runs`; T02 removes the remaining server-owned test file while preserving local-store coverage elsewhere.
- Assert the app can complete its local start/result flow when `fetch` is absent or throws; it must not expose auth/server failure UI.

## Acceptance Criteria
- [ ] Loading the app makes zero fetch/API calls and reaches the welcome screen after fonts settle.
- [ ] The welcome screen offers local play and no login action.
- [ ] Local resume, restart, game-over save, personal records, and local score list still work.
- [ ] No browser module imports or calls the removed API/sync modules.

## Validation
- `npm test` — all retained app-flow and browser game tests pass.

## Commit Message
```text
feat(app): make the browser game local-only

Plan: 2026-10-29-github-pages-performance-cleanup
Phase: P01-static-game-performance
Task: T01-local-only-browser-flow

- Remove authentication and server-run browser flows
- Preserve local play, resume, records, and local score history
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: d9f6a07
