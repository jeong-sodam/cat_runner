# Task: T04 Rhythm Ease

## Status: done

## Goal

Make osu-style rhythm targets 25% larger visually and for hit detection, and reduce preferred consecutive target movement from 240px to 160px without leaving the established HUD-safe area or removing bounded fallback generation.

## Decision Summary

- Source of truth: `.memory/decisions/2026-09-23-local-leaderboard.md`, D08–D09.
- The target `radius` is the shared source for rendering and hit detection, so increasing it changes both consistently.
- Preserve safe bounds `x: 120..1480`, `y: 140..780`, 24-attempt fallback, zone active counts, and button behavior.

## Implementation

### I01. Scale target geometry and movement spacing

- Related Files:
  - `public/js/game/rhythm-targets.js` :: `RHYTHM_CONFIG`, `targetRadius`, `spawnTarget`, `placementBounds` — modify.
  - `public/js/render/scene-renderer.js` :: rhythm target drawing — read-only; verify it uses `target.radius` and needs no independent scale.

#### Details

- Add a frozen `targetScale: 1.25` to `RHYTHM_CONFIG` and apply it to both `baseRadius` and `minRadius` in `targetRadius(config)` so every zone’s visible radius grows exactly 25%.
- Keep `resolveRhythmTarget()` unchanged if it already compares pointer distance to `candidate.radius`; that radius is the enlarged hit area.
- Change `RHYTHM_CONFIG.placement.minimumDistance` from `240` to `160`; keep `lastSpawnPosition`, 24 candidate attempts, safe-area bounds, and final in-bounds fallback intact.
- Do not change target lifetime, spawn intervals, active counts, primary/secondary button selection, bonus scoring, expiry, or rhythm summary calculations.

### I02. Add difficulty and geometry regression coverage

- Related Files:
  - `test/game-systems.test.js` :: rhythm target lifecycle/placement tests — modify.
  - `test/game-core.test.js` :: rhythm lifecycle compatibility — read-only unless an exact radius/spacing assertion is required.
  - `test/render.test.js` :: target rendering compatibility — read-only unless a radius draw assertion is required.

#### Details

- Assert target radius is 25% larger for home-day and the minimum radius also scales in the high-difficulty zone.
- Assert a click just outside the old radius but inside the new radius is accepted, while button matching remains enforced.
- Update consecutive placement assertions to require at least 160px when a valid candidate exists and verify constant-source fallback remains in bounds and terminates.
- Preserve existing active counts, expiry, bonus points, safe-area, renderer, and rhythm summary assertions.

## Acceptance Criteria

- [x] Visible and accepted target radius increases by exactly 25%.
- [x] Consecutive target movement preference is reduced to 160px without unsafe placement.
- [x] Existing rhythm timing, scoring, button, fallback, and rendering behavior remains intact.

## Validation

- `npm.cmd test -- test/game-systems.test.js test/game-core.test.js test/render.test.js` — rhythm, core, and renderer tests pass.
- `git diff --check`

## Commit Message

```text
feat(game): ease rhythm target movement and hit area

Plan: 2026-09-23-local-leaderboard
Phase: P01-local-leaderboard-and-rhythm-ease
Task: T04-rhythm-ease

- Enlarge rhythm targets and their hit areas
- Reduce consecutive target movement distance
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending

## Execution Record

- Added `targetScale: 1.25` to enlarge both rendered target circles and their shared hit radius.
- Reduced the preferred consecutive center distance to 160px while preserving HUD-safe bounds and bounded fallback placement.
- Validation: `npm.cmd test -- test/game-systems.test.js test/game-core.test.js test/render.test.js` (38 passed); `git diff --check` passed.
