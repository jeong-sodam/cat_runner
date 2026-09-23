# Task: T02 Obstacle Frequency and Zone Thresholds

## Status: done

## Goal

모든 배경 구간에서 장애물 패턴 사이의 실제 생성 간격을 25% 줄여 장애물 등장 빈도를 높이고, 현재 점프·슬라이드 안전 최소 간격 아래로는 내려가지 않게 한다. 동시에 점수 700점에서 바깥, 1800점에서 밤 실내로 zone을 전환해 기존 배경 렌더링이 같은 시점에 즉시 바뀌도록 한다.

## Decision Summary

- 패턴 내부의 장애물과 회피 액션은 변경하지 않고 `spawnNextPattern`의 패턴 간 간격만 조정한다.
- 패턴 간격 배율은 `0.75`이며, 최종 간격은 `max(pattern.minGap * 0.75, GAME_CONFIG.playerWidth * 1.5)`로 계산한다.
- 모든 zone에 동일하게 적용하고, `pattern.minGap` 원본과 패턴 안전성 검증은 보존한다.
- `ZONE_DEFINITIONS.outside.minScore`는 `700`, `home_night.minScore`는 `1800`으로 변경한다.
- `difficulty` 배율, `drawBackground`의 zone 분기, 배경 자산은 변경하지 않는다.

## Implementation

### I01. Safe pattern spacing

- Related Files:
  - `public/js/game/world.js` :: `spawnNextPattern`, new `PATTERN_SPACING_FACTOR`/spacing helper; modify
  - `public/js/game/patterns.js` :: pattern metadata and safe validation; read-only unless export is needed for the spacing contract

#### Details

- `world.js`에 패턴 간격 배율 상수 `PATTERN_SPACING_FACTOR = 0.75`를 둔다.
- `spawnNextPattern`에서 기존 `pattern.minGap`을 직접 `nextPatternX`에 더하지 않는다.
- 다음 패턴 위치 계산은 다음 계약을 따른다:
  - `safeMinimumGap = GAME_CONFIG.playerWidth * 1.5`
  - `resolvedGap = Math.max(pattern.minGap * PATTERN_SPACING_FACTOR, safeMinimumGap)`
  - `state.nextPatternX = startX + pattern.width + resolvedGap`
- `startX`, entity/gap world coordinate 변환, `lastPatternId`, `patternIndex` 갱신은 기존과 동일하게 유지한다.
- 후보 검증의 `candidate.minGap >= GAME_CONFIG.playerWidth * 1.5` 조건은 유지해 패턴 자체의 회피 가능성을 보존한다.
- zoneId에 따른 별도 배율을 만들지 않아 home_day·outside·home_night 모두 동일하게 25% 빈도 증가가 적용되도록 한다.

### I02. Earlier background and difficulty transitions

- Related Files:
  - `public/js/game/patterns.js` :: `ZONE_DEFINITIONS`; modify
  - `public/js/game/world.js` :: `selectZoneForScore`; read-only unless threshold tests require a small refactor
  - `public/js/game/scoring.js` :: `updateScore`; read-only, must continue assigning `state.zoneId`
  - `public/js/render/draw-backgrounds.js` :: `drawBackground`; read-only, existing zone mapping must remain

#### Details

- `ZONE_DEFINITIONS` values become `home_day=0`, `outside=700`, `home_night=1800` for `minScore`.
- Keep `background` values (`living-room`, `alley-park`, `dark-home`) and `difficulty` values (`1`, `1.2`, `1.5`) unchanged.
- `selectZoneForScore` must continue checking `home_night` before `outside`, so exact threshold values select the newer zone.
- `updateScore` remains the single transition trigger during play; when score reaches 700/1800, `state.zoneId` changes and the existing renderer immediately selects the matching background.

### I03. Gameplay regression tests

- Related Files:
  - `test/game-systems.test.js` :: pattern spacing, zone threshold, and world spawn tests; modify/add

#### Details

- Assert `selectZoneForScore(699) === "home_day"`, `selectZoneForScore(700) === "outside"`, `selectZoneForScore(1799) === "outside"`, and `selectZoneForScore(1800) === "home_night"`.
- Assert the difficulty multipliers remain `1`, `1.2`, and `1.5` and existing zone pattern gating remains unchanged.
- Use a deterministic fake pattern stream with a known `width` and `minGap` to assert a `minGap` of `240` resolves to `180` and the next pattern starts 25% sooner.
- Add a floor case with a valid pattern `minGap` of `150` to assert the resolved gap never falls below `GAME_CONFIG.playerWidth * 1.5` (`135`).
- Verify the spacing contract through world spawning for home_day, outside, and home_night without changing entity coordinates inside a pattern.
- Retain existing deterministic seed, safe gap, composite action, entity cleanup, and background-compatible zone tests.

## Acceptance Criteria

- [ ] 모든 zone에서 패턴 간 실제 생성 간격이 25% 줄어든다.
- [ ] 패턴 간격은 `GAME_CONFIG.playerWidth * 1.5` 아래로 내려가지 않는다.
- [ ] 700점에서 바깥, 1800점에서 밤 실내로 배경과 난이도가 즉시 전환된다.
- [ ] 기존 zone별 difficulty 배율과 패턴 내부 회피 안전성이 유지된다.
- [ ] 새 임계값과 안전 간격이 결정적 테스트로 검증된다.

## Validation

- `node --test --test-isolation=none --test-concurrency=1 test/game-systems.test.js`

## Commit Message

```text
feat(game): increase obstacle frequency and advance zone transitions

Plan: 2026-09-23-obstacle-frequency-background-transition
Phase: P01-obstacle-frequency-background-transition
Task: T02-obstacle-frequency-and-zone-thresholds

- reduce safe pattern spacing to increase obstacle frequency
- move background and difficulty thresholds to 700 and 1800 points
```

## Progress

- [x] 구현 완료
- [x] 검증 통과 (`node --test --test-isolation=none --test-concurrency=1 test/game-systems.test.js`)
- commit: 1eb6954
