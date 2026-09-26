# Task: T01 첫 러너 구간 축소

## Status: pending

## Goal

점수 400부터 배경과 외부 구간 난이도가 함께 시작되도록 첫 `home_day` 구간을 줄인다. `home_night` 전환은 기존 1800점을 유지하고, 외부 구간의 난이도 multiplier 값 자체는 변경하지 않는다.

## Decision Summary

- `ZONE_DEFINITIONS.outside.minScore`: `700` → `400`.
- 400점부터 `selectZoneForScore`가 `outside`를 반환한다.
- `outside.difficulty = 1.2`, `home_night.minScore = 1800`은 유지한다.

## Implementation

### I01. 구간 정의 변경

- Related Files:
  - `public/js/game/patterns.js` :: `ZONE_DEFINITIONS`; modify

#### Details

- `outside` 정의의 `minScore`를 정확히 `400`으로 변경한다.
- `background: "alley-park"`, `difficulty: 1.2` 및 다른 구간 정의는 유지한다.
- `PATTERN_VERSION`은 이 Task에서 변경하지 않는다. 패턴 구조 변경은 P03에서 한 번만 버전 증가시킨다.

### I02. 점수 기준 회귀 테스트

- Related Files:
  - `test/game-systems.test.js` :: `zone thresholds advance background transitions without changing difficulty multipliers`; modify

#### Details

- `selectZoneForScore(399) === "home_day"`를 검증한다.
- `selectZoneForScore(400) === "outside"`, `selectZoneForScore(1799) === "outside"`, `selectZoneForScore(1800) === "home_night"`를 검증한다.
- zone difficulty 객체가 `{ home_day: 1, outside: 1.2, home_night: 1.5 }`인지 계속 검증한다.
- `calculateDifficulty`의 거리 계산과 구간 multiplier가 기준 변경 때문에 변하지 않았는지 기존 assertion을 유지한다.

## Acceptance Criteria

- [ ] 399점까지는 `home_day`, 400점부터 1799점까지는 `outside`다.
- [ ] 1800점부터 `home_night`로 전환된다.
- [ ] 400점 전환과 동시에 배경 선택 및 외부 난이도 multiplier가 적용된다.
- [ ] 거리 기반 난이도 계산과 기존 구간 난이도 값은 변경되지 않는다.

## Validation

- `npm test -- --test-name-pattern="zone thresholds|score doubles mouse points"`
- `npm test`

## Commit Message

```text
feat(zones): shorten first runner stage

Plan: 2026-09-26-runner-stage-density-double-jump-patterns
Phase: P02-stage-mouse-density
Task: T01-shorten-first-stage

- switch to the outside zone at score 400
- preserve the existing outside and night difficulty multipliers
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
