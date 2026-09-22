# Task: T02 배경 패럴랙스·고양이 포즈 및 폴백 렌더링

## Status: done

## Goal

플레이 중에는 준비된 배경과 고양이 포즈를 사용해 동화책풍 깊이감과 움직임을 만들고, 하나라도 준비되지 않은 에셋은 기존 코드 기반 배경·고양이·아이템 렌더링으로 자연스럽게 대체한다.

## Decision Summary

- 배경은 길게 반복되고 원경은 느리게 움직여야 한다.
- 고양이는 run/jump/slide 포즈를 선택하며, 수집품·장애물은 향상된 캔버스 드로잉을 유지한다.

## Implementation

### I01. 에셋 지원 씬 렌더러와 포즈 선택

- Related Files:
  - `public/js/render/scene-renderer.js` :: `createSceneRenderer`, `drawBackgroundScene`, `drawCatScene`; modify
  - `public/js/render/draw-cat.js` :: `drawCat`; modify
  - `public/js/render/draw-backgrounds.js` :: `drawBackground`, `drawHomeDay`, `drawOutside`, `drawHomeNight`; modify
  - `public/js/render/draw-entities.js` :: `drawMouse`, `drawGrass`, `drawObstacle`; modify
  - `public/js/render/draw-hud.js` :: `drawHud`; modify
  - `test/render.test.js` :: renderer-call assertions; modify

#### Details

- **Signatures & Types**:
  ```javascript
  function createSceneRenderer(ctx, assets = {})
  // assets: { getCatSprite?, getBackgroundSprite?, getItemSprite? }
  function getCatPose(player) // 'run' | 'jump' | 'slide'
  ```
- **Execution Flow / Logic**:
  1. Pose is `slide` for `player.isSliding`, `jump` for `!player.isGrounded`, otherwise `run`. Add only presentation bob/frame alternation from `elapsedMs`/`animationFrame`; never mutate physics.
  2. For valid cat sheet, crop one of its three equal horizontal cells with nine-argument `drawImage` into existing `player.x/y/width/height`. Unknown/unloaded/crop-invalid sheets call `drawCat`.
  3. For loaded zone background, repeat copies covering logical 1600px canvas; shift near layer with `worldOffset` and a distant/tinted layer with a slower factor. Missing asset or missing `drawImage` calls existing vector draw functions.
  4. Refine vector fallback backgrounds with repeated moving details, preserving existing function exports and game physics.
  5. Refine mouse toy, cat grass, obstacles and HUD only visually: soft outline/shadow/highlight and readable Korean panel. Preserve entity geometry/types, collection/collision logic and returned pause-button coordinates.
  6. Tests assert loaded background drawing and three cat pose source regions. Separate no-assets test verifies vector methods still occur; no browser pixel snapshots.

## Acceptance Criteria

- [x] Loaded sheets render distinct run/jump/slide cells and rendering does not mutate game state.
- [x] All zones repeat loaded art with near/far movement and remain renderable with no assets.
- [x] Entities, HUD and pause hit area remain compatible with game state/contracts.

## Validation

- `npm.cmd test -- test/render.test.js test/game-core.test.js test/game-systems.test.js` — render and game contracts pass.
- `npm.cmd test` — complete serial Node test suite passes.
- Manual: W jump, S slide, inspect three zones, then block one cat/background asset and confirm fallback.

## Commit Message

```text
feat(render): animate storybook cat runner scenes

Plan: 2026-09-22-cat-runner-visual-korean-refresh
Phase: P02-art-assets-canvas
Task: T02-scene-animation-fallback

- Render cat poses and layered repeating scene art from preloaded assets
- Preserve refined vector fallbacks for unavailable images and game entities
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
