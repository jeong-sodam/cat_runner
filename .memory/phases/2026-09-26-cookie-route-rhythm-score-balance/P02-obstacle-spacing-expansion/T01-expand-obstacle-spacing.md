# Task: T01 모든 패턴 내부 장애물 간격과 길이 확장

## Status: done

## Goal

모든 기본·콤보·2단 점프 패턴의 내부 x 간격을 15% 늘리고, 패턴 `width`, `gapAnchor`, `formationAnchor`, entity x 좌표를 함께 확장한다. 확장 후에도 모든 패턴이 `isValidPattern`과 gap safe margin을 통과하고, P01의 쥐 유도 루트가 확장된 장애물 위치를 기준으로 재생성되도록 한다.

## Decision Summary

- 내부 obstacle spacing scale은 `1.15`다.
- 패턴 전체 길이와 gap/formation anchor도 같은 x scale을 적용한다.
- 실제 높이·hitbox·variant·required action은 변경하지 않는다.
- 15% 확장으로 생긴 공간은 쥐 route가 사용할 수 있으며, 장애물과 gap 안전 조건을 다시 계산한다.

## Implementation

### I01. horizontal pattern expansion

- Related Files:
  - `public/js/game/patterns.js` :: `PATTERN_LIBRARY`, 새 `expandPatternHorizontally`, `isValidPattern`, `createPatternStream`; modify
  - `public/js/game/world.js` :: `spawnNextPattern` pattern width/gap usage; read-only unless tests expose required anchor handling

#### Details

- `PATTERN_INTERNAL_SCALE = 1.15`를 추가한다.
- `expandPatternHorizontally(pattern, scale = PATTERN_INTERNAL_SCALE)`를 구현한다. 반환 객체는 원본 pattern을 mutation하지 않는 deep-enough clone이어야 한다.
- 다음 필드를 `Math.round(value * scale)`로 변환한다:
  - `pattern.width`
  - `pattern.gapAnchor.x`
  - `pattern.formationAnchor.x`
  - 모든 entity의 `x`
  - pattern 내부 `gaps[].x`가 존재하면 동일 변환
- entity의 `y`, `width`, `height`, `variant`, `collectible`, `minZone`, formation metadata와 `minGap`은 그대로 유지한다.
- scale은 pattern source가 선택되어 `requiredActions`를 만들기 전에 적용하거나, 적용 시 `adjustJumpSlideSpacing`와 route generator가 확장된 좌표를 보도록 일관된 순서를 사용한다. 최종 stream output은 `isValidPattern`을 다시 통과해야 한다.
- `gapAnchor.x + GAME_CONFIG.gapMaxWidth <= width - safeMargin` 및 각 obstacle 사이 `advancedSafeMargin`을 유지한다. 조건이 깨지는 패턴은 source 좌표를 수동 보정하되 안전 margin을 줄이지 않는다.
- formation anchor가 변경되므로 `isFormationAnchorSafe`와 5×5 진형의 reserved corridor도 확장된 width 기준으로 계산한다.

### I02. 확장 geometry 회귀 테스트

- Related Files:
  - `test/game-systems.test.js` :: pattern validation, gap, formation, obstacle spacing tests; modify/new

#### Details

- 모든 `PATTERN_LIBRARY` source와 stream output의 obstacle 순서에 대해 인접 gap이 기존 좌표 대비 15% 확장되었음을 검증한다.
- 모든 pattern의 width/gapAnchor/formationAnchor가 유효 범위에 있고 `isValidPattern(pattern) === true`인지 확인한다.
- outside/home_night gap이 entity와 `GAME_CONFIG.gapSafeMargin`만큼 떨어져 있는지 확인한다.
- double-jump pattern의 `advancedSafeMargin: 80`과 high box geometry를 유지하는지 확인한다.
- client route mouse가 확장된 obstacle 뒤의 새로운 좌표를 따라가며 obstacle과 겹치지 않는지 확인한다.

## Acceptance Criteria

- [ ] 모든 패턴 내부 장애물 간격이 15% 확장된다.
- [ ] width·gap anchor·formation anchor가 함께 확장된다.
- [ ] 기존 obstacle height/hitbox와 double-jump safety margin이 유지된다.
- [ ] 모든 패턴과 gap/formation 검증이 통과한다.

## Validation

- `node test/game-systems.test.js`
- `node test/game-core.test.js`

## Commit Message

```text
feat(patterns): expand internal obstacle spacing

Plan: 2026-09-26-cookie-route-rhythm-score-balance
Phase: P02-obstacle-spacing-expansion
Task: T01-expand-obstacle-spacing

- stretch pattern geometry for safer obstacle gaps
- preserve gap and double-jump validation margins
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: recorded in git history
