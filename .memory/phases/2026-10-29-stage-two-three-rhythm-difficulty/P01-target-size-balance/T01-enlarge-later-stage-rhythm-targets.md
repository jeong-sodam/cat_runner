# Task: T01 Enlarge Later-Stage Rhythm Targets

## Status: done

## Goal
Increase newly spawned stage-two and stage-three rhythm target radii to approximately 42.5 and 35.4 logical pixels, respectively, so these targets are easier to click without reducing their existing timing challenge.

## Decision Summary
- Set only `RHYTHM_CONFIG.zones.outside.difficultyScale` to `1.25` and `RHYTHM_CONFIG.zones.home_night.difficultyScale` to `1.5`. Keep stage-one scale, stage spawn intervals, target lifetimes, general runner difficulty, and already-spawned target radii unchanged.

## Implementation

### I01. Adjust rhythm-only zone scales and verify computed sizes

- Related Files:
  - `public/js/game/rhythm-targets.js` :: `RHYTHM_CONFIG.zones`, `targetRadius`, `spawnTarget` — zone-specific rhythm size calculation and target creation; modify only the two selected configuration values
  - `public/js/game/patterns.js` :: `ZONE_DEFINITIONS` — general obstacle/runner difficulty for each world zone; read-only and must remain unchanged
  - `test/game-systems.test.js` :: `rhythm targets use single-target zone tempo, button matching, and bonus points`; add an active-target size stability case — verify scale, radius, timing, and spawn behavior; modify

#### Details
- **Signatures & Types**:
  ```javascript
  const RHYTHM_CONFIG = Object.freeze({
    zones: Object.freeze({
      home_day: Object.freeze({
        activeCount: 1,
        difficultyScale: 1,
        spawnIntervalMs: 1000,
        targetLifetimeMs: 1000,
      }),
      outside: Object.freeze({
        activeCount: 1,
        difficultyScale: 1.25,
        spawnIntervalMs: 800,
        targetLifetimeMs: 800,
      }),
      home_night: Object.freeze({
        activeCount: 1,
        difficultyScale: 1.5,
        spawnIntervalMs: 600,
        targetLifetimeMs: 600,
      }),
    }),
  });

  function targetRadius(config)
  function spawnTarget(state, { nowMs, config, canvasWidth, canvasHeight })
  function updateRhythmTargets(state, { nowMs, zoneId, canvasWidth, canvasHeight } = {})
  ```
- **Data & Schema Fields**:
  - Change only the numeric configuration fields `zones.outside.difficultyScale` from `1.5` to `1.25` and `zones.home_night.difficultyScale` from `2` to `1.5`.
  - Keep the target schema unchanged: `radius: number` is calculated at spawn and remains on that target object.
  - Keep `home_day.difficultyScale: 1`, `outside.spawnIntervalMs: 800`, `outside.targetLifetimeMs: 800`, `home_night.spawnIntervalMs: 600`, and `home_night.targetLifetimeMs: 600`.
- **Execution Flow / Logic**:
  1. Preserve the existing radius calculation: `clamp((baseRadius * targetScale) / config.difficultyScale, minRadius * targetScale, baseRadius * targetScale)`. With `baseRadius=34`, `targetScale=1.5625`, and `minRadius=18`, the maximum radius is `53.125` and the minimum is `28.125` logical pixels.
  2. With the chosen scales, verify `outside` spawns at exactly `53.125 / 1.25 = 42.5` logical pixels and `home_night` at `53.125 / 1.5` (about `35.4167`) logical pixels. Both remain smaller than the `home_day` radius of `53.125`, and stage three remains smaller than stage two.
  3. Do not alter `targetRadius()` or add zone-specific arithmetic elsewhere. Do not change the spawn interval, target expiration, active target count, bonus chance, click matching, or minimum-distance placement.
  4. A target's radius is fixed when `spawnTarget()` creates it. Do not rewrite an active target's radius in `updateRhythmTargets()` when `zoneId` changes or when a saved run resumes. The next spawned target uses the zone configuration supplied at that spawn.
  5. Update the existing zone-config expectation in `test/game-systems.test.js` to include `difficultyScale` alongside `activeCount`, `spawnIntervalMs`, and `targetLifetimeMs`. Assert the exact stage-two and stage-three target radii, while retaining their current 800/600 ms timing assertions.
  6. Add a regression case that spawns an `outside` target, updates the rhythm state with `zoneId: "home_night"` before the existing target expires, and confirms its radius is still `42.5`. Then update at or after its 800 ms expiration with `home_night` and confirm the newly spawned target has radius `53.125 / 1.5` and lifetime 600 ms.
  7. Preserve all primary/bonus target behavior; both use `targetRadius(config)` before their button type is assigned, so both target kinds receive the same enlarged stage radius.
- **Error & Exception Handling**: Keep the existing fallback to `home_day` for unknown zone IDs. Do not change radius clamping; it prevents sizes outside the existing min/max bounds.
- **State Transition & Return**: Active targets retain their stored radius and expiry. A target spawned in a later zone receives that zone's selected radius and unchanged lifetime.

### I02. Validate the isolated rhythm balance change

- Related Files:
  - `test/game-systems.test.js` :: rhythm zone configuration and spawn assertions — modify
  - `public/js/game/patterns.js` :: `ZONE_DEFINITIONS` — read-only comparison point for the non-rhythm difficulty system

#### Details
- Confirm `ZONE_DEFINITIONS.outside.difficulty` and `ZONE_DEFINITIONS.home_night.difficulty` are untouched; these values control runner/obstacle progression and are not osu target-size values.
- Confirm zone thresholds, pattern generation, target cadence, target lifetime, and existing active-target radius remain unchanged.
- Confirm `npm.cmd test` passes the full suite and `git diff --check` reports no whitespace errors.

## Acceptance Criteria
- [x] Stage-two rhythm targets spawn with radius `42.5`; stage-three targets spawn with radius `53.125 / 1.5` (about `35.4167`).
- [x] Stage one remains radius `53.125`; stages two and three still have a descending target-size progression.
- [x] Spawn intervals and lifetimes stay at 800 ms for stage two and 600 ms for stage three.
- [x] An already active or restored target keeps the radius stored when it was spawned; only a later target uses the new stage size.
- [x] General world/obstacle difficulty, target matching, bonus scoring, and mobile/right-click behavior are unchanged.

## Validation
- [x] `npm.cmd test` — all 113 tests pass.
- [x] `git diff --check` — no whitespace errors.

## Commit Message
```text
balance(rhythm): enlarge targets in later stages

Plan: 2026-10-29-stage-two-three-rhythm-difficulty
Phase: P01-target-size-balance
Task: T01-enlarge-later-stage-rhythm-targets

- Reduce rhythm size scales for outside and home night
- Preserve target timing and spawn-time radius stability
```

## Progress
- [x] Implementation complete.
- [x] Validation passed.
- commit: pending
