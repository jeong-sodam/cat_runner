# Task: T02 Server Mouse Row Parity

## Status: done

## Goal

Mirror the client ordinary-mouse route contract in the authoritative server manifest so seeded manifests use the same fixed row, spacing, obstacle filtering, bridge behavior, formation preservation, and pattern version.

## Decision Summary

- Server ordinary route mice use `y=610` and seeded integer spacing `48~58px`.
- Server skips only ordinary candidates that collide with obstacles; fall-gap route candidates remain airborne-safe.
- Formation cells remain untouched and client/server entity ordering and metadata stay identical.
- The server manifest does not invent a second score formula; it receives the already-selected `zoneId` and must match client generation for each zone.

## Implementation

### I01. Server constants and route generation

- Related Files:
  - `src/game/server-pattern-manifest.js` :: `PATTERN_VERSION`, `MOUSE_ROUTE_SPACING_MIN`, `MOUSE_ROUTE_SPACING_MAX`; modify
  - `src/game/server-pattern-manifest.js` :: `createContinuousMouseRoute`, `createGuidedMouseRoute`, `createBridgeMouseRoute`, `createServerManifest`; modify

#### Details

- Change `PATTERN_VERSION` to `cat-runner-patterns-v10`.
- Change `MOUSE_ROUTE_SPACING_MIN/MAX` to `48/58` and keep `GROUND_Y`, mouse width/height, obstacle AABB logic, gap margins, and formation constants unchanged.
- In `createServerManifest(seed, { patternCount = 128, zoneId = "outside" } = {})`, consume a seeded random value to select `routeSpacing` inclusively from `48` through `58` at the same point in the random-call order as the client stream. Store it on each pattern.
- In `createContinuousMouseRoute(pattern, gaps = [], spacing = 38)`, clamp spacing to `[48, 58]`; emit ordinary candidates at `y: GROUND_Y - 90` (`610`) with the existing route metadata. Do not calculate obstacle arcs for ordinary visual placement.
- Keep strict AABB obstacle filtering and `isEntityClearOfGaps(..., { allowAirborne: true })`. Omit only candidates that fail obstacle/formation blocker checks; continue the seeded x progression afterward.
- In `createGuidedMouseRoute`, replace the old ordinary seed-offset/vertical-arc output with non-mouse entities plus the fixed-row continuous route. Formation entities remain handled separately and are never flattened.
- Keep `createBridgeMouseRoute` and its `previousPatternEndX` flow, but ensure all bridge entities use the clamped `routeSpacing` and `y: GROUND_Y - 90`.
- Preserve `createServerManifest` entity ID sequencing, `patternIndex`, `routeKind`, `routeAction`, formation metadata, `worldEntities`, and DEX obstacle suppression. The only intended generated-data changes are ordinary route y/spacing/count-at-obstacle positions and pattern version.

### I02. Server contract checks

- Related Files:
  - `test/score-validation.test.js` :: client/server manifest parity test; modify
  - `test/integration.test.js` :: server route continuity test; modify

#### Details

- Update the manifest parity expectation from v9 to v10.
- Compare each client/server pattern for route spacing, entity relative x/y/width/height, IDs, route metadata, formation metadata, gap coordinates, and pattern ordering across `home_day`, `outside`, and `home_night` where relevant.
- Assert ordinary continuous and connector mice are exactly at y `610`, route spacing is within `[48, 58]`, no ordinary mouse AABB overlaps an obstacle, and gap-overlapping continuous mice satisfy airborne height safety.
- Assert formation cell counts, `formationCell`, `formationLetter`, `formationSequenceIndex`, and DEX `obstacleSuppressed` behavior are unchanged.

## Acceptance Criteria

- [x] Server manifests match the client v10 route layout for deterministic seeds.
- [x] Ordinary route spacing, fixed y, obstacle omission, gap safety, and bridge continuity are enforced.
- [x] Formation and DEX metadata remain unchanged.

## Validation

- `node test/score-validation.test.js`
- `node test/integration.test.js`

## Commit Message

```text
feat(server): mirror mouse route cleanup contract

Plan: 2026-09-26-mouse-cleanup-stage-score
Phase: P01-mouse-cleanup-stage-score
Task: T02-server-mouse-row-parity

- mirror fixed-row ordinary mice and seeded spacing in manifests
- bump and validate the client/server pattern contract
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: recorded in git history

## Validation Results

- `node test/score-validation.test.js`: pass, 12/12.
- `node test/integration.test.js`: both server route and DEX assertions pass; process exits afterward on the existing Windows `better-sqlite3` `RemoveEnvironmentCleanupHook` native assertion.
