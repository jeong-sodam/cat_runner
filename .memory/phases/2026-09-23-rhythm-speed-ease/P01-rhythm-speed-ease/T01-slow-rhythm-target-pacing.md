# Task: T01 Slow Rhythm Target Pacing

## Status: done

## Goal

Update the shared rhythm-target timing constants so osu-style targets are 1.5x slower in every zone, with a 750ms reaction window for normal and bonus targets, while preserving zone progression, simultaneous target counts, target radius scaling, bonus probability, and score values.

## Decision Summary

- Use the confirmed decision file `.memory/decisions/2026-09-22-rhythm-speed-ease.md` as the source of truth.
- Apply the timing adjustment globally: `targetLifetimeMs` becomes `750`, the base spawn interval becomes `750`, and zone intervals derive from the new base (`home_day: 750`, `outside: 500`, `home_night: 375`).
- Keep `activeCount` unchanged (`1`, `2`, `3`), keep `difficultyScale` unchanged, and let primary/secondary targets share the same lifecycle because target timing is not button-specific.

## Implementation

### I01. Update rhythm timing configuration

- Related Files:
  - `public/js/game/rhythm-targets.js` :: `RHYTHM_CONFIG`, `spawnTarget`, `updateRhythmTargets`, `expireTargets`; modify

#### Details

- **Configuration fields**:
  - `RHYTHM_CONFIG.targetLifetimeMs`: change from `500` to `750`.
  - `RHYTHM_CONFIG.baseSpawnIntervalMs`: change from `500` to `750`.
  - `RHYTHM_CONFIG.zones.home_day`: preserve `activeCount: 1` and `difficultyScale: 1`; set `spawnIntervalMs: 750`.
  - `RHYTHM_CONFIG.zones.outside`: preserve `activeCount: 2` and `difficultyScale: 1.5`; set `spawnIntervalMs: 500` (`750 / 1.5`).
  - `RHYTHM_CONFIG.zones.home_night`: preserve `activeCount: 3` and `difficultyScale: 2`; set `spawnIntervalMs: 375` (`750 / 2`).
  - Do not change `baseRadius`, `minRadius`, `bonusChance`, `bonusPoints`, accuracy bounds, or score multiplier bounds.
- **Execution flow**:
  1. `spawnTarget` must continue deriving `expiresAtMs` from `nowMs + RHYTHM_CONFIG.targetLifetimeMs`, so primary and secondary-button targets both receive the 750ms lifetime.
  2. `updateRhythmTargets` must continue expiring active targets before checking each zone's interval and must preserve the existing `activeCount` fill behavior.
  3. Do not add button-specific timing branches or reduce the number of active targets.

### I02. Add timing and progression regression coverage

- Related Files:
  - `test/game-systems.test.js` :: rhythm target zone/lifecycle test; modify

#### Details

- Assert the public rhythm configuration exposes `targetLifetimeMs === 750` and zone intervals `750`, `500`, and `375` for `home_day`, `outside`, and `home_night` respectively.
- Assert a target spawned at `nowMs: 0` remains active before 750ms and becomes a miss at 750ms when it was not hit.
- Assert each zone still fills exactly its existing active count on the initial update: 1, 2, and 3 targets.
- Assert a secondary-button target uses the same expiry timing and still awards exactly 5 bonus points when hit.
- Keep the existing radius scaling and accuracy/score assertions unchanged.
- Update any existing lifecycle timestamp that assumed the old 500ms expiry to the new 750ms boundary; do not weaken the assertion to a broad range.

## Acceptance Criteria

- [x] All zones use the confirmed 1.5x slower spawn intervals: 750ms, 500ms, and 375ms.
- [x] Every target, including secondary-button bonus targets, remains active for exactly 750ms unless hit first.
- [x] Zone active counts remain 1, 2, and 3; radius scaling, bonus chance, and bonus points remain unchanged.
- [x] Rhythm unit/system tests cover the new timing boundaries and pass.

## Validation

- `npm.cmd test -- test/game-systems.test.js test/game-core.test.js` — verifies rhythm timing, bonus targets, gameover summary, and loop integration.
- `git diff --check` — verifies the plan implementation introduces no whitespace errors.

## Commit Message

```text
feat(game): ease rhythm target pacing

Plan: 2026-09-23-rhythm-speed-ease
Phase: P01-rhythm-speed-ease
Task: T01-slow-rhythm-target-pacing

- Slow rhythm target spawning across all zones
- Extend primary and bonus target reaction windows
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending

## Execution Record

- Updated rhythm target lifetime and all zone spawn intervals while preserving active counts and bonus behavior.
- Validation passed: `npm.cmd test -- test/game-systems.test.js test/game-core.test.js` (21 tests) and `git diff --check`.
