# Task: T03 Reduce Shared Jump Height

## Status: done

## Goal
Lower both jump impulses for every cat by changing the shared multiplier from 1.2 to 1.0, while retaining two jumps, collision rules, and the ability to clear a 100-pixel basic obstacle.

## Decision Summary
- Change only `GAME_CONFIG.jumpMultiplier`; keep `jumpVelocity`, gravity, jump count, obstacle definitions, and cat-specific stats unchanged.
- At gravity 2400 and initial velocity -900, the continuous-physics apex estimate changes from 243 logical pixels at multiplier 1.2 to about 169 pixels at multiplier 1.0.

## Implementation

### I01. Lower the shared jump multiplier

- Related Files:
  - `public/js/game/constants.js` :: `GAME_CONFIG.jumpMultiplier` — shared launch multiplier; modify
  - `public/js/game/game-loop.js` :: `simulateStep` — applies the configured launch on either allowed jump press; read-only
  - `public/js/game/collision.js` :: `obstacleIntersectsPlayer` — obstacle clearance contract; read-only

#### Details
- **Signatures & Types**:
  ```javascript
  const GAME_CONFIG = Object.freeze({
    gravity: 2400,
    jumpVelocity: -900,
    jumpMultiplier: 1.0,
    maxJumps: 2,
    // ...existing fields unchanged
  });
  ```
- **Data & Schema Fields**:
  - `GAME_CONFIG.jumpMultiplier`: finite number, default changes from `1.2` to `1.0`.
  - Do not add `jumpMultiplier` to `CAT_DEFINITIONS`; all six cats continue using the same global value.
- **Execution Flow / Logic**:
  1. Change only the `jumpMultiplier` literal in `public/js/game/constants.js` to `1.0`.
  2. Preserve `simulateStep()`'s `state.player.vy = GAME_CONFIG.jumpVelocity * GAME_CONFIG.jumpMultiplier` assignment; it is used on both the first and second W presses.
  3. Preserve `maxJumps: 2`, gravity, W press-edge behavior, S fast descent, player hitbox, collision insets, and obstacle/pattern dimensions.
  4. Update `test/game-core.test.js` assertions that expect `1.2` to expect `1.0`, including the shared-cat jump test. Keep the test proving the cat can clear a 100-pixel basic obstacle; the reduced continuous apex remains about 169 pixels, so the obstacle contract should still pass.
  5. Keep the second-W expected displacement formula derived from `GAME_CONFIG.jumpVelocity * GAME_CONFIG.jumpMultiplier`; do not replace it with a hard-coded number.
  6. Run the full test suite and adjust only stale multiplier expectations. If a gameplay regression appears, do not silently increase jump height or alter obstacle geometry; report the failing contract for a new user decision.
- **Error & Exception Handling**: No new errors or fallbacks. No per-cat configuration fallback is introduced.
- **State Transition & Return**: The first and second valid W press each use the lowered impulse; the third press remains ignored; all existing grounded, airborne, and game-over transitions remain unchanged.

### I02. Verify movement and obstacle regression coverage

- Related Files:
  - `test/game-core.test.js` :: shared jump configuration, two-jump limit, second-jump trajectory, and basic-obstacle clearance tests — modify
  - `test/game-systems.test.js` :: generated jump-safe pattern checks — read-only

#### Details
- Confirm the configured multiplier is exactly 1.0 and is not present as an override on individual cat definitions.
- Confirm each cat still clears the existing basic obstacle in one jump at the test's measured point.
- Confirm the second W press still resets vertical velocity according to the shared multiplier without resetting the current airborne y position before integration.
- Confirm a held W does not exceed two jumps and the third W press emits no additional `player_jump` event.
- Run deterministic jump-safe route/pattern tests to ensure no pattern change was needed.

## Acceptance Criteria
- [x] `GAME_CONFIG.jumpMultiplier` is exactly 1.0 and shared across all six cats.
- [x] Both permitted jumps use the reduced impulse; the two-jump limit is unchanged.
- [x] The 100-pixel basic obstacle remains clearable and existing collision/pattern tests pass.
- [x] Gravity, horizontal speed, obstacle geometry, cat stats, and collision rules are unchanged.

## Validation
- `npm.cmd test` — game-core and game-systems jump, collision, and deterministic pattern tests pass.
- `git diff --check` — no whitespace errors.

## Commit Message
```text
balance(game): lower the shared jump height

Plan: 2026-10-29-game-over-controls-jump
Phase: P01-results-controls-and-jump
Task: T03-reduce-shared-jump-height

- Lower both shared jump impulses with multiplier 1.0
- Preserve two-jump and obstacle-clearance behavior
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: `809f345`
