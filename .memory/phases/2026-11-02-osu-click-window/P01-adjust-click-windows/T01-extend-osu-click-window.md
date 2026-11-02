# Task: T01 Extend osu Click Window

## Status: done

## Goal
Keep each rhythm target clickable for 500 ms longer in every zone, reducing premature timeout misses while retaining the existing stage progression and target cadence.

## Decision Summary
- Set zone target lifetimes to `home_day: 1500 ms`, `outside: 1300 ms`, and `home_night: 1100 ms`; this applies equally to primary and bonus targets.
- Preserve zone spawn intervals (`1000 / 800 / 600 ms`), `activeCount: 1`, target radius/difficulty scale, bonus scoring, miss rules, and the legacy top-level `RHYTHM_CONFIG.targetLifetimeMs: 1000` value.

## Implementation

### I01. Extend zone-specific target lifetimes

- Related Files:
  - `public/js/game/rhythm-targets.js` :: `RHYTHM_CONFIG.zones`, `zoneConfig`, `spawnTarget`, `expireTargets` — configure per-zone timeout values used when creating and expiring rhythm targets; modify only the three zone lifetime values.

#### Details
- **Signatures & Types**:
  ```javascript
  const RHYTHM_CONFIG = Object.freeze({ /* existing configuration */ });

  function zoneConfig(zoneId)
  function spawnTarget(state, { nowMs, config, canvasWidth, canvasHeight })
  function expireTargets(state, nowMs)
  function updateRhythmTargets(
    state,
    { nowMs = 0, zoneId = "home_day", canvasWidth = 960, canvasHeight = 720 } = {},
  )
  ```
- **Data & Schema Fields**:
  - Keep the target object schema unchanged: `id: string`, `x: number`, `y: number`, `radius: number`, `button: "primary" | "secondary"`, `spawnedAtMs: number`, `expiresAtMs: number`, `status: "active" | "hit" | "miss"`.
  - Change only `RHYTHM_CONFIG.zones.*.targetLifetimeMs`:
    - `home_day`: `1000` → `1500`.
    - `outside`: `800` → `1300`.
    - `home_night`: `600` → `1100`.
  - Keep the separate top-level `RHYTHM_CONFIG.targetLifetimeMs` at `1000`; do not remove or repurpose it in this task.
  - Keep `spawnIntervalMs` at `1000`, `800`, and `600` respectively, and keep `activeCount: 1` for all zones.
- **Execution Flow / Logic**:
  1. `zoneConfig(zoneId)` must continue returning the matching frozen zone config and falling back to `home_day` for unknown zone IDs.
  2. `spawnTarget` must continue assigning `expiresAtMs` as `nowMs + config.targetLifetimeMs`; primary and bonus targets receive the same zone lifetime because button type does not affect timeout assignment.
  3. `expireTargets` must continue marking an active target as `miss` when `nowMs >= expiresAtMs`; before the boundary it remains active.
  4. `updateRhythmTargets` must continue limiting active targets to one and using the unchanged `spawnIntervalMs` before creating a replacement when the active target has been hit or expired.
  5. Do not change target radius, zone `difficultyScale`, feedback duration, bonus chance/points, input matching, click/misclick scoring, or target placement.

### I02. Update rhythm timing regression coverage

- Related Files:
  - `test/game-systems.test.js` :: `rhythm targets use single-target zone tempo, button matching, and bonus points` — update zone expectations and timeout boundary checks; modify.
  - `test/game-systems.test.js` :: `rhythm misclicks lower accuracy, keep targets active, and feedback expires once`; `rhythm targets stay in the HUD-safe area and space consecutive candidates` — move timeout and respawn assertions to the new lifetime boundaries; modify.
  - `test/game-core.test.js` :: `rhythm timers pause and gameover includes the rhythm summary once` — keep the target active while paused, then advance until its configured timeout; modify.

#### Details
- **Signatures & Types**:
  ```javascript
  test("rhythm targets use single-target zone tempo, button matching, and bonus points", async () => { /* existing test */ })
  ```
- **Data & Schema Fields**:
  - Keep the asserted top-level `RHYTHM_CONFIG.targetLifetimeMs` value at `1000`.
  - Update the expected zone config while preserving all existing `activeCount`, `difficultyScale`, and `spawnIntervalMs` values:
    ```javascript
    {
      home_day: { activeCount: 1, difficultyScale: 1, spawnIntervalMs: 1000, targetLifetimeMs: 1500 },
      outside: { activeCount: 1, difficultyScale: 1.25, spawnIntervalMs: 800, targetLifetimeMs: 1300 },
      home_night: { activeCount: 1, difficultyScale: 1.5, spawnIntervalMs: 600, targetLifetimeMs: 1100 },
    }
    ```
- **Execution Flow / Logic**:
  1. For a `home_day` target spawned at `nowMs: 0`, assert `expiresAtMs === 1500`, active status at `1499`, and miss status at `1500`. Since timeout feedback is created at the expiration time, assert the existing 400 ms feedback expiry is `1900`.
  2. For an `outside` target spawned at `0`, assert `expiresAtMs === 1300`, active at `1299`, and missed at `1300`. The replacement may spawn at `1300` because the unchanged 800 ms spawn interval has already elapsed; assert its `spawnedAtMs === 1300` and `expiresAtMs === 2600`.
  3. Keep the outside radius assertion at `42.5`, wrong-button rejection, misclick behavior, and final hit/accuracy checks. Use monotonically increasing timestamps for interactions after the replacement spawns.
  4. For a `home_night` target spawned at `0`, assert `expiresAtMs === 1100`, active at `1099`, and missed at `1100`; keep its radius assertion unchanged.
  5. In the stage-transition case, spawn in `outside` at `0`, switch to `home_night` while that target is active, and verify its stored `expiresAtMs` remains `1300`. At `1300`, assert the old target misses and the replacement uses the home-night radius and `expiresAtMs === 2400`.
  6. For the home-day bonus target, assert the same extended `expiresAtMs === 1500` and preserve secondary-button bonus points and score summary checks.
  7. In the rhythm timeout/misclick test, assert the home-day target is active at `1499`, misses at `1500`, and its timeout feedback expires at `1900`; keep the 400 ms feedback duration and misclick-feedback expiry checks unchanged.
  8. In the game-core pause test, prove the target remains active and miss count remains zero while the simulation is paused; after resuming, advance in bounded 50 ms steps until that target expires, then verify one timeout miss.
  9. In the safe-area/spacing test, keep one target active at `1299` and let it expire at `1300` before asserting that the replacement target also satisfies the placement bounds and minimum-distance checks. For its home-day-to-outside fallback case, advance to the home-day expiry at `1500` before checking both target positions.
  10. Keep feedback duration assertions (`400 ms`) and misclick feedback expiry assertions unchanged; they measure visual feedback, not the target click window.

## Acceptance Criteria
- [ ] Zone lifetimes are exactly `1500 / 1300 / 1100 ms` for home day, outside, and home night.
- [ ] A target stays active until just before its configured expiry and becomes a miss at the exact expiry time.
- [ ] Primary and bonus targets use the same zone lifetime.
- [ ] Spawn intervals, single-active-target behavior, target sizes, bonus scoring, and misclick rules remain unchanged.
- [ ] The top-level legacy lifetime stays `1000 ms`, and feedback animations remain `400 ms`.

## Validation
- `npm.cmd test` — all Node tests pass, including the updated rhythm timeout and zone-transition assertions.
- `git diff --check` — no whitespace errors are reported.

## Commit Message
```text
balance(rhythm): extend osu target click windows

Plan: 2026-11-02-osu-click-window
Phase: P01-adjust-click-windows
Task: T01-extend-osu-click-window

- Add 500 ms to rhythm target lifetime in every zone
- Preserve spawn cadence, target rules, and scoring behavior
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: balance(rhythm): extend osu target click windows
