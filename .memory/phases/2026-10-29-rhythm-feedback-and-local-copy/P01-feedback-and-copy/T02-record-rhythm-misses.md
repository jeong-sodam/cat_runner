# Task: T02 Record Rhythm Misses

## Status: done

## Goal
Count every invalid rhythm click as one accuracy miss, keep the current target active after an invalid click, and store 400 ms hit/miss feedback events for the canvas renderer.

## Decision Summary
- A correct hit adds one hit and a `hit` feedback event. A wrong-button, off-target, or no-target click adds one miss and a `miss` event but does not consume any active target. A target timeout adds its own miss and event.
- Feedback timestamps use game `elapsedMs`; expired feedback is discarded during simulation updates and transient feedback is cleared when a saved run is restored.

## Implementation

### I01. Add feedback-event lifecycle and misclick accounting

- Related Files:
  - `public/js/game/rhythm-targets.js` :: `RHYTHM_CONFIG`, `createRhythmState`, `expireTargets`, `resolveRhythmTarget`, `updateRhythmTargets`, `getRhythmSummary` — rhythm rules, counters, and transient feedback lifecycle; modify
  - `test/game-systems.test.js` :: rhythm target timing, button matching, and multiplier tests — verify event lifecycle and scoring; modify

#### Details
- **Signatures & Types**:
  ```javascript
  const RHYTHM_CONFIG = Object.freeze({
    // existing fields unchanged
    feedbackDurationMs: 400,
  });

  function createRhythmState({ randomSource = Math.random } = {})
  function resolveRhythmTarget(state, { x, y, button, nowMs = 0 } = {})
  function recordRhythmMisclick(state, { x, y, nowMs = 0 } = {})
  function updateRhythmTargets(state, { nowMs = 0, zoneId = "home_day", canvasWidth = 960, canvasHeight = 720 } = {})
  function getRhythmSummary(state = createRhythmState())
  ```
- **Data & Schema Fields**:
  - Add `feedbackEvents: Array<{ type: "hit" | "miss", x: number, y: number, createdAtMs: number, expiresAtMs: number }>` to rhythm state. Initialize it to `[]`.
  - Add `RHYTHM_CONFIG.feedbackDurationMs: number` with value `400`.
  - Preserve existing `hitCount`, `missCount`, target fields, and accuracy/multiplier output schema.
- **Execution Flow / Logic**:
  1. Add one internal helper that appends a feedback event using the supplied logical canvas coordinates and `nowMs`; set `expiresAtMs` to `createdAtMs + feedbackDurationMs`.
  2. On a correctly matched active target, keep the current target transition and bonus behavior, increment `hitCount`, append a `hit` event at the target center, and return the target as before.
  3. Add and export `recordRhythmMisclick(state, {x, y, nowMs})`. Each invocation increments `missCount` exactly once, appends one `miss` event at the click location, returns the appended event, and leaves all target statuses unchanged. It must count even when there is no active target.
  4. When `expireTargets(state, nowMs)` changes an active target to `miss`, increment `missCount` exactly once and append a `miss` event at that target's center with the current `nowMs`. Subsequent updates must not recount the already missed target.
  5. In `updateRhythmTargets`, remove feedback events whose `expiresAtMs <= nowMs`; do not change target spawn intervals, target lifetime, or active-target count.
  6. Keep the existing accuracy equation `hitCount / (hitCount + missCount)` with zero accuracy when there are no attempts. Thus each wrong click lowers accuracy, a later hit can still count as a hit, and a later timeout adds another miss.
- **Error & Exception Handling**: Keep existing target matching and expiry behavior. Ignore malformed/missing `feedbackEvents` arrays safely when updating older/restored rhythm state; do not allow invalid optional event values to throw during cleanup.
- **State Transition & Return**: `resolveRhythmTarget` continues returning the hit target or `null`. Miss-click accounting is explicit through `recordRhythmMisclick`; timeouts remain target state transitions from `active` to `miss`.

### I02. Connect pointer results to rhythm state and restore behavior

- Related Files:
  - `public/js/app/app-controller.js` :: imports, `initializeGame`, rhythm `onPointerDown` callback — route rejected clicks to miss accounting and clear stale transient effects on resume; modify
  - `test/app-flow.test.js` :: gameplay pointer and saved-run resume flows — verify app integration; modify

#### Details
- **Signatures & Types**:
  ```javascript
  function initializeGame(catId = "black", runOptions = {})
  // pointer callback input: { x: number, y: number, button: "primary" | "secondary" }
  ```
- **Data & Schema Fields**:
  - No saved-score schema or snapshot version changes. Preserve `rhythm.hitCount`, `rhythm.missCount`, active target data, and all score fields.
- **Execution Flow / Logic**:
  1. Import `recordRhythmMisclick` from `../game/rhythm-targets.js`.
  2. Keep pause-hitbox handling first and ignore pointer input whenever `gameState.status !== "running"`.
  3. Call `resolveRhythmTarget` as today. On a returned target, recalculate score as today. On `null`, call `recordRhythmMisclick(gameState.rhythm, {x, y, nowMs: gameState.elapsedMs})`, then recalculate score so the new miss immediately affects the rhythm multiplier and score.
  4. Every accepted primary/secondary pointer-down in running gameplay that fails the target/button match counts once, including a click outside all targets and a click when none is active. A wrong click does not deactivate the active target. A subsequent correct hit or timeout is recorded independently.
  5. After assigning a saved snapshot to a newly created game state, clear only `gameState.rhythm.feedbackEvents` before resuming. Do not clear hit/miss counters or active targets; the brief visual effect must not replay after a reload.
  6. Keep invalid browser pointer buttons rejected by `createInputController`; this change applies only to pointer callbacks that already reach the game.
- **Error & Exception Handling**: Do not record clicks while paused, ready, or game-over. Preserve the pause-button early return so clicking pause never becomes a rhythm miss.
- **State Transition & Return**: Correct hits keep existing score transitions; rejected clicks now increment rhythm misses immediately while preserving the target; restored games keep durable rhythm state but start with no transient feedback.

## Acceptance Criteria
- [x] Correct hits append one timed `hit` event; every rejected gameplay pointer click appends one timed `miss` event and increments misses once.
- [x] Misclicks leave targets active; a later hit succeeds; a later timeout counts a separate miss only once.
- [x] Accuracy and score multiplier reflect misclicks using the existing hit/(hit+miss) formula.
- [x] Feedback events expire after 400 ms of game time and are not replayed after saved-run restoration.
- [x] Pause, target timing, bonus points, and saved record schemas remain unchanged.

## Validation
- `npm.cmd test` — rhythm-system, pointer-flow, pause, and saved-run tests pass.
- `git diff --check` — no whitespace errors.

## Commit Message
```text
feat(rhythm): count misses and record feedback events

Plan: 2026-10-29-rhythm-feedback-and-local-copy
Phase: P01-feedback-and-copy
Task: T02-record-rhythm-misses

- Count each rejected gameplay click as a rhythm miss
- Store expiring hit and miss feedback events
```

## Progress
- [x] 구현 완료
- [x] 검증 통과 (`npm.cmd test`: 111/111; `git diff --check`)
- commit: pending
