# Task: T01 Gameplay Stat Model

## Status: done

## Goal
Replace the five-axis cat stat model with the confirmed balanced three-axis model in client gameplay and server-side run validation, while making all cats use the same stronger jump and shared magnet range.

## Decision Summary
- Cat ratings are speed / health / item duration, all 1–5 with a total of 9 points per cat. Their exact values are in this blueprint.
- Rating mappings are speed `[0.75, 0.875, 1, 1.15, 1.3]`, beneficial item duration `[3000, 4000, 5000, 6500, 8000]` ms, health `[1, 2, 3, 4, 5]` hearts; all cats share jump multiplier `1.2` and magnet radius `260` px.

## Implementation

### I01. Replace client cat stats and apply the shared movement/effect values

- Related Files:
  - `public/js/game/constants.js` :: `GAME_CONFIG`, `CAT_STAT_KEYS`, rating maps, `CAT_DEFINITIONS`, `getMaxHealthForRating` — update cat-stat schema and central game values; modify.
  - `public/js/game/game-loop.js` :: jump input branch in the game-loop update — use the global jump multiplier instead of per-cat jump power; modify.
  - `public/js/game/effects.js` :: `applyEffect`, `getMagnetRangePixels`, `updateActiveEffect` — use per-cat item milliseconds for beneficial effects and one shared magnet radius; modify.
  - `test/game-core.test.js` :: cat lifecycle/profile assertions and one-jump boundary case — update/add model and jump regressions; modify.
  - `test/game-systems.test.js` :: magnet range and effect-duration cases — update/add shared-range and rating-duration regressions; modify.

#### Details
- **Signatures & Types**:
  ```js
  function getSpeedMultiplier(rating) {} // integer rating 1..5 -> number multiplier
  function getItemDurationMs(rating) {} // integer rating 1..5 -> integer milliseconds
  function getMaxHealthForRating(rating) {} // retain current 1..5 heart behavior
  function getMagnetRangePixels() {} // no cat input; returns shared 260 px range
  ```
- **Data & Schema Fields**:
  - `GAME_CONFIG.jumpMultiplier: number = 1.2`; retain `jumpVelocity` and `maxJumps: 2`.
  - `CAT_STAT_KEYS: readonly ["speed", "health", "itemDuration"]`.
  - Each `CAT_DEFINITIONS[id]` retains `id`, `label`, `statRatings`, `speedMultiplier`, `itemDurationMs`, `advantage`, and `weakness`; remove per-cat `jumpMultiplier` and `magnetRangeMultiplier`.
  - Exact `statRatings` (`speed`, `health`, `itemDuration`):
    - `black`: `{ speed: 5, health: 3, itemDuration: 1 }`
    - `white`: `{ speed: 2, health: 3, itemDuration: 4 }`
    - `calico`: `{ speed: 1, health: 5, itemDuration: 3 }`
    - `cheese`: `{ speed: 3, health: 3, itemDuration: 3 }`
    - `mackerel`: `{ speed: 4, health: 3, itemDuration: 2 }`
    - `chaos`: `{ speed: 5, health: 1, itemDuration: 3 }`
  - `SPEED_MULTIPLIERS`: `{ 1: 0.75, 2: 0.875, 3: 1, 4: 1.15, 5: 1.3 }`.
  - `ITEM_DURATION_MS_BY_RATING`: `{ 1: 3000, 2: 4000, 3: 5000, 4: 6500, 5: 8000 }`.
  - Derived client `speedMultiplier` / `itemDurationMs` for each cat:
    - `black`: `1.3` / `3000`
    - `white`: `0.875` / `6500`
    - `calico`: `0.75` / `5000`
    - `cheese`: `1` / `5000`
    - `mackerel`: `1.15` / `4000`
    - `chaos`: `1.3` / `5000`
  - Update advantage/weakness summaries to agree with the ratings: black `이동 속도` / `아이템 지속 시간`; white `아이템 지속 시간` / `이동 속도`; calico `체력` / `이동 속도`; cheese `균형 잡힌 능력` / `뚜렷한 약점 없음`; mackerel `이동 속도` / `아이템 지속 시간`; chaos `이동 속도` / `체력`.
- **Execution Flow / Logic**:
  1. Precondition & Validation: Keep rating values as integers in `[1, 5]`; confirm every cat's three ratings sum to exactly 9. Do not remove jump input, double-jump behavior, the magnet grass effect, or its base attraction radius.
  2. Core Processing: In `constants.js`, replace the generic rating-to-multiplier map with the exact speed and duration maps above. Put `jumpMultiplier: 1.2` in `GAME_CONFIG`; in the jump input branch set `vy = GAME_CONFIG.jumpVelocity * GAME_CONFIG.jumpMultiplier`. Set `speedMultiplier` and `itemDurationMs` from the cat's confirmed ratings. In `effects.js`, use `itemDurationMs` for `magnet`, `invincible`, and `double_score`; keep `slow_miss` at exactly 5000 ms. Make `getMagnetRangePixels()` return `BASE_MAGNET_RANGE` (260) without reading a cat field, so all cats pull mice over the same distance. Retain `getMaxHealthForRating` so health ratings still set the initial hearts.
  3. Error & Exception Handling: Clamp helper inputs to the existing 1..5 rating bounds as `getStatMultiplier` currently does. Do not create per-cat fallback multipliers or change event names, run IDs, database fields, score rules, or effect probabilities.
  4. State Transition & Return: The selected cat continues to determine speed, initial health, and beneficial-effect duration only; jump physics and magnet reach are identical across all six cats.

### I02. Synchronize server-side run reconstruction and gameplay regression tests

- Related Files:
  - `src/services/run-validation-service.js` :: `CAT_STATS`, `maxHealthFor`, grass effect duration reconstruction — keep server calculations identical to client; modify.
  - `test/score-validation.test.js` :: validated grass-effect timing and initial-health cases — verify server replay uses the new catalog; modify.
  - `test/game-core.test.js` :: exact ratings and jump branch — verify values and equal jump physics; modify.
  - `test/game-systems.test.js` :: `getMagnetRangePixels`, magnet attraction, positive/negative expiry — verify no cat magnet range and correct timer boundaries; modify.

#### Details
- `CAT_STATS` contains only `healthRating` and `itemDurationMs` for the six cat IDs. Values must match the exact client-derived health and duration table in I01; speed is not included because this server validator does not reconstruct movement speed.
- In `validateEventStream`, positive grass effects expire after `itemDurationMs`; `slow_miss` expires after 5000 ms. Health damage still decrements one heart per collision/fall and starts from the selected cat's rating.
- Update the previous magnet-distance tests to assert the same inclusive 260 px attraction boundary for cats with different speed/duration ratings and no pull beyond 260 px.
- Update the previous item-duration test to assert black's beneficial effect expires at `start + 3000`, rating-3 cats at `start + 5000`, white at `start + 6500`, and `slow_miss` at `start + 5000` for every cat. Add server validation coverage that confirms client effect timestamps are checked against these values.
- Keep the one-jump clearance regression and assert the global 1.2 jump multiplier, then confirm a jump press still records one jump and a second airborne press still works up to `maxJumps: 2`.

## Acceptance Criteria
- [x] `CAT_STAT_KEYS` and each cat's `statRatings` contain exactly speed, health, and item duration; each cat's rating total is exactly 9 and matches the approved table.
- [x] Speed and item-duration mappings match all five exact ratings; health still yields 1–5 initial hearts.
- [x] All cats use global jump multiplier `1.2` and retain the existing two-jump input behavior.
- [x] Magnet grass remains functional with shared 260 px reach; no cat definition or server catalog contains a magnet-range rating/multiplier.
- [x] Client and server apply the same beneficial-effect durations; slow-miss stays fixed at five seconds.
- [x] Existing client and score-validation tests pass after assertions are updated to the three-stat design.

## Validation
- `node --test test/game-core.test.js test/game-systems.test.js test/score-validation.test.js` — core stat values, jump/effect behavior, and deterministic server replay tests pass.
- `git diff --check` — no whitespace errors.

## Commit Message
```text
feat(game): rebalance cat gameplay stats

Plan: 2026-10-28-cat-stat-rebalance
Phase: P01-three-stat-cat-profiles
Task: T01-gameplay-stat-model

- Replace five cat traits with balanced speed, health, and item-duration ratings
- Use shared jump and magnet values and synchronize run validation
```

## Progress
- [x] Implementation complete
- [x] Validation passed (`node --test test/game-core.test.js test/game-systems.test.js test/score-validation.test.js`: 59 passed, 0 failed; `git diff --check` clean).
- commit: recorded in Git history with this Task's commit
