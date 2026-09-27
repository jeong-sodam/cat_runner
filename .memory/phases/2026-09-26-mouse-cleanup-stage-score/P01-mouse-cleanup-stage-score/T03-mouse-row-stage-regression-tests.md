# Task: T03 Mouse Row and Stage Regression Tests

## Status: done

## Goal

Lock the confirmed mouse layout and score-threshold behavior with deterministic client/server tests, while proving that special formations, gaps, obstacle safety, bridge continuity, score formulas, rendering, security, and existing game contracts do not regress.

## Decision Summary

- Test ordinary fixed-row mice at `y=610` with inclusive spacing `48~58px`.
- Test stage boundaries at `799/800/3599/3600` and unchanged score awards.
- Test formations and DEX as preserved exceptions, not as ordinary-row mice.
- Keep the existing better-sqlite3 Windows cleanup-hook limitation documented separately from assertion failures.

## Implementation

### I01. Client system regression coverage

- Related Files:
  - `test/game-systems.test.js` :: route invariants, gap invariants, formation tests, zone threshold tests; modify

#### Details

- Replace the old exact `pattern.routeSpacing === 38` assertion with `routeSpacing >= 48 && routeSpacing <= 58`.
- For seeded streams in all three zones, inspect ordinary `routeKind: "continuous"` and `routeKind: "connector"` mice. Assert `y === GAME_CONFIG.groundY - 90`, width/height remain `42`, and each adjacent route x delta is within `[48, 58]` unless an obstacle/formation omission intentionally creates a gap.
- Assert ordinary route mice never strict-AABB-overlap obstacles, while gap-overlapping continuous mice remain above `groundY - 12` and gap route actions remain valid.
- Assert consecutive pattern spawning creates bridge mice at the fixed row and preserves deterministic output for the same seed.
- Assert every special formation keeps its original cell mask/count and DEX remains obstacle-suppressed.
- Update zone tests to assert `selectZoneForScore(799)`, `800`, `3599`, and `3600` map to the expected zones. Preserve difficulty values and add a score calculation assertion proving the same inputs produce the same score before/after threshold changes.

### I02. Client/server parity and integration coverage

- Related Files:
  - `test/score-validation.test.js` :: v10 manifest parity and route metadata; modify
  - `test/integration.test.js` :: server route continuity and safe gap guidance; modify

#### Details

- Update the existing parity test name and version expectation to v10.
- For deterministic seeds and all zones, compare pattern IDs, widths, relative entity x/y, dimensions, IDs, route fields, formation fields, `routeSpacing`, required actions, gap widths/positions, and pattern start spacing.
- Add direct assertions that server ordinary and bridge mice are at y `610`, spacing falls within `[48, 58]`, obstacle-overlapping ordinary entities are absent, and formation/DEX entities remain intact.
- Keep integration assertions for immediate route visibility, staged gap guidance, and server manifest DEX behavior. Do not weaken unknown entity/gap rejection or local score validation.

### I03. Full-suite regression

- Related Files:
  - `test/game-core.test.js` :: read-only existing jump, slide, fall, and collision contracts
  - `test/render.test.js` :: read-only formation/ordinary mouse rendering contracts
  - `test/security-regression.test.js` :: read-only event ownership and unknown entity/gap rejection
  - `test/app-flow.test.js` :: read-only local score and stage flow contracts

#### Details

- Run the existing focused suites and then `npm test` with test concurrency 1.
- Treat assertion failures as blocking. If Windows emits the known native `better-sqlite3` `RemoveEnvironmentCleanupHook` assertion after all assertions pass, record it as an environment-only cleanup failure with the pass/fail counts; do not weaken tests or alter database behavior in this task.

## Acceptance Criteria

- [x] Client tests prove fixed-row spacing, obstacle omission, gap continuation, bridge continuity, and unchanged formation behavior.
- [x] Server parity tests prove v10 deterministic equivalence across zones.
- [x] Stage thresholds and unchanged score formulas are covered at exact boundaries.
- [x] Focused and full-suite results are recorded, including any environment-only native cleanup failure.

## Validation

- `node test/game-systems.test.js`
- `node test/game-core.test.js`
- `node test/render.test.js`
- `node test/integration.test.js`
- `node test/security-regression.test.js`
- `node test/score-validation.test.js`
- `node test/app-flow.test.js`
- `npm test`

## Commit Message

```text
test(game): lock mouse row and stage progression invariants

Plan: 2026-09-26-mouse-cleanup-stage-score
Phase: P01-mouse-cleanup-stage-score
Task: T03-mouse-row-stage-regression-tests

- cover fixed-row mouse spacing, obstacle gaps, and formation preservation
- protect 800/3600 stage thresholds and client/server parity
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: recorded in git history

## Validation Results

- `node test/game-systems.test.js`: pass, 31/31.
- `node test/game-core.test.js`: pass, 14/14.
- `node test/render.test.js`: pass, 18/18.
- `node test/integration.test.js`: pass, 3/3 assertions; standalone process exits cleanly in this run.
- `node test/security-regression.test.js`: ownership assertion passes, then exits on the existing Windows `better-sqlite3` `RemoveEnvironmentCleanupHook` native assertion.
- `node test/score-validation.test.js`: pass, 12/12.
- `node test/app-flow.test.js`: pass, 20/20.
- `npm test`: 129 total, 125 passed, 4 file-level failures (`auth`, `leaderboard`, `run-resume`, `security-regression`), all caused by the existing native cleanup-hook assertion after test assertions complete.
