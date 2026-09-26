# Task: T02 쥐 인형 밀도 증가

## Status: pending

## Goal

일반 쥐 인형은 현재 `addDenseMice` 출력량보다 약 1.5배가 되도록 원본·앞쪽·뒤쪽 배치를 시도하고, 5×5 도트 진형 선택 확률을 20%에서 30%로 높인다. 갭을 가로지르는 쥐는 추가하지 않으며, 진형이 선택된 경우 기존처럼 일반 쥐를 진형으로 대체한다.

## Decision Summary

- 일반 쥐는 원본 1개에 최대 앞쪽/뒤쪽 복제 2개를 더해 기존 2배 출력에서 3배 출력으로 늘린다.
- 복제 위치는 `FORMATION_CELL_STEP * 2`만큼 앞·뒤로 시도한다.
- 진형 선택 threshold는 `formationRoll < 0.3`이다.
- 진형의 5% DEX 확률과 장애물 없는 예약 통로 규칙은 유지한다.

## Implementation

### I01. 일반 쥐 복제량 조정

- Related Files:
  - `public/js/game/patterns.js` :: `addDenseMice`; modify

#### Details

- `entities.flatMap`에서 mouse가 아닌 entity는 그대로 한 번 반환한다.
- mouse entity는 원본과 함께 다음 후보를 만든다.
  - `forward`: `x + FORMATION_CELL_STEP * 2`
  - `backward`: `x - FORMATION_CELL_STEP * 2`
- `isEntityClearOfGaps(candidate, gaps)`가 true인 후보만 결과에 추가한다.
- 두 후보가 모두 안전하면 `[entity, forward, backward]` 순서로 반환한다.
- 갭 때문에 한 후보만 안전하면 원본과 안전한 후보만 반환한다.
- 둘 다 안전하지 않으면 원본만 반환한다.
- 원본 entity를 mutate하지 않고 모든 복제는 얕은 복사 객체로 만든다.

### I02. 진형 확률 변경과 스트림 검증

- Related Files:
  - `public/js/game/patterns.js` :: `createPatternStream`; modify
  - `test/game-systems.test.js` :: `pattern stream doubles base mice and replaces them with safe formations`, `formation selection is deterministic...`; modify

#### Details

- `formationRoll < 0.2`를 `formationRoll < 0.3`으로 변경한다.
- 동일 seed로 두 stream을 생성했을 때 결과가 deep-equal이어야 한다.
- `home_day`에서 갭이 없는 기본 패턴의 일반 쥐 수를 현재 base mouse count의 3배로 검증한다.
- 240개 이상 패턴 표본에서 진형과 일반 배치가 모두 존재하고, 진형 비율이 대략 30% 범위(테스트 허용 범위 20% 이상 40% 이하)에 들어오는지 검증한다.
- 진형 선택 시 장애물이 진형 예약 영역과 겹치지 않고, 진형 미선택 시 복제 쥐가 갭과 겹치지 않는지 검증한다.
- `createFormation(() => 0.01)`의 DEX 분기와 `0.99`의 일반 알파벳 분기는 기존대로 검증한다.

## Acceptance Criteria

- [ ] 갭이 없는 기본 패턴에서 각 일반 쥐가 최대 3개 출력된다.
- [ ] 갭이 있는 경우 갭을 침범하는 복제 쥐가 생성되지 않는다.
- [ ] 진형 선택 확률이 약 30%로 증가한다.
- [ ] 동일 seed의 패턴 스트림은 계속 결정적이다.
- [ ] DEX 5% 분기와 선택적 수집/장애물 억제 규칙은 회귀하지 않는다.

## Validation

- `npm test -- --test-name-pattern="pattern stream doubles|formation selection|five-by-five"`
- `npm test`

## Commit Message

```text
feat(items): increase mouse density and formations

Plan: 2026-09-26-runner-stage-density-double-jump-patterns
Phase: P02-stage-mouse-density
Task: T02-increase-mouse-density

- add safe forward and backward mouse copies
- raise formation selection from 20 percent to 30 percent
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
