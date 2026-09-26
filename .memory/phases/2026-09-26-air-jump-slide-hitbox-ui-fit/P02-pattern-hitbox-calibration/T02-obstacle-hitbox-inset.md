# Task: T02 장애물 전용 피격범위 축소

## Status: done

## Goal

플레이어와 장애물의 충돌 판정에만 좌우 10px·상하 4px 안쪽 여백을 적용한다. 쥐 인형·강아지풀 수집 판정은 기존 full player hitbox를 유지한다.

## Decision Summary

- obstacle collision box: `x + 10`, `y + 4`, `width - 20`, `height - 8`.
- 수집 범위와 mouse/grass AABB는 변경하지 않는다.
- obstacle variant polygon 판정은 새 inset box에서 생성한다.

## Implementation

### I01. 장애물용 hitbox helper 분리

- Related Files:
  - `public/js/game/collision.js` :: `getPlayerHitbox`, `obstacleIntersectsPlayer`, module exports; modify

#### Details

- **Signatures**:
  ```js
  getPlayerHitbox(state): { x: number, y: number, width: number, height: number }
  getObstaclePlayerHitbox(state): { x: number, y: number, width: number, height: number }
  obstacleIntersectsPlayer(entity, state): boolean
  ```
- `getPlayerHitbox(state)`의 반환값과 기존 callers는 그대로 둔다.
- `getObstaclePlayerHitbox(state)`는 `x + 10`, `y + 4`, `Math.max(0, width - 20)`, `Math.max(0, height - 8)`을 반환한다. logical canvas 좌표를 사용하며 worldOffset을 중복 적용하지 않는다.
- `obstacleIntersectsPlayer`는 full player rectangle 대신 새 helper로 player polygon을 생성한다. 장애물 polygon과 entity world offset은 기존 규칙을 보존한다.
- mouse/grass/item collision 함수는 계속 `getPlayerHitbox(state)`를 호출해야 한다.

### I02. 충돌 회귀 테스트

- Related Files:
  - `test/game-systems.test.js` :: collision tests; modify

#### Details

- full box에는 닿지만 inset box에는 닿지 않는 장애물이 충돌하지 않는지 검증한다.
- inset box 안쪽에 실제로 겹치는 장애물은 variant별 polygon 판정에서 충돌하는지 검증한다.
- 같은 위치의 mouse/grass는 full hitbox 기준으로 수집되어 기존 수집 범위가 줄지 않는지 검증한다.

## Acceptance Criteria

- [ ] 장애물 충돌에만 좌우 10px·상하 4px inset이 적용된다.
- [ ] item/grass 수집 판정은 기존 full hitbox를 사용한다.
- [ ] 경계 및 실질 겹침 충돌 테스트가 통과한다.

## Validation

- `node --test --test-concurrency=1 test/game-systems.test.js`

## Commit Message

```text
fix(collision): inset obstacle hitbox without reducing pickups

Plan: 2026-09-26-air-jump-slide-hitbox-ui-fit
Phase: P02-pattern-hitbox-calibration
Task: T02-obstacle-hitbox-inset

- Add obstacle-only player collision inset
- Keep mouse and grass collection range unchanged
```

## Progress

- [x] 구현 완료
- [x] 검증 통과 (`--test-isolation=none` 사용)
- commit: pending
