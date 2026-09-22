# Task: T01 Health Rating Cells

## Status: done

## Goal

Make the client and server use the cat's health rating directly as maximum health: rating 1 → 1 cell, rating 2 → 2 cells, through rating 5 → 5 cells. Preserve the existing damage, collision, fall, rendering, and authoritative-score rules while updating all affected fixtures to the new lethal-collision counts.

## Decision Summary

- Source of truth: `.memory/decisions/2026-09-23-run-record-gameover-health-rhythm-area.md`, D01.
- The numeric health rating is the displayed capacity; do not keep the old 4/5/6 offset.
- Client and server must agree for every cat so a run cannot be locally gameover-valid but server-rejected because of a different starting health.

## Implementation

### I01. Change client health capacity mapping

- Related Files:
  - `public/js/game/constants.js` :: `getMaxHealthForRating`, `GAME_CONFIG`, `CAT_DEFINITIONS`; modify
  - `public/js/game/state.js` :: `createGameState`; read-only unless the direct mapping requires a guard update
  - `public/js/render/draw-hud.js` :: `drawHud`; read-only, verify it renders the state-provided capacity

#### Details

- `getMaxHealthForRating(rating)` must clamp/round the input to the supported 1–5 range and return that clamped rating directly.
- Required mapping: `1 -> 1`, `2 -> 2`, `3 -> 3`, `4 -> 4`, `5 -> 5`.
- Keep `GAME_CONFIG.maxHealth` only as a fallback for malformed state; normal `createGameState` instances must use `getMaxHealthForRating(cat.statRatings.health)`.
- Do not modify health multipliers, damage amounts, fall recovery, cat stat ratings, or HUD heart rendering semantics beyond the new capacity.

### I02. Mirror health authority on the server

- Related Files:
  - `src/services/run-validation-service.js` :: `BASE_HEALTH`, `maxHealthFor`, `CAT_STATS`, `validateEventStream`; modify
  - `src/services/run-service.js` :: `completeVerifiedRun`; read-only except if fixture/result plumbing requires it

#### Details

- `maxHealthFor(stats)` must return the validated `healthRating` value directly, with the same 1–5 assumptions as the client.
- Remove or stop using the old `BASE_HEALTH + round((rating - 3) / 2)` formula.
- Preserve server authority: client-provided `health`, `damage`, `score`, and `distanceM` payload fields remain ignored; lethal state still comes only from validated collision/fall events and server cat stats.
- Preserve invincibility, repeated entity/gap checks, `run_gameover` ordering, ownership, and pattern-version validation.

### I03. Update health-dependent regression fixtures

- Related Files:
  - `test/game-core.test.js` :: health mapping/state assertions; modify
  - `test/score-validation.test.js` :: `makeGameoverEvents` and lethal stream cases; modify
  - `test/integration.test.js` :: `completeRun` collision fixture; modify
  - `test/run-resume.test.js` :: completion fixture; modify
  - `test/security-regression.test.js` :: lethal invalid-rhythm fixture if its collision count depends on health; modify

#### Details

- Assert client mappings `getMaxHealthForRating(1..5) === 1..5` and black/white/calico state capacities reflect their ratings.
- Make test helpers choose enough unique obstacle/fall events to deplete the selected cat's server health, rather than assuming the old black=4 or default=5 behavior.
- Keep fake `damage`, `health`, and client score fields in security tests to prove the server still ignores them.
- Keep existing score, fall, ownership, resume, and patternVersion assertions otherwise unchanged.

## Acceptance Criteria

- [x] Client and server map ratings 1–5 directly to 1–5 health cells.
- [x] Gameover validation remains authoritative and all existing collision/fall/security behavior remains intact.
- [x] Health, score-validation, integration, and resume tests pass with the new lethal thresholds.

## Validation

- `npm.cmd test -- test/game-core.test.js test/score-validation.test.js test/integration.test.js test/run-resume.test.js test/security-regression.test.js`
- `git diff --check`

## Commit Message

```text
feat(game): map health ratings directly to health cells

Plan: 2026-09-23-run-record-gameover-health-rhythm-area
Phase: P01-run-record-gameover-health-rhythm-area
Task: T01-health-rating-cells

- Align client and server health capacity with ratings
- Update lethal-run regression fixtures
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending

## Execution Record

- Client `getMaxHealthForRating` and server `maxHealthFor` now directly clamp ratings to 1–5 cells.
- Health-dependent game, score, integration, resume, and security fixtures now use the selected cat's lethal event count.
- Validation: `npm.cmd test -- test/game-core.test.js test/score-validation.test.js` (17 passed); integration/resume (9 passed); security regression (3 passed standalone); `git diff --check` passed.
- Note: combining the server suites in one Windows Node process triggered a native database cleanup abort after assertions passed; each affected suite passed when isolated.
