# Task: T02 장애물 밀도와 2단 점프 안전 검증

## Status: done

## Goal

패턴 사이 실제 간격을 현재보다 15% 줄이고 기본 패턴 일부에 장애물을 1개씩 추가한다. 동시에 점프력 1 고양이가 새 100px 높은 장애물을 1단 점프로 넘을 수 있고, 짧은 간격의 2단 점프 패턴이 안전 검증을 통과하는지 고정한다.

## Decision Summary

- `PATTERN_SPACING_FACTOR`: `0.75` → `0.6375`로 변경한다. 이는 기존 실제 간격 `minGap * 0.75`에서 15% 줄어든 값이다.
- `jump-basic`, `slide-basic`, `mixed-safe`에 각각 `minZone: "outside"`인 추가 장애물 1개를 넣는다.
- 추가 장애물은 gap anchor와 `GAME_CONFIG.gapSafeMargin`을 침범하지 않는다.
- 높은 box는 `height: 100`, `y: 600`이고, jump rating 1은 그 위까지 도달해야 한다.

## Implementation

### I01. 패턴 간격 및 기본 패턴 밀도

- Related Files:
  - `public/js/game/world.js` :: `PATTERN_SPACING_FACTOR`, `resolvePatternSpacing`; modify
  - `public/js/game/patterns.js` :: `jump-basic`, `slide-basic`, `mixed-safe` entities; modify
  - `src/game/server-pattern-manifest.js` :: basic pattern entities and spacing; modify for manifest parity

#### Details

- `PATTERN_SPACING_FACTOR`를 `0.6375`로 변경한다.
- `resolvePatternSpacing`의 `safeMinimumGap = GAME_CONFIG.playerWidth * 1.5` 하한은 유지한다.
- 다음 추가 entity를 정확히 넣는다.
  - `jump-basic`: `{ type: "obstacle", x: 60, y: 620, width: 90, height: 80, variant: "pot", collectible: false, minZone: "outside" }`
  - `slide-basic`: `{ type: "obstacle", x: 20, y: 620, width: 90, height: 80, variant: "box", collectible: false, minZone: "outside" }`
  - `mixed-safe`: `{ type: "obstacle", x: 20, y: 620, width: 90, height: 80, variant: "box", collectible: false, minZone: "outside" }`
- 새 entity가 gap anchor 주변의 200px safe margin을 침범하지 않도록 `isValidPattern` 결과를 확인한다.
- 기존 zone filter 때문에 추가 entity는 home_day에 표시되지 않고 outside 이상에서 표시된다.

### I02. 고장애물 점프 및 spacing 회귀 테스트

- Related Files:
  - `test/game-systems.test.js` :: zone density, pattern spacing, pattern validation tests; modify
  - `test/game-core.test.js` :: `rating one jump reaches above every basic obstacle`; modify/new test

#### Details

- 기본 패턴의 outside obstacle count가 기존 count보다 각각 1 증가했는지 검증한다.
- `resolvePatternSpacing`가 `minGap = 240`일 때 `153`을 반환하고, player minimum `135`보다 작아지지 않는지 검증한다.
- 새 high box `{ y: 600, height: 100 }`을 cheese(점프력 rating 1) harness에 배치하고, 첫 점프 후 player hitbox와 충돌하지 않는지 검증한다.
- 새 high box를 1단 점프로 통과하는 회귀와 white/mackerel rating 5의 기존 점프 회귀를 함께 유지한다.
- 모든 `PATTERN_LIBRARY` pattern에 대해 `isValidPattern`이 true이고, 새 패턴의 짧은 장애물 간격이 `advancedSafeMargin: 80` 이상인지 검증한다.
- 실제 렌더러는 일반 `box` variant를 사용하므로 `public/js/render/draw-entities.js`의 generic box 경로와 `public/js/game/collision.js`의 rectangle polygon 경로를 변경하지 않는다. 테스트에서는 높이 100 entity가 두 경로와 일치하는지만 확인한다.

## Acceptance Criteria

- [x] 패턴 간 실제 spacing factor가 15% 줄어든다.
- [x] 기본 3패턴에 outside 전용 장애물이 하나씩 추가된다.
- [x] 새 패턴과 기존 패턴이 모두 `isValidPattern`을 통과한다.
- [x] 점프력 1 고양이가 high box를 1단 점프로 회피한다.
- [x] 2단 점프 패턴의 짧은 간격은 80px 안전 margin을 유지한다.
- [x] 기존 렌더러와 충돌 polygon에 불필요한 variant 회귀가 없다.

## Validation

- `npm test -- --test-name-pattern="rating one jump|zone gates|world spawns|pattern"`
- `npm test`

## Commit Message

```text
feat(patterns): tighten obstacle spacing with safe density

Plan: 2026-09-26-runner-stage-density-double-jump-patterns
Phase: P03-obstacle-double-jump-patterns
Task: T02-tighten-obstacle-spacing

- reduce inter-pattern spacing by fifteen percent
- add outside-only obstacles while preserving rating-one jump safety
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
