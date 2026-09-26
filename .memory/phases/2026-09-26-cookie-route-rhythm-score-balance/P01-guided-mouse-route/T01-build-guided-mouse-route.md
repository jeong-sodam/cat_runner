# Task: T01 `requiredActions` 기반 쥐 유도 루트와 7배 밀도

## Status: done

## Goal

일반 패턴에서 기존 쥐 인형을 장애물 회피 행동을 안내하는 안전한 루트로 재생성한다. 패턴 stream이 확정한 `requiredActions` 순서를 기준으로 `jump`, `slide`, `double_jump` 구간의 높이와 위치를 만들고, 기본 쥐 entity 1개당 최대 7개까지 배치한다. 특수 5×5 진형이 선택된 경우에는 기존 진형 entity를 변경하지 않는다.

## Decision Summary

- 모든 일반 패턴에 안전한 쿠키런식 쥐 루트를 만든다.
- 루트는 고정 `safePath`가 아니라 stream에서 정해진 `requiredActions`를 따른다.
- 기본 쥐 1개당 원본 포함 최대 7개를 생성한다.
- 쥐 entity는 장애물·gap과 겹치지 않아야 하며, 수집 가능한 경로로만 배치한다.

## Implementation

### I01. action 기반 route 생성기

- Related Files:
  - `public/js/game/patterns.js` :: `addDenseMice`, `createPatternStream`, 새 `createGuidedMouseRoute`; modify/new
  - `public/js/game/constants.js` :: `GAME_CONFIG.groundY`, player dimensions; read-only
  - `public/js/game/collision.js` :: `isEntityClearOfGaps`와 수집 AABB 계약; read-only

#### Details

- `GUIDED_MOUSE_MAX_COUNT` 상수를 `7`로 둔다. 원본 mouse entity를 포함한 최종 개수의 상한이며, gap 검사를 통과하지 못한 후보는 제외한다.
- `createGuidedMouseRoute(pattern, requiredActions, gaps)`를 추가한다. 반환 타입은 기존 entity 배열이며, mouse가 아닌 obstacle/grass entity는 원본 객체를 유지한다.
- 각 obstacle의 index와 같은 index의 `requiredActions`를 route segment의 행동으로 사용한다. 기본 패턴처럼 `requiredActions`가 없는 경우에는 `safePath`와 obstacle y를 사용해 `jump`/`slide` fallback action을 결정하고, obstacle 자체가 없을 때만 기존 entity 위치를 보존한 복사본을 반환한다.
- 행동별 route 좌표 계약:
  - `jump`: 장애물 앞 ground y에서 시작해 장애물 위를 통과하는 상승·정점·하강 7점 곡선으로 만든다. 정점은 해당 장애물 top보다 최소 player hitbox 높이만큼 위에 두고, 점들은 장애물의 좌우 경계 및 `GAME_CONFIG.gapSafeMargin` 바깥에 배치한다.
  - `double_jump`: `jump`보다 높은 정점을 사용하고, 두 번째 장애물까지 이어지는 7점 곡선으로 만든다. 두 장애물 사이의 `advancedSafeMargin`을 침범하지 않는다.
  - `slide`: 장애물 높이 아래의 낮은 y에 7점을 수평으로 배치하고, player의 slide hitbox가 통과할 수 있는 영역을 유지한다.
- 하나의 원본 mouse entity가 여러 obstacle segment에 걸치는 경우에는 가장 가까운 segment의 route에만 연결해 동일 entity가 중복 생성되지 않게 한다.
- `isEntityClearOfGaps(candidate, gaps)`와 obstacle AABB 검사를 모두 통과한 후보만 반환한다. gap이 있는 패턴에서는 gap 양쪽 `GAME_CONFIG.gapSafeMargin`을 지킨다.
- `createPatternStream().next()`에서 formation이 선택되지 않은 경우에만 `addDenseMice` 대신 새 route 생성기를 사용한다. formation이 선택되면 기존 `createFormationEntities` 결과와 `formationId`, `formationCell`, DEX suppression을 그대로 유지한다.
- entity의 `variant`, `collectible`, `formation*` 메타데이터를 임의로 제거하지 않는다. ID와 `effectRoll` 부여는 기존 stream 후처리를 그대로 사용한다.

### I02. 결정성·밀도 테스트

- Related Files:
  - `test/game-systems.test.js` :: pattern stream and formation density tests; modify/new

#### Details

- 동일 seed의 두 stream이 일반 패턴에 대해 동일한 entity 좌표·y·순서·개수를 생성하는지 검증한다.
- formation이 없는 일반 패턴의 각 base mouse 묶음이 원본 포함 최대 7개인지, 최소 1개인지 검증한다.
- 각 생성 mouse가 obstacle AABB 및 gap safe margin과 겹치지 않는지 검증한다.
- `requiredActions`가 `jump`, `slide`, `double_jump`일 때 각각 route y 범위가 ground/상승/낮은 자세 계약을 만족하는지 검증한다.
- formation이 생성된 표본에서는 기존 5×5 cell 수와 DEX 연속 진형 동작이 바뀌지 않았는지 검증한다.

## Acceptance Criteria

- [x] 일반 패턴의 쥐 인형이 실제 `requiredActions` 순서에 맞는 루트를 따른다.
- [x] base mouse당 최종 쥐 entity가 최대 7개다.
- [x] 생성된 쥐 루트가 장애물과 gap safe margin을 침범하지 않는다.
- [x] 동일 seed 결정성과 기존 5×5/DEX 진형 동작이 유지된다.

## Validation

- `node test/game-systems.test.js`
- `node test/render.test.js`

## Commit Message

```text
feat(mice): build safe action-guided routes

Plan: 2026-09-26-cookie-route-rhythm-score-balance
Phase: P01-guided-mouse-route
Task: T01-build-guided-mouse-route

- place dense mice along required action routes
- preserve safe gaps and special formations
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
