# Task: T01 jump-slide 패턴 간격 보정

## Status: done

## Goal

`actionCandidates`에 jump 뒤 low/slide가 이어지는 모든 패턴에서 해당 slide 장애물과 그 뒤 장애물을 30 logical px 늦춘다. 장애물 사이 간격과 패턴의 action 순서는 보존하고, frozen 원본 패턴을 직접 변형하지 않는다.

## Decision Summary

- 특정 패턴 이름을 하드코딩하지 않고 action sequence를 검사한다.
- jump 직후의 장애물 index부터 패턴의 마지막 entity까지 `x += 30`을 적용한다.
- `mixed-safe`처럼 actionCandidates가 없는 패턴은 변경하지 않는다.

## Implementation

### I01. 패턴 파생 보정 함수 추가

- Related Files:
  - `public/js/game/patterns.js` :: `PATTERN_LIBRARY`, `freezePattern`, `isActionSequenceValid`, `isValidPattern`, `createPatternStream`; modify

#### Details

- **Signature and type**:
  ```js
  adjustJumpSlideSpacing(pattern: Pattern): Pattern
  type Pattern = {
    id: string,
    width: number,
    requiredActions?: string[],
    actionCandidates?: string[][],
    entities: Array<{ x: number, [key: string]: unknown }>,
    [key: string]: unknown
  }
  ```
- actionCandidates가 없거나 entity 수가 2개 미만이면 원본과 동등한 복사본을 반환한다. 확정 `requiredActions`가 있으면 그 순서를 우선한다.
- 각 adjacent action에서 현재가 jump이고 다음이 low/slide인 index를 찾는다. shift 시작 index는 `i + 1`이며, 여러 jump-slide가 있어도 한 tail을 중복 이동하지 않도록 shift mask 또는 마지막 shift index를 사용한다.
- shift 시작 index부터 마지막 entity까지 새 entity 객체의 x에 30을 더하고 y, variant, width, height, item/obstacle metadata는 복사 그대로 둔다.
- 패턴의 width/총 길이가 마지막 entity의 오른쪽 끝을 나타내는 구조라면 끝 위치에도 +30을 반영한다. 단순 시작 x가 아닌 검증용 gap/stream cursor의 의미는 기존 규칙을 유지한다.
- `PATTERN_LIBRARY` frozen 원본은 그대로 두고 `createPatternStream(seed)`에서 선택 직후 보정 결과를 `isValidPattern`에 전달한다. 보정 후 `advancedSafeMargin` 검증에 실패하면 기존 invalid pattern 처리와 동일하게 제외한다.
- malformed actionCandidates/entities는 기존 validation에서 invalid로 처리하고 stream을 중단시키지 않는다.

### I02. 패턴 회귀 테스트

- Related Files:
  - `test/game-systems.test.js` :: pattern stream/validation tests; modify

#### Details

- `combo-jump-slide-jump`는 jump 직후 entity부터 후속 entity까지 x가 각각 30 증가하고 첫 entity와 비 x 데이터가 보존되는지 검증한다.
- `combo-slide-jump-slide`와 `combo-jump-slide-slide`에도 적용되는지 검증한다.
- jump-slide가 없는 패턴은 x가 변하지 않는지 검증한다.
- 보정 결과의 인접 장애물 gap과 `isValidPattern`/`advancedSafeMargin` 검증이 통과하는지 검증한다.

## Acceptance Criteria

- [ ] jump-slide를 포함한 모든 actionCandidates 패턴에 +30 tail shift가 적용된다.
- [ ] 패턴 원본의 비 x 데이터와 action 순서가 보존된다.
- [ ] jump-slide가 없는 패턴은 변경되지 않는다.
- [ ] 보정 후 안전 여백 validation을 통과한다.

## Validation

- `node --test --test-concurrency=1 test/game-systems.test.js`

## Commit Message

```text
fix(game): space obstacles after jump-slide patterns

Plan: 2026-09-26-air-jump-slide-hitbox-ui-fit
Phase: P02-pattern-hitbox-calibration
Task: T01-jump-slide-pattern-spacing

- Shift jump-slide obstacle tails by 30 logical pixels
- Preserve frozen pattern data and safety validation
```

## Progress

- [x] 구현 완료
- [x] 검증 통과 (`--test-isolation=none` 사용)
- commit: pending
