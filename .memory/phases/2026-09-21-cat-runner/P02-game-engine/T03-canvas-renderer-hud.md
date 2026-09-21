# Task: T03 Canvas 카툰 렌더러와 HUD

## Status: done

## Goal

게임 상태를 16:9 Canvas에 밝은 2D 카툰 스타일로 렌더링한다. 6종 고양이와 아이템·장애물·3개 배경 구역·체력·점수·거리·현재 효과를 외부 이미지 없이 코드 도형으로 표현한다.

## Decision Summary

- 논리 캔버스는 1600x900이고 실제 viewport에 contain 방식으로 맞춘다.
- 초기 그래픽은 Canvas 도형이며 나중에 PNG 스프라이트를 교체할 수 있도록 renderer 인터페이스를 분리한다.
- 보너스 효과는 캐릭터 주변 색상과 이펙트로 표시한다.

## Implementation

### I01. Canvas 스케일과 scene renderer

- Related Files:
  - public/js/render/canvas-viewport.js :: createCanvasViewport(canvas); new
  - public/js/render/scene-renderer.js :: createSceneRenderer(ctx, assets); new
  - public/js/render/color-palette.js :: PALETTE; new

#### Details

- createCanvasViewport() sets canvas.width=1600 and canvas.height=900, calculates CSS transform/letterbox from ResizeObserver, and exposes toLogicalPoint(clientX, clientY).
- createSceneRenderer() exposes render(state, world) and separate drawBackground, drawCat, drawObstacle, drawMouse, drawGrass, drawHud methods.
- All methods receive state/data and do not mutate game state.
- Asset interface is getCatSprite(catId), getItemSprite(type, variant), returning null initially; null uses vector fallback.

### I02. Cartoon entities and backgrounds

- Related Files:
  - public/js/render/draw-cat.js :: drawCat(ctx, catId, player, effect); new
  - public/js/render/draw-entities.js :: drawObstacle(), drawMouse(), drawGrass(); new
  - public/js/render/draw-backgrounds.js :: drawHomeDay(), drawOutside(), drawHomeNight(); new

#### Details

- Six cats must be visually distinguishable by coat palette: black, white, calico, cheese, mackerel, chaos.
- Cat drawing includes body, ears, eyes, tail, running leg frames, and slide pose. Use effect color rings: magnet blue, invincible gold, double_score purple, slow_miss red.
- Home day uses room/furniture shapes, outside uses alley/park shapes, home night uses darker room shapes. All backgrounds scroll with parallax layers.
- Mouse is a toy silhouette with ear and tail; grass is a cat-grass bundle; obstacles include boxes, pots, yarn, fences, puddles, and bins.

### I03. HUD and renderer tests

- Related Files:
  - public/js/render/draw-hud.js :: drawHud(ctx, state); new
  - test/render.test.js :: viewport dimensions, cat palette, HUD state tests; new

#### Details

- HUD shows score, distance in meters, 3 heart slots derived from health/30, current effect name/color if active, and a pause button hit area exposed to the UI layer.
- No text is rendered from unescaped user nickname or email inside Canvas; DOM UI owns user strings.
- Renderer tests use a fake 2D context that records method names, so tests do not depend on pixel snapshots.

## Acceptance Criteria

- [ ] Canvas remains 16:9 on resize without distorting entity proportions.
- [ ] All six cats, three backgrounds, mouse, grass, and obstacle variants render without external asset files.
- [ ] Effect colors are visibly distinct and HUD updates from state without mutation.
- [ ] Renderer can switch from vector fallback to an injected asset provider.

## Validation

- node --test test/render.test.js
- npm test
- Manual: npm start, resize browser, verify no horizontal scroll and no distorted canvas.

## Commit Message

~~~text
feat(render): draw cartoon cats world and hud on canvas

Plan: 2026-09-21-cat-runner
Phase: P02-game-engine
Task: T03-canvas-renderer-hud

- add responsive logical canvas viewport
- draw six cat styles, three backgrounds, and entities
- render score, health, distance, and effect feedback
~~~

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
