# Task: T03 Rhythm Safe Area and Spacing

## Status: done

## Goal

Keep osu-style targets away from the score/health HUD and screen edges, prevent consecutive target centers from being less than 240px apart when possible, and always fall back to a valid safe-area position without stalling target generation. Primary and secondary-button targets share the same placement constraints.

## Decision Summary

- Source of truth: `.memory/decisions/2026-09-23-run-record-gameover-health-rhythm-area.md`, D06–D08.
- Target center bounds on the 1600×900 logical canvas are `x: 120..1480` and `y: 140..780`.
- Consecutive target centers use Euclidean distance; the preferred minimum is 240px.
- If a valid distant candidate cannot be found, choose a random candidate inside the safe rectangle and continue spawning.

## Implementation

### I01. Add bounded safe-area placement

- Related Files:
  - `public/js/game/rhythm-targets.js` :: `RHYTHM_CONFIG`, `createRhythmState`, `spawnTarget`, `updateRhythmTargets`; modify

#### Details

- Add a frozen placement configuration with `left: 120`, `right: 120`, `top: 140`, `bottom: 120`, `minimumDistance: 240`, and a finite candidate-attempt limit (24 attempts is the planned bound).
- Compute candidate center ranges from the supplied logical `canvasWidth`/`canvasHeight`: `minX = left`, `maxX = canvasWidth - right`, `minY = top`, `maxY = canvasHeight - bottom`. For the standard 1600×900 canvas this must equal `120..1480` and `140..780`.
- Store the last spawned target center in rhythm state (for example `lastSpawnPosition: { x, y }`) and update it for every spawn, including initial multi-target fill and fallback spawns.
- For each candidate, calculate Euclidean distance with `Math.hypot(candidate.x - previous.x, candidate.y - previous.y)`; accept immediately when there is no previous target or the distance is at least 240px.
- Make at most 24 deterministic random candidates using the existing `state.randomSource`. If none passes, accept the final candidate that is still inside the safe rectangle; never loop indefinitely or emit outside the bounds.
- Keep target radius, button selection, expiry, bonus chance, and active-count logic unchanged. The spacing rule applies equally to primary and secondary targets.

### I02. Test HUD-safe bounds, spacing, and fallback behavior

- Related Files:
  - `test/game-systems.test.js` :: rhythm target lifecycle/placement test; modify
  - `test/render.test.js` :: target rendering compatibility; read-only unless a coordinate assertion is needed

#### Details

- Assert targets spawned on a 1600×900 canvas always satisfy `120 <= x <= 1480` and `140 <= y <= 780`.
- Assert initial zone fill counts remain 1/2/3 and every normal/bonus target uses the same safe bounds.
- Use a deterministic random source or inspect consecutive spawns to assert accepted consecutive centers are at least 240px apart when a valid candidate is available.
- Use a constant/repeating random source that cannot produce a distant candidate to assert the fallback still returns a target inside the safe rectangle and the update call terminates.
- Preserve existing button matching, bonus-point, expiry, radius-scaling, and rhythm-summary assertions.

## Acceptance Criteria

- [x] No rhythm target center appears in the HUD/top exclusion or outside the configured side/bottom margins.
- [x] Consecutive target centers are at least 240px apart whenever a valid candidate exists.
- [x] Fallback placement remains inside the safe rectangle and never stalls spawning.
- [x] Zone active counts and primary/secondary target scoring behavior remain unchanged.

## Validation

- `npm.cmd test -- test/game-systems.test.js test/game-core.test.js test/render.test.js`
- `git diff --check`

## Commit Message

```text
feat(game): constrain rhythm target placement

Plan: 2026-09-23-run-record-gameover-health-rhythm-area
Phase: P01-run-record-gameover-health-rhythm-area
Task: T03-rhythm-safe-area-spacing

- Keep rhythm targets clear of HUD and screen edges
- Space consecutive targets with a safe fallback
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending

## Execution Record

- Added a frozen HUD-safe placement rectangle (`120..1480`, `140..780`) and a 240px Euclidean spacing preference.
- Stored the last spawn center and bounded candidate search to 24 attempts; fallback always selects the final candidate within the valid placement bounds.
- Preserved zone active counts, target radius, primary/secondary button behavior, expiry, and scoring.
- Validation: `npm.cmd test -- test/game-systems.test.js test/game-core.test.js test/render.test.js` (38 passed); `git diff --check` passed.
