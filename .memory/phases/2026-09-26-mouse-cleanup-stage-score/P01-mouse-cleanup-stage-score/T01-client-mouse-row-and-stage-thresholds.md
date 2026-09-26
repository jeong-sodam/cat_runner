# Task: T01 Client Mouse Row and Stage Thresholds

## Status: done

## Goal

Update the browser-side game generator so ordinary mice form a continuous, non-overlapping horizontal route at `y=610`, while special formations remain untouched, and make score-driven stage transitions occur at `800` and `3600` without changing score award formulas.

## Decision Summary

- Ordinary mice only: fixed row, seeded `48~58px` spacing, unchanged density.
- Obstacle-overlapping ordinary candidates are skipped; fall-gap candidates remain on the fixed row and use the existing airborne gap safety rule.
- Formation cells and DEX rendering/collection behavior are preserved.
- `outside` starts at `800`; `home_night` starts at `3600`; mouse/distance/osu score calculations stay unchanged.

## Implementation

### I01. Client constants and zone thresholds

- Related Files:
  - `public/js/game/constants.js` :: `GAME_CONFIG.mouseRouteSpacingMin`, `GAME_CONFIG.mouseRouteSpacingMax`; modify
  - `public/js/game/patterns.js` :: `ZONE_DEFINITIONS`, `PATTERN_VERSION`; modify
  - `public/js/game/world.js` :: `spawnNextPattern`, `selectZoneForScore`; read-only verification unless the route bridge requires a contract-only adjustment
  - `public/js/game/scoring.js` :: `calculateScore`, `updateScore`; read-only verification that score awards are unchanged

#### Details

- Set `GAME_CONFIG.mouseRouteSpacingMin` to `48` and `mouseRouteSpacingMax` to `58`. Do not change `groundY`, `mouseRouteCount`, mouse dimensions, score constants, or rhythm scoring.
- Change `ZONE_DEFINITIONS.outside.minScore` from `400` to `800` and `ZONE_DEFINITIONS.home_night.minScore` from `1800` to `3600`. Keep backgrounds and difficulty values unchanged.
- Bump `PATTERN_VERSION` from `cat-runner-patterns-v9` to `cat-runner-patterns-v10`.
- `selectZoneForScore(score)` must continue to choose the highest threshold at or below the score, so the exact boundaries are: `799 -> home_day`, `800 -> outside`, `3599 -> outside`, `3600 -> home_night`.

### I02. Ordinary continuous route layout

- Related Files:
  - `public/js/game/patterns.js` :: `createContinuousMouseRoute`, `createGuidedMouseRoute`, `createBridgeMouseRoute`, `createPatternStream`; modify
  - `public/js/game/world.js` :: `spawnNextPattern`; read-only verification of bridge use

#### Details

- Keep the existing signatures unless a small internal helper is needed:
  - `createContinuousMouseRoute(pattern, gaps = [], spacing = 38) -> MouseEntity[]`
  - `createGuidedMouseRoute(pattern, requiredActions = [], gaps = []) -> MouseEntity[]`
  - `createBridgeMouseRoute(fromX, toX, { spacing = 38, patternIndex = 0 } = {}) -> MouseEntity[]`
  - `createPatternStream(seed).next(zoneId = "home_day") -> Pattern`
- In `createPatternStream.next`, consume one seeded random value to choose an integer `routeSpacing` in the inclusive range `[48, 58]`, using the same placement in the random-call sequence that the server task will use. Return that value in `pattern.routeSpacing`.
- In `createContinuousMouseRoute`, clamp the incoming spacing to `[48, 58]`, create each ordinary candidate with `y: GAME_CONFIG.groundY - 90` (`610`), `width: 42`, `height: 42`, `routeKind: "continuous"`, and the existing `routeAction`/`routeIndex` metadata.
- Do not call `routeYForPoint` for ordinary continuous candidates. Keep `routeActionForPoint` so gap/obstacle guidance metadata remains available, but visual y placement is always the fixed row.
- Preserve the existing obstacle blocker list, strict AABB test, and `isEntityClearOfGaps(..., { allowAirborne: true })`. Since `610 + 42 <= groundY - 12`, fixed-row candidates may continue across gaps. A candidate that overlaps an obstacle is simply not appended; later x positions continue from the next spacing step.
- In `createGuidedMouseRoute`, remove the old ordinary `GUIDED_MOUSE_OFFSETS` vertical arc expansion from the returned ordinary route. Retain non-mouse entities and generate the ordinary path with `createContinuousMouseRoute`; do not modify formation entities.
- Keep `createBridgeMouseRoute` as the pattern-boundary connector. Use the clamped route spacing and `y: GAME_CONFIG.groundY - 90` for every connector. `world.js` already invokes it between `lastPatternEndX` and the next `startX`; do not add a second bridge source.
- Keep formation generation in `createPatternStream` intact: formation cells are still generated through `createFormationEntities`, and any continuous ordinary additions must be merged without removing formation cells.

### I03. Client-focused checks

- Related Files:
  - `test/game-systems.test.js` :: route invariants, gap invariants, formation preservation, zone threshold tests; modify

#### Details

- Update existing route-spacing assertions from the old exact `38` contract to the inclusive `48~58` contract.
- Add assertions that ordinary continuous/connector mice have `y === GAME_CONFIG.groundY - 90`, x gaps are within `[48, 58]` when no intentional obstacle/formation omission intervenes, obstacle-overlapping ordinary mice are absent, gap-overlapping continuous mice remain airborne-safe, and formations retain their exact cell count and shape metadata.
- Update threshold tests to the four boundary values `799/800/3599/3600`; also verify `updateScore` changes `state.zoneId` while `calculateScore` results remain the same for identical inputs.

## Acceptance Criteria

- [x] Ordinary browser-generated mice are single-row at `y=610`, non-overlapping, and spaced deterministically within `48~58px`.
- [x] Obstacle-overlapping ordinary mice are omitted, gap routes continue safely, and pattern bridges remain continuous.
- [x] Special formations, including DEX, preserve their cells and metadata.
- [x] Browser zone transitions use `800` and `3600`; score award formulas are unchanged.

## Validation

- `node test/game-systems.test.js`
- `node test/render.test.js`

## Commit Message

```text
feat(game): align ordinary mouse routes and stage thresholds

Plan: 2026-09-26-mouse-cleanup-stage-score
Phase: P01-mouse-cleanup-stage-score
Task: T01-client-mouse-row-and-stage-thresholds

- place ordinary mice on a fixed safe row with seeded spacing
- move score-driven stage thresholds to 800 and 3600
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: recorded in git history

## Validation Results

- `node test/game-systems.test.js`: pass, 31/31.
- `node test/render.test.js`: pass, 18/18.
