# Task: T03 osu Target Ease

## Status: done

## Goal

osu 스타일 타겟을 더 쉽게 조작할 수 있도록 현재 타겟 기준 시각 크기와 판정 범위를 25% 확대하고, 모든 구역에서 등장 간격을 1,000ms로 통일하며, 연속 타겟 최소 거리와 유지 시간을 완화한다. 구역별 동시 등장 개수는 유지한다.

## Decision Summary

- 현재 `targetScale: 1.25`를 기준으로 추가 25% 확대해 `targetScale: 1.5625`를 사용한다.
- `target.radius`가 렌더링과 `resolveRhythmTarget` 판정에 공통 사용되므로 별도 판정 전용 반경은 만들지 않는다.
- `targetLifetimeMs: 1000`, 모든 zone `spawnIntervalMs: 1000`, `placement.minimumDistance: 100`으로 조정한다.
- `activeCount`는 home_day 1개, outside 2개, home_night 3개를 유지한다.

## Implementation

### I01. Rhythm target configuration

- Related Files:
  - `public/js/game/rhythm-targets.js` :: `RHYTHM_CONFIG`, `targetRadius`, `placementBounds`, `spawnTarget`, `updateRhythmTargets`; modify
  - `public/js/render/draw-rhythm-targets.js` or the current rhythm target renderer :: target radius consumer; read-only unless current renderer has a hard-coded radius

#### Details

- Update constants exactly:
  - `targetLifetimeMs: 1000`
  - `baseSpawnIntervalMs: 1000`
  - `targetScale: 1.5625`
  - `placement.minimumDistance: 100`
  - `zones.home_day.spawnIntervalMs: 1000`
  - `zones.outside.spawnIntervalMs: 1000`
  - `zones.home_night.spawnIntervalMs: 1000`
- Keep `baseRadius: 34`, `minRadius: 18`, bonus chance/points, difficulty scales, and zone `activeCount` unchanged.
- Do not expand the HUD-safe placement bounds into the score/health header. `placementBounds` must continue respecting the current top/left/right/bottom safe margins and canvas edges.
- `targetRadius(config)` remains the single source for both draw size and hit recognition. With the new scale, home_day base radius becomes `34 * 1.5625 = 53.125` before difficulty clamping.
- `updateRhythmTargets` must continue to expire targets at `nowMs >= expiresAtMs`, fill only up to the configured active count, and space successive candidates using the new 100px minimum.

### I02. Rhythm system tests

- Related Files:
  - `test/game-systems.test.js` :: rhythm target configuration/behavior test; modify

#### Details

- Update configuration assertions for target lifetime, base interval, target scale, minimum distance, and all three zone intervals.
- Update home target radius/expiry assertions to the new scale and 1,000ms lifetime.
- Verify home/outside/home_night active counts remain 1/2/3.
- Verify every generated target remains inside the safe placement bounds.
- Generate consecutive targets with deterministic random input and assert the candidate distance is at least 100px when placement permits it.
- Verify `resolveRhythmTarget` accepts a click inside the enlarged radius and rejects a click outside it, while preserving primary/secondary button matching and bonus scoring.
- Verify a target remains active before 1,000ms and becomes a miss at/after its new expiry time.

## Acceptance Criteria

- [ ] 타겟 원과 판정 범위가 현재 기준보다 25% 확대된다.
- [ ] 모든 구역의 등장 간격이 1,000ms다.
- [ ] 연속 타겟 최소 거리가 100px다.
- [ ] 타겟이 1,000ms 동안 표시된다.
- [ ] 구역별 동시 등장 개수와 HUD 안전 영역이 유지된다.
- [ ] 확대된 판정·유지 시간·등장 간격이 테스트로 검증된다.

## Validation

- `node --test --test-concurrency=1 test/game-systems.test.js`

## Commit Message

```text
feat(game): ease osu target size timing and spacing

Plan: 2026-09-23-local-mode-osu-ease
Phase: P01-local-mode-osu-ease
Task: T03-osu-target-ease

- enlarge visual and hit radius for rhythm targets
- slow target spawning and extend lifetime while reducing movement distance
```

## Progress

- [x] 구현 완료
- [x] 검증 통과 (`node --test --test-isolation=none --test-concurrency=1 test/game-systems.test.js`)
- commit: pending
