# Task: T02 고양이 상승·하강 점프 연출

## Status: pending

## Goal

기존 고양이 sprite sheet와 벡터 폴백 모두에서 공중 상태를 상승·하강 2단계로 표현해, 점프 중인 고양이가 단순히 정지한 것처럼 보이지 않게 한다.

## Decision Summary

- 새 이미지 에셋은 만들지 않고 기존 `jump` sprite frame을 사용한다.
- `player.vy < 0`은 상승, `player.vy >= 0`은 하강으로 판정한다.
- 연출용 위치·다리 변화는 복사한 렌더 데이터에만 적용하고 게임 상태·충돌 사각형은 변경하지 않는다.

## Implementation

### I01. Sprite-sheet jump presentation

- Related Files:
  - `public/js/render/scene-renderer.js` :: `drawCatScene`, new `getCatAirPresentation` — modify
  - `public/js/render/draw-cat.js` :: `drawCat` — modify vector leg pose only
  - `public/js/render/asset-manifest.js` :: existing cat manifest — read-only

#### Details

- Add a pure helper with a signature equivalent to:
  ```javascript
  function getCatAirPresentation(player): {
    yOffset: number,
    phase: "ground" | "rising" | "falling"
  }
  ```
- Return `ground, 0` for grounded/sliding players, `rising, -4` when `isGrounded === false && vy < 0`, and `falling, 3` when `isGrounded === false && vy >= 0`.
- Keep the sprite source frame fixed to the existing `jump` frame while airborne. Apply only `yOffset` to the destination rectangle; do not modify `state.player.y`, width, height, or collision data.
- In vector `drawCat`, preserve the existing run/slide leg animation and use the air phase to select two simple leg offsets: rising `10`, falling `3`. Keep the existing palette, effects, shadow, and logical destination size.
- Use a copied player object when passing the visual y adjustment to `drawCat`, e.g. `{ ...state.player, y: state.player.y + yOffset }`.

### I02. Animation tests

- Related Files:
  - `test/render.test.js` :: sprite pose/destination and immutability tests — modify
  - `test/game-core.test.js` :: airborne state preservation — modify only if needed

#### Details

- Assert sprite rendering uses the jump source frame for both rising and falling and that destination y differs by the expected phase offset.
- Assert grounded and sliding rendering retains existing source frames and destination geometry.
- Assert rendering with rising/falling players does not mutate the game state or player collision dimensions.
- Preserve vector fallback tests when no cat sprite is available.

## Acceptance Criteria

- [ ] Rising and falling airborne states are visually distinguishable for PNG and vector cats.
- [ ] Jump animation never mutates physics state or collision geometry.
- [ ] Existing run, slide, palette, and effect rendering contracts remain green.

## Validation

- `npm.cmd test -- test/render.test.js test/game-core.test.js` — jump presentation, vector fallback, physics state, and existing render tests pass.

## Commit Message

```text
feat(render): animate cat jump ascent and descent

Plan: 2026-09-22-difficulty-obstacle-cat-jump
Phase: P01-difficulty-obstacle-cat-jump
Task: T02-cat-jump-animation

- Add rising and falling presentation phases to cat rendering
- Preserve jump physics and collision geometry
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
