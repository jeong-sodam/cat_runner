# Task: T02 공중 하강과 2단 점프 물리

## Status: done

## Goal

게임 루프에서 공중 S를 즉시 하강으로 처리하고, 공중 두 번째 W가 플레이어의 현재 X/Y를 유지한 채 수직 속도만 재설정하도록 수정한다. 첫 점프·2단 점프·공중 S·착지·낙사 복구가 서로의 상태를 깨지 않아야 한다.

## Decision Summary

- `GAME_CONFIG.jumpVelocity`의 절댓값과 고양이 `jumpMultiplier`를 첫 점프와 2단 점프에 동일하게 사용한다.
- 공중 2단 점프는 `state.player.y`를 지상 Y로 재설정하지 않는다.
- 공중 S fast descent는 `vy = Math.abs(GAME_CONFIG.jumpVelocity)`를 적용하고 `jumpsUsed`는 유지한다.

## Implementation

### I01. `simulateStep`의 공중 액션 순서 수정

- Related Files:
  - `public/js/game/game-loop.js` :: `simulateStep(stepMs)`; modify
  - `public/js/game/constants.js` :: `GAME_CONFIG.jumpVelocity`, `GAME_CONFIG.maxJumps`; read-only
  - `public/js/game/state.js` :: player state fields; read-only after T01

#### Details

- **Signature**: `simulateStep(stepMs: number): void`.
- 한 step 시작 시 `jumpPressed = input.consumeJumpPress()`와 `slidePressed = input.consumeSlidePress()`를 각각 한 번 소비한다.
- 지상 첫 점프는 기존처럼 `height = playerHeight`, `y = groundY - height`, `vy = jumpVelocity * cat.jumpMultiplier`, `isGrounded = false`, `isSliding = false`, `jumpsUsed += 1`을 수행하고 `airSlideUsed = false`로 초기화한다.
- 공중 두 번째 W는 현재 `x`와 `y`를 그대로 보존하고 `vy = jumpVelocity * cat.jumpMultiplier`, `jumpsUsed += 1`, `isSliding = false`만 갱신한다. 이 분기에서는 `y = groundY - height`를 실행하지 않는다.
- 공중에서 `slidePressed && !airSlideUsed`이면 중력 적분 전에 `vy = Math.abs(GAME_CONFIG.jumpVelocity)`, `airSlideUsed = true`를 설정한다. S release로 속도를 복구하지 않으며 `jumpsUsed`를 소비하지 않는다.
- 착지 시 `y = groundY - height`, `vy = 0`, `isGrounded = true`, `jumpsUsed = 0`, `airSlideUsed = false`로 정규화하고, 착지 후 `isSliding`은 현재 `input.isSliding()` held 값으로 결정한다. 낙사 복구도 `airSlideUsed = false`로 정리한다.
- 반복 keydown이 아닌 소비된 edge만 액션을 일으킨다. 기존 falling/score/collision 흐름은 보존한다.
- `input.consumeSlidePress`가 없는 외부 test double은 optional fallback으로 안전하게 처리할 수 있지만 실제 input controller에는 항상 함수가 있어야 한다.

### I02. 물리 회귀 테스트

- Related Files:
  - `test/game-core.test.js` :: game loop/player action tests; modify

#### Details

- 지상 W와 공중 W로 `jumpsUsed`가 1→2가 되고, 두 번째 W 전후 `x`와 `y` 시작값이 지상 Y로 덮어써지지 않는지 검증한다.
- 세 번째 W는 속도와 카운터를 변경하지 않는지 검증한다.
- 공중 S 한 번은 하강 속도 `+900` 계열과 `airSlideUsed = true`를 만들고 추가 S는 재설정하지 않는지 검증한다.
- 공중 S 뒤 W가 남은 2단 점프를 사용할 수 있는지, 착지 후 두 카운터가 초기화되는지 검증한다.

## Acceptance Criteria

- [ ] 공중 S가 같은 airborne period에 한 번만 즉시 하강을 시작한다.
- [ ] 두 번째 W가 현재 Y를 유지한 채 점프 속도만 재설정한다.
- [ ] 공중 S 이후에도 남은 2단 점프가 작동한다.
- [ ] 착지·낙사 복구 후 액션 카운터가 초기화된다.
- [ ] 물리 회귀 테스트가 통과한다.

## Validation

- `node --test --test-concurrency=1 test/game-core.test.js`
- `node --test --test-concurrency=1 test/game-systems.test.js`

## Commit Message

```text
fix(game): preserve airborne position for double jump and slide

Plan: 2026-09-26-air-jump-slide-hitbox-ui-fit
Phase: P01-air-input-and-double-jump
Task: T02-air-action-physics

- Trigger one fast descent per airborne period
- Keep double jump at the current airborne position
```

## Progress

- [x] 구현 완료
- [x] 검증 통과 (`--test-isolation=none` 사용)
- commit: pending
