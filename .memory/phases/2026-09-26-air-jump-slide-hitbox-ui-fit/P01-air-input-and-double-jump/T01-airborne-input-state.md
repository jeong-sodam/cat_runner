# Task: T01 공중 입력 상태와 S edge 처리

## Status: done

## Goal

S의 held 상태와 단발 press 상태를 분리하고 플레이어 상태에 공중 하강 발동 여부를 기록한다. 이 Task가 끝나면 반복 keydown·키 홀드로 공중 하강이 재발동되지 않고, 착지 시 다음 공중 구간에서 다시 사용할 수 있는 입력 계약이 준비된다.

## Decision Summary

- 공중에서 최초 S press는 하강 속도를 `+900`으로 설정하며 같은 공중 구간에서는 한 번만 발동한다.
- S를 놓아도 하강은 취소하지 않는다. 착지한 뒤 S가 계속 눌려 있을 때만 지상 숙이기 자세가 된다.
- 공중 하강은 2단 점프 횟수를 소비하지 않는다.

## Implementation

### I01. 입력 컨트롤러에 S press edge 추가

- Related Files:
  - `public/js/game/input-controller.js` :: `createInputController`; modify

#### Details

- **State fields**: 기존 `jumpPressed`, `slideHeld`에 소비형 `slidePressed: boolean`을 추가한다.
- **Signature**:
  ```js
  createInputController(target = window): {
    consumeJumpPress: () => boolean,
    consumeSlidePress: () => boolean,
    isSliding: () => boolean,
    destroy: () => void
  }
  ```
- `keydown`에서 key를 소문자로 정규화한다. W는 기존처럼 `event.repeat === false`일 때만 `jumpPressed = true`로 둔다. S는 매 keydown에서 `slideHeld = true`, 반복이 아닌 keydown에서만 `slidePressed = true`로 둔다.
- S `keyup`은 `slideHeld = false`만 수행하고 이미 대기 중인 edge는 취소하지 않는다.
- `consumeSlidePress()`는 현재 값을 반환한 뒤 false로 초기화한다. 지원하지 않는 키는 무시하고 `event.repeat`가 없는 fixture는 false로 취급한다.
- `destroy()`에서 등록한 keydown/keyup listener를 모두 제거한다.

### I02. 플레이어 공중 하강 플래그 추가

- Related Files:
  - `public/js/game/state.js` :: 초기 player state 생성부; modify

#### Details

- `player.airSlideUsed: boolean`을 추가하고 초기값은 `false`로 둔다.
- 이 값은 현재 airborne period에서 S fast descent를 사용했는지만 의미하며 `jumpsUsed`와 독립적이다. 첫 점프 시작과 착지/낙사 복구 시 false로 전환하는 계약은 T02가 구현한다.

### I03. 입력 단위 테스트

- Related Files:
  - `test/game-core.test.js` :: input controller tests; modify

#### Details

- S 최초 keydown은 `consumeSlidePress() === true`, 두 번째 소비는 false, keyup 전 `isSliding() === true`인지 검증한다.
- S 반복 keydown은 edge를 다시 true로 만들지 않는다.
- keyup 후 held는 false이고, 이미 대기 중인 edge는 keyup으로 제거되지 않는지 검증한다.

## Acceptance Criteria

- [ ] `consumeSlidePress()`가 있고 S 반복 입력을 edge로 중복 처리하지 않는다.
- [ ] `airSlideUsed`가 플레이어 상태에 존재하며 2단 점프 카운터와 분리된다.
- [ ] 입력 단위 테스트가 통과한다.

## Validation

- `node --test --test-concurrency=1 test/game-core.test.js`

## Commit Message

```text
feat(input): add airborne slide press state

Plan: 2026-09-26-air-jump-slide-hitbox-ui-fit
Phase: P01-air-input-and-double-jump
Task: T01-airborne-input-state

- Separate S held and one-shot press state
- Track per-airborne-period slide usage
```

## Progress

- [x] 구현 완료
- [x] 검증 통과 (`--test-isolation=none` 사용)
- commit: pending
