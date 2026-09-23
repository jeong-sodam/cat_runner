# Task: T01 5개 능력치 런타임

## Status: done

## Goal

고양이별 능력치를 점프력·속도·체력·아이템 지속시간·자석 범위 5개로 축소하고, 기존의 고양이별 슬라이드·점수·낙사 저항·무적 지속시간 차이를 제거한다. 확정된 6개 고양이 표와 1~5 등급 체력을 클라이언트 런타임과 서버 검증에 동일하게 적용한다.

## Decision Summary

- `CAT_STAT_KEYS`는 `jump`, `speed`, `health`, `itemDuration`, `magnetRange`만 포함한다.
- 고양이 표는 검정 `(3,5,2,1,4)`, 하양 `(5,2,3,4,1)`, 삼색 `(3,1,5,3,3)`, 치즈 `(1,2,3,5,4)`, 고등어 `(5,4,2,1,3)`, 카오스 `(1,5,1,4,4)` 순서다.
- 등급 배율은 기존 `0.8, 0.9, 1, 1.1, 1.2`를 유지한다. 체력 등급은 곧 최대 하트 수다.
- 슬라이드 속도, 점수 배율, 낙사 저항, 무적 추가 배율은 모든 고양이에서 공통 기본 동작으로 처리한다.

## Implementation

### I01. 클라이언트 능력치 모델과 소비처 갱신

- Related Files:
  - `public/js/game/constants.js` :: `CAT_STAT_KEYS`, `CAT_DEFINITIONS`, `getStatMultiplier`, `getMaxHealthForRating`; modify
  - `public/js/game/state.js` :: `createGameState`; modify
  - `public/js/game/game-loop.js` :: `simulateStep`; modify
  - `public/js/game/effects.js` :: `applyEffect`, `updateActiveEffect`; modify
  - `public/js/game/collision.js` :: `startPlayerFall` 및 낙사 처리; modify
  - `public/js/game/scoring.js` :: `calculateScore`, `updateScore`; modify

#### Details

- `CAT_STAT_KEYS`의 순서를 정확히 `['jump', 'speed', 'health', 'itemDuration', 'magnetRange']`로 고정한다.
- 각 `CAT_DEFINITIONS` 항목의 `statRatings`는 위 5개 키만 가지며, 각 행은 합계 15가 된다. 기존 4개 폐기 능력치와 관련 multiplier 필드는 정의에서 제거한다.
- 남기는 multiplier는 `jumpMultiplier`, `speedMultiplier`, `itemDurationMultiplier`, `magnetRangeMultiplier`이며 각 값은 해당 등급을 `getStatMultiplier`에 통과시켜 만든다. 체력은 `getMaxHealthForRating(statRatings.health)`만 사용한다.
- `game-loop.js`의 월드 속도에서 슬라이딩 시 고양이별 `slideMultiplier`를 곱하지 않는다. 슬라이드 자체의 공통 효과와 난이도 배율은 유지한다.
- `effects.js`의 긍정 효과 지속 시간은 `5000 * itemDurationMultiplier`로 계산한다. 무적 효과에 별도의 고양이별 배율을 추가하지 않는다. 자석 판정 거리는 `260 * magnetRangeMultiplier`를 유지한다.
- 낙사 처리는 무적 효과가 없는 경우 항상 `GAME_CONFIG.fallDamage`만큼 감소시킨다. 폐기된 `fallResistanceMultiplier` 분기를 제거한다.
- 점수 계산에서 고양이별 `scoreMultiplier`를 제거하고, 쥐/거리/리듬 점수 계산과 `DOUBLE_SCORE` 효과만 유지한다.
- `state.maxHealth`와 `state.health`는 등급 값 그대로 1~5로 초기화한다.
- 점프력 1등급의 `jumpVelocity * 0.8`은 그대로 사용한다. 자동 추가 점프나 별도 최저 배율 상향은 넣지 않는다.

### I02. 서버 검증 능력치 규칙 동기화

- Related Files:
  - `src/services/run-validation-service.js` :: `CAT_STATS`, `validateEventStream`; modify
  - `test/score-validation.test.js` :: 고양이별 서버 결과 테스트; modify

#### Details

- `CAT_STATS`는 클라이언트와 동일한 체력 등급, 아이템 지속시간 배율, 자석 범위 배율을 사용한다.
- 서버 검증에서는 점수 배율을 항상 1로 계산하고, 낙사 저항과 무적 추가 배율을 사용하지 않는다.
- 잔디 효과의 긍정 지속 시간은 아이템 지속시간 배율만 반영한다. 서버의 이벤트 순서·체력 감소·리듬 점수 검증 계약은 유지한다.
- 새 패턴이 추가되기 전에도 기존 실행 기록의 entity ID와 효과 roll 검증이 깨지지 않도록 변경 범위를 고양이 스탯 소비처로 제한한다.

### I03. 런타임 회귀 테스트

- Related Files:
  - `test/game-core.test.js` :: 고양이 정의·체력·점프 테스트; modify
  - `test/game-systems.test.js` :: 효과·점수·낙사 테스트; modify

#### Details

- 모든 고양이의 `statRatings` 키가 새 5개 목록과 정확히 일치하고 각 행 합계가 15인지 검증한다.
- 검정·삼색·카오스의 최대 체력이 각각 2·5·1인지 검증한다.
- 치즈/고등어/카오스의 점수·슬라이드·낙사 저항 차이가 더 이상 결과에 영향을 주지 않는지 검증한다.
- 아이템 지속시간과 자석 범위만 등급별 차이를 보이는지 검증한다.
- 점프력 1등급 고양이로 기본 박스/화분을 뛰어넘는 고정 스텝 시나리오를 추가하고 충돌이 발생하지 않는지 검증한다.

## Acceptance Criteria

- [ ] 클라이언트와 서버에 5개 능력치만 존재한다.
- [ ] 확정된 6개 고양이 표가 적용되고 각 합계가 15다.
- [ ] 체력 등급 1~5가 하트 1~5칸으로 초기화된다.
- [ ] 폐기된 4개 고양이별 효과가 슬라이드·점수·낙사·무적 처리에 영향을 주지 않는다.
- [ ] 점프력 1등급으로 기본 장애물 회피 테스트가 통과한다.

## Validation

- `npm test -- --test-name-pattern="game state|jump|score|effect|fall|validation"`

## Commit Message

```text
feat(game): reduce cat abilities to five differentiated stats

Plan: 2026-09-23-font-cat-stats-mouse-formation
Phase: P01-stat-and-font-foundation
Task: T01-five-stat-runtime

- apply the confirmed five-stat table and health ratings
- make removed cat abilities common baseline behavior
- synchronize client and server stat validation
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
