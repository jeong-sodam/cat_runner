# Task: T02 Monotonic Stage Regression Tests

## Status: done

## Goal

Prove that score-derived stage advancement is monotonic within a run, that the existing threshold boundaries remain exact, and that new runs reset while restored snapshots preserve their reached zone.

## Decision Summary

- A lower score after stage advancement must not change `zoneId` to an earlier zone.
- The monotonic rule applies to the complete gameplay zone state because all consumers read `state.zoneId`.
- Pause/resume and snapshot resume preserve the zone; starting a fresh run resets it.

## Implementation

### I01. Add zone selector and score-update regression cases

- Related Files:
  - `test/game-systems.test.js` :: existing score/zone threshold tests near `score doubles mouse points...` and `zone thresholds advance...`; modify

#### Details

- Retain exact assertions for `selectZoneForScore(799) === "home_day"`, `selectZoneForScore(800) === "outside"`, `selectZoneForScore(3599) === "outside"`, and `selectZoneForScore(3600) === "home_night"`.
- Add direct monotonic-selector assertions:
  - `selectZoneForScore(799, "outside") === "outside"`.
  - `selectZoneForScore(3599, "home_night") === "home_night"`.
  - A high candidate must still advance: `selectZoneForScore(3600, "outside") === "home_night"`.
- Add an `updateScore` sequence on one state that reaches `outside`, then sets inputs producing a score below `800`, and verifies `state.zoneId` remains `outside`.
- Continue the same state to `home_night`, then produce a score below `3600` and verify it remains `home_night`.
- Keep the existing score formula assertions for ordinary and double-score inputs and the existing difficulty multiplier assertions.

### I02. Verify new-run reset and snapshot zone preservation

- Related Files:
  - `test/game-core.test.js` :: game-state initialization/reset coverage; modify
  - `test/app-flow.test.js` :: authenticated/resumed game initialization coverage; modify only if an existing controller harness can exercise the snapshot path without broad fixture changes

#### Details

- In the state tests, create a state, set `zoneId` to `home_night`, call `resetRunState` with a new seed, and assert the returned state has the new seed and `zoneId === "home_day"`.
- Verify snapshot restoration at the game-state seam with a snapshot containing `zoneId: "home_night"`; after applying the snapshot to a fresh state, assert the restored state retains `zoneId === "home_night"`. The existing public controller `startGame` intentionally forces local mode and removes its snapshot option, so exercising the server-resume path would require an unrelated controller behavior change and is outside this task.
- Assert that pausing/resuming does not mutate `zoneId`; use the existing game-loop harness if needed.

### I03. Run focused and full regression validation

- Related Files:
  - `test/game-systems.test.js` :: modified client zone tests
  - `test/game-core.test.js` :: modified state/loop tests
  - `test/app-flow.test.js` :: modified resume test, if applicable
  - `test/integration.test.js`, `test/score-validation.test.js`, `test/render.test.js`, `test/security-regression.test.js` :: read-only regression coverage

#### Details

- Run focused assertions first so failures identify monotonic progression separately from the known native SQLite cleanup-hook issue.
- Run the complete suite with test concurrency 1.
- Treat any assertion failure as blocking. If Windows emits the existing `better-sqlite3` `RemoveEnvironmentCleanupHook` native cleanup failure after assertions pass, record it as an environment-only result and do not weaken unrelated tests.

## Acceptance Criteria

- [ ] Exact zone thresholds remain covered and unchanged.
- [ ] Both backward transitions (`outside -> home_day`, `home_night -> outside`) are covered after score recalculation.
- [ ] Forward transitions still work after a prior zone is supplied.
- [ ] Fresh/reset state starts at `home_day`.
- [ ] Snapshot resume and pause/resume preserve the reached zone.
- [ ] Focused tests pass, and full-suite results are recorded.

## Validation

- `node --test test/game-systems.test.js test/game-core.test.js test/app-flow.test.js`
- `npm test`

## Commit Message

```text
test(game): lock monotonic stage progression

Plan: 2026-09-28-monotonic-game-stage
Phase: P01-monotonic-game-stage
Task: T02-monotonic-stage-regression-tests

- cover stage advancement followed by lower score recalculation
- verify new-run reset and snapshot resume invariants
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: 4a0bc21

## Validation Results

- `node --test test/game-systems.test.js test/game-core.test.js test/app-flow.test.js`: pass, 66/66.
- `npm test`: 136 total, 132 passed, 4 file-level failures (`auth`, `integration`, `run-resume`, `security-regression`). The four failures are the existing Windows/Node native `better-sqlite3` `RemoveEnvironmentCleanupHook` assertion after the test assertions pass; no feature assertion failed.
