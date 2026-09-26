# Task: T01 단계별 오수 1개와 생성·수명 템포

## Status: done

## Goal

오수 타겟을 어느 단계에서도 동시에 2개 이상 띄우지 않고 항상 1개로 유지한다. 1단계 `home_day`는 1000ms, 2단계 `outside`는 800ms, 3단계 `home_night`는 600ms의 생성 간격과 동일한 타겟 수명을 사용한다.

## Decision Summary

- `home_day`, `outside`, `home_night`의 `activeCount`는 모두 `1`이다.
- 단계별 `spawnIntervalMs`와 `targetLifetimeMs`는 각각 1000/800/600ms다.
- 오수 위치 영역·상단 HUD 안전 영역·판정 반경은 변경하지 않는다.

## Implementation

### I01. zone rhythm configuration

- Related Files:
  - `public/js/game/rhythm-targets.js` :: `RHYTHM_CONFIG.zones`, `targetLifetimeMs`, `zoneConfig`, `spawnTarget`, `updateRhythmTargets`; modify

#### Details

- `RHYTHM_CONFIG.zones`를 다음 스키마로 만든다:
  - `home_day: { activeCount: 1, difficultyScale: 1, spawnIntervalMs: 1000, targetLifetimeMs: 1000 }`
  - `outside: { activeCount: 1, difficultyScale: 1.5, spawnIntervalMs: 800, targetLifetimeMs: 800 }`
  - `home_night: { activeCount: 1, difficultyScale: 2, spawnIntervalMs: 600, targetLifetimeMs: 600 }`
- 기존 top-level `RHYTHM_CONFIG.targetLifetimeMs`를 외부 API 호환용으로 유지할 경우 기본값은 1000으로 두고, 실제 만료 계산은 zone config를 우선한다.
- `spawnTarget`은 `expiresAtMs = nowMs + config.targetLifetimeMs`를 사용한다.
- `updateRhythmTargets`는 `activeTargets() < config.activeCount`일 때만 spawn하고, activeCount가 1이므로 while loop가 동시에 여러 타겟을 만들지 않는지 확인한다.
- zone이 없거나 잘못된 경우 `home_day` fallback은 1개·1000ms다.
- targetRadius, placement bounds, minimumDistance, primary/secondary button roll은 변경하지 않는다.

### I02. tempo and concurrency tests

- Related Files:
  - `test/game-systems.test.js` :: rhythm target tests; modify
  - `test/game-core.test.js` :: gameover rhythm summary timing; modify if fixture assumptions change

#### Details

- 각 zone에서 초기 update 후 active target 수가 정확히 1인지 검증한다.
- outside에서 799ms에는 새 target이 생성되지 않고, 800ms 만료 시점에는 새 target이 생성되는지 검증한다. home_day/home_night도 1000/600ms를 각각 확인한다.
- target `expiresAtMs - spawnedAtMs`가 해당 zone interval과 같은지 검증한다.
- 놓친 target이 만료되기 전에는 active target이 1개를 초과하지 않는지 확인한다.
- HUD-safe placement와 consecutive target minimum distance 기존 회귀를 유지한다.

## Acceptance Criteria

- [ ] 세 zone의 active target 수가 항상 1이다.
- [ ] 생성 간격과 수명이 각각 1000/800/600ms로 적용된다.
- [ ] 단계 상승 시 타겟이 빨라지지만 동시에 2개 이상 노출되지 않는다.
- [ ] 위치 영역과 기존 판정 규칙이 유지된다.

## Validation

- `node test/game-systems.test.js`
- `node test/game-core.test.js`

## Commit Message

```text
feat(rhythm): tune single-target zone tempo

Plan: 2026-09-26-cookie-route-rhythm-score-balance
Phase: P03-rhythm-tempo
Task: T01-set-rhythm-tempo

- keep one rhythm target active in every zone
- shorten spawn and lifetime intervals by stage
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: recorded in git history
