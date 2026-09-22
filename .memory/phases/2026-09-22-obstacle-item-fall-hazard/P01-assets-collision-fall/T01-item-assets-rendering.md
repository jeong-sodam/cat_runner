# Task: T01 아이템 PNG 에셋 및 렌더링 폴백

## Status: done

## Goal

장애물 4종, 쥐 인형, 강아지풀을 기존 캔버스 논리 크기의 2배인 투명 PNG로 제공하고, 프리로드가 성공하면 이미지를 사용하며 실패·미지원 환경에서는 현재 벡터 드로잉으로 자동 폴백한다.

## Decision Summary

- 파일은 동화책풍 독립 PNG 6개이며, 이미지 자체는 정적이고 렌더러에서 작은 흔들림·밝기 변화를 추가한다.
- 기존 엔티티 논리 크기와 수집 범위는 바꾸지 않는다. 아이템 에셋 실패는 플레이 가능성을 막지 않는다.

## Implementation

### I01. 투명 PNG 에셋 생성 및 매니페스트

- Related Files:
  - `public/assets/cat-runner/items/box.png` — 180x160 투명 PNG; new binary asset
  - `public/assets/cat-runner/items/fence.png` — 280x80 투명 PNG; new binary asset
  - `public/assets/cat-runner/items/pot.png` — 180x160 투명 PNG; new binary asset
  - `public/assets/cat-runner/items/yarn.png` — 260x80 투명 PNG; new binary asset
  - `public/assets/cat-runner/items/mouse.png` — 84x84 투명 PNG; new binary asset
  - `public/assets/cat-runner/items/cat-grass.png` — 96x144 투명 PNG; new binary asset
  - `public/js/render/asset-manifest.js` :: `ITEM_ASSET_MANIFEST` — add item definitions

#### Details

- Generate each image with the image-generation workflow using warm storybook colors, thick ink outlines, soft painted shadows, transparent background, and no text or extra objects.
- Add this shape while preserving existing cat/background exports:

  ```javascript
  const ITEM_ASSET_MANIFEST = Object.freeze({
    obstacle: Object.freeze({
      box: Object.freeze({ src, width: 180, height: 160 }),
      fence: Object.freeze({ src, width: 280, height: 80 }),
      pot: Object.freeze({ src, width: 180, height: 160 }),
      yarn: Object.freeze({ src, width: 260, height: 80 }),
    }),
    mouse: Object.freeze({
      toy: Object.freeze({ src, width: 84, height: 84 }),
    }),
    grass: Object.freeze({
      "cat-grass": Object.freeze({ src, width: 96, height: 144 }),
    }),
  });
  ```

- Export `ITEM_ASSET_MANIFEST` and ensure every `src` resolves below `/assets/cat-runner/items/`.

### I02. Item asset preloader and scene integration

- Related Files:
  - `public/js/render/asset-loader.js` :: `createAssetLoader`, `loadImage`, `preload`, `getItemSprite`, `getState` — modify
  - `public/js/render/scene-renderer.js` :: `createSceneRenderer`, `drawEntity` — modify
  - `public/js/render/draw-entities.js` :: `drawObstacle`, `drawMouse`, `drawGrass` — preserve and refine fallback only if needed
  - `test/render.test.js` :: item manifest/loader/renderer tests — modify

#### Details

- Extend the loader state with `items: Map<string, Image>` keyed by `${type}:${variant}` and load `manifest.items` during the same one-shot `preload()` promise.
- Add `getItemSprite(type, variant)` returning the successful image or `null`; unsupported `ImageCtor`, missing `src`, construction errors, and `onerror` must record `items:${type}:${variant}` in `failures` and resolve without rejecting the complete preload.
- Preserve the existing `getCatSprite`, `getBackgroundSprite`, `getCatPreviewSrc`, and state-copy contracts.
- `createSceneRenderer` already accepts `getItemSprite`; pass the loader result through and use a valid item image with the existing `entity.x/y/width/height` destination. Do not change entity geometry, collection state, or world coordinates.
- Add presentation-only animation: use `state.elapsedMs` to apply a small deterministic vertical bob/brightness treatment to mouse and grass image destinations; never mutate the entity or game state. Obstacles remain visually stable.
- If an item sprite is absent, unloaded, or `ctx.drawImage` is unavailable, call the existing vector function for that entity type.

### I03. Tests and asset contracts

- Verify all six files exist, the manifest maps the six logical variants, loader preloads successful item images once, failures return `null`, and no-assets rendering still calls vector drawing methods.
- Verify image rendering keeps each entity’s original destination rectangle and does not set `collected` or `hitByPlayer`.

## Acceptance Criteria

- [ ] Six transparent PNG assets exist at the specified paths and match the storybook visual direction.
- [ ] Successful item loads render through `drawImage`; failed or unsupported loads use vector fallbacks without rejecting preload.
- [ ] Mouse and grass presentation animation does not mutate game state or alter collision/collection geometry.

## Validation

- `npm.cmd test -- test/render.test.js` — manifest, loader, image/fallback rendering tests pass.
- `npm.cmd test -- test/app-flow.test.js test/render.test.js` — existing UI and asset contracts remain green.

## Commit Message

```text
feat(render): add storybook item assets and fallbacks

Plan: 2026-09-22-obstacle-item-fall-hazard
Phase: P01-assets-collision-fall
Task: T01-item-assets-rendering

- Add transparent obstacle, mouse, and cat-grass PNG assets
- Preload item art while preserving vector fallbacks and entity contracts
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending

## Execution Record

- Implementation complete: six generated PNG assets, manifest entries, item preloading, sprite rendering, deterministic presentation bob/brightness, and vector fallbacks.
- Validation passed: `npm.cmd test -- test/render.test.js` and `npm.cmd test -- test/app-flow.test.js test/render.test.js`.
