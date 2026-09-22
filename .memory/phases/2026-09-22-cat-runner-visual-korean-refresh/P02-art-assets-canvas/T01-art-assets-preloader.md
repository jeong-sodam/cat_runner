# Task: T01 동화책 에셋과 실패 허용 사전 로더

## Status: done

## Goal

따뜻한 동화책풍의 여섯 고양이 3-포즈 스프라이트와 집 안 낮/집 밖/집 안 밤의 반복 가능한 배경을 프로젝트에 포함한다. 시작 화면에서 이를 미리 불러오되, 개별 파일 실패나 `Image` 미지원 환경에서는 게임이 멈추지 않고 빈 에셋 제공자로 동작하게 한다.

## Decision Summary

- 생성 에셋은 저장소에 포함한다. 여섯 고양이는 털색·무늬·꼬리·표정이 다르고 액세서리는 없다.
- 새 에셋은 시작 단계에서 preload하며 실패하면 기존 캔버스 그림으로 대체한다.

## Implementation

### I01. 생성 이미지 산출물과 명시적 매니페스트

- Related Files:
  - `public/assets/cat-runner/cats/black.png`, `white.png`, `calico.png`, `cheese.png`, `mackerel.png`, `chaos.png` :: run/jump/slide three-frame horizontal sprite sheets; new
  - `public/assets/cat-runner/backgrounds/home-day.png`, `outside.png`, `home-night.png` :: repeat-safe 1600×900 scene illustrations; new
  - `public/js/render/asset-manifest.js` :: asset URLs, ids, dimensions, pose names; new

#### Details

- **Data & Schema Fields**:
  - `CAT_POSES`: frozen array `['run', 'jump', 'slide']` in that exact order.
  - `CAT_ASSET_MANIFEST`: frozen record keyed by `black`, `white`, `calico`, `cheese`, `mackerel`, `chaos`; each entry is `{ src: string, frameWidth: number, frameHeight: number, frameCount: 3 }`.
  - `BACKGROUND_ASSET_MANIFEST`: frozen record keyed by `home_day`, `outside`, `home_night`; each entry is `{ src: string, width: 1600, height: 900 }`.
- **Execution Flow / Logic**:
  1. Use the `imagegen` skill to make the PNGs; do not hand-draw raster pixels. Prompt for transparent, three equal-cell horizontal cat sheets with full body, no text/accessories, and run/jump/low-slide left-to-right.
  2. Required cat identities: black, white, calico, orange cheese tabby, silver mackerel tabby, chaos multi-pattern. Style: pastel storybook 2D, soft outlines, distinct tail and expression per cat.
  3. Make the three 1600×900 backgrounds repeat-safe at left/right edges. Home-day/night are the same home at different times; outside is a street/garden transition; keep ground near logical `y=700` legible.
  4. Visually inspect every generated image. Regenerate an asset whose cells are not clearly separable/equal or whose tile edges are unusable. Do not overwrite unrelated files.
  5. Put stable public URLs in the manifest; renderer must not infer filenames from cat ids.

### I02. Browser image preloader and app bootstrap

- Related Files:
  - `public/js/render/asset-loader.js` :: `createAssetLoader`; new
  - `public/js/app/app-controller.js` :: module setup, `bootstrap`, `startGame`; modify
  - `test/render.test.js` :: deterministic loader tests; modify
  - `test/app-flow.test.js` :: bootstrap failure-tolerance test; modify

#### Details

- **Signatures & Types**:
  ```javascript
  function createAssetLoader(options = {})
  // options: { ImageCtor?: typeof Image, manifest?: { cats, backgrounds } }
  // returns: { preload, getCatSprite, getBackgroundSprite, getCatPreviewSrc, getState }
  ```
- **Data & Schema Fields**:
  - State: `{ status: 'idle' | 'loading' | 'ready', cats: Map<string, HTMLImageElement>, backgrounds: Map<string, HTMLImageElement>, failures: Set<string> }`.
  - `getCatSprite(catId)`/`getBackgroundSprite(zoneId)` return a loaded image or `null`; `getCatPreviewSrc(catId)` returns stable manifest URL or `null`.
- **Execution Flow / Logic**:
  1. `preload()` creates all known images once and resolves after every load or error; missing files or `ImageCtor` must not reject it.
  2. Store successes only; record failures; repeated `preload()` calls share a promise and do not issue duplicates.
  3. Construct one loader in `createAppController` (allow `options.assetLoader` injection). From Korean loading screen, start/await preload and continue normal auth/nickname/character routing even if it unexpectedly throws.
  4. Pass loader into `createSceneRenderer` in `startGame`; frame rendering must never initiate network loading.
  5. Test success, one image failure, missing `ImageCtor`, id lookup and bootstrap continuation with fakes.

## Acceptance Criteria

- [ ] Nine committed PNG assets exist at listed paths and match specified style, identities, poses and zones.
- [ ] Manifest covers exactly existing six cat ids and three zone ids with explicit URLs/dimensions.
- [ ] Bootstrap preloads once, while every image failure still reaches normal flow and getters return `null`.

## Validation

- `npm.cmd test -- test/render.test.js test/app-flow.test.js` — loader and app-flow tests pass.
- `npm.cmd test` — complete serial Node test suite passes.
- Manual: `npm.cmd start`; hard-refresh normally and with a deliberately blocked asset URL; both remain playable.

## Commit Message

```text
feat(render): add storybook art assets and preload pipeline

Plan: 2026-09-22-cat-runner-visual-korean-refresh
Phase: P02-art-assets-canvas
Task: T01-art-assets-preloader

- Add six animated cat sheets and three repeat-safe scene assets
- Preload images once with graceful per-asset fallback behavior
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
