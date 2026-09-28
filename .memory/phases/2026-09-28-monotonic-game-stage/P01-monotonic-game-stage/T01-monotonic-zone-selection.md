# Task: T01 Monotonic Zone Selection

## Status: done

## Goal

Change the client game-zone update path so a run keeps the highest zone it has reached even if a later score recalculation is lower. Keep current score computation and exact threshold values unchanged.

## Decision Summary

- `zoneId` is monotonic within a run and governs the background, difficulty, obstacle patterns, and rhythm targets.
- Existing score thresholds and ascending zone order remain unchanged.
- New state starts at `home_day`; an existing snapshot continues with its saved `zoneId`.

## Implementation

### I01. Add monotonic zone selection

- Related Files:
  - `public/js/game/world.js` :: `selectZoneForScore`; modify
  - `public/js/game/patterns.js` :: `ZONE_DEFINITIONS`; read-only source of zone IDs and `minScore` values

#### Details

- **Signature**: Change the existing helper to accept the current zone as an optional second argument while preserving one-argument callers:

  ```js
  function selectZoneForScore(score, currentZoneId = "home_day")
  ```

- **Zone candidate**: Continue selecting the score-derived candidate with the existing inclusive thresholds in descending order:
  - `score >= ZONE_DEFINITIONS.home_night.minScore` -> `home_night`
  - otherwise `score >= ZONE_DEFINITIONS.outside.minScore` -> `outside`
  - otherwise `home_day`
- **Monotonic comparison**: Compare the candidate and current zone using their `ZONE_DEFINITIONS[zoneId].minScore` values. Return the candidate only when its rank is greater than or equal to the current zone rank; otherwise return the normalized current zone.
- **Invalid current-zone fallback**: If `currentZoneId` is not a key in `ZONE_DEFINITIONS`, treat it as `home_day` for the comparison and return path. Do not introduce a new persisted field or a second stage state variable.
- **Compatibility**: `selectZoneForScore(score)` must continue to return the same values at scores `799`, `800`, `3599`, and `3600`.

### I02. Preserve the highest zone in score updates

- Related Files:
  - `public/js/game/scoring.js` :: `updateScore`; modify
  - `public/js/game/state.js` :: `createGameState`, `resetRunState`; read-only verification of initial/reset state
  - `public/js/app/app-controller.js` :: `snapshotGameState`, `initializeGame`; read-only verification of snapshot preservation

#### Details

- Keep `calculateScore()` unchanged.
- In `updateScore(state)`, calculate `state.score` exactly as today, then call `selectZoneForScore(state.score, state.zoneId)` rather than replacing `state.zoneId` from the score alone.
- Keep returning the numeric score from `updateScore`.
- Do not alter the `zoneId` initialization in `createGameState`; it must remain `home_day`.
- Do not alter `resetRunState`; it must continue to rebuild a fresh state and reset the zone to `home_day`.
- Do not strip or rewrite `zoneId` in snapshot serialization/restoration. The existing JSON snapshot and `Object.assign` restore path must preserve a reached `outside` or `home_night` zone.

#### Execution Flow / Logic

1. Compute the score using the existing mouse, distance, active-effect, rhythm bonus, and rhythm multiplier inputs.
2. Read the current `state.zoneId` as the minimum allowed zone for this run.
3. Resolve the score-derived zone with the monotonic selector.
4. Assign the resulting zone to `state.zoneId`.
5. Return `state.score`.

## Acceptance Criteria

- [ ] A state at `outside` remains `outside` after `updateScore` recalculates a score below `800`.
- [ ] A state at `home_night` remains `home_night` after `updateScore` recalculates a score below `3600`.
- [ ] Scores at `800` and `3600` still advance to `outside` and `home_night` respectively.
- [ ] New and reset runs still start at `home_day`.
- [ ] No score formula, difficulty multiplier, pattern contract, or server validation behavior changes.

## Validation

- `node --test test/game-systems.test.js test/game-core.test.js`

## Commit Message

```text
fix(game): prevent stage regression after score drops

Plan: 2026-09-28-monotonic-game-stage
Phase: P01-monotonic-game-stage
Task: T01-monotonic-zone-selection

- keep the highest reached zone during a run
- preserve existing score thresholds and reset behavior
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: d3f646e
