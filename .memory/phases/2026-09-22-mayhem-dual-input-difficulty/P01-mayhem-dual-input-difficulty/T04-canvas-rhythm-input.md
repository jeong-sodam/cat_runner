# Task: T04 Canvas 타겟 렌더링과 마우스 입력

## Status: done

## Goal

T03의 rhythm state를 기존 Canvas 렌더 루프에 통합한다. 화면 전체 논리 좌표에 반투명 원형 타겟을 그리고, 좌클릭·우클릭을 normal/bonus target에 전달한다. 기존 키보드 입력, 고양이·장애물 충돌, HUD 렌더링을 방해하지 않으면서 5칸 health와 accuracy를 표시한다.

## Decision Summary

- 타겟은 별도 DOM이 아니라 기존 Canvas에 통합하고, 게임 요소와 겹쳐도 반투명으로 그린다.
- 마우스 좌표는 `canvas.getBoundingClientRect()`와 논리 Canvas 크기를 이용해 변환한다. 우클릭은 context menu를 막는다.
- Canvas에서 타겟을 그리는 순서는 world entities와 cat 이후, HUD 이전이며 타겟은 collision geometry에 절대 참여하지 않는다.

## Implementation

### I01. Pointer input adapter

- Related Files:
  - `public/js/game/input-controller.js` :: `createInputController`; modify
  - `public/js/render/canvas-viewport.js` :: logical coordinate conversion; read-only or expose helper if needed
  - `public/js/app/app-controller.js` :: input creation and rhythm target callback wiring; modify in T06 only if start flow dependency requires it

#### Details

- Extend `createInputController(canvas, onPause, options)` with `onPointerDown({ x, y, button, event })` callback while retaining W/S/P behavior and destroy cleanup.
- Convert `clientX/clientY` into logical coordinates using the Canvas bounding rect and `canvas.width/rect.width`, `canvas.height/rect.height`. Use `button === 2 ? "secondary" : "primary"`; ignore non-left/right buttons.
- Call `preventDefault` for right-click and pointer events handled by the game. Do not treat a pointer event as pause or keyboard input.
- Keep input adapter side-effect free with respect to game state; it only forwards a normalized pointer event. T03/T06 will decide whether the callback resolves a target.

### I02. Scene and HUD rendering

- Related Files:
  - `public/js/render/scene-renderer.js` :: `createSceneRenderer`, `render`; modify
  - `public/js/render/draw-hud.js` :: `drawHud`; modify
  - `public/js/render/color-palette.js` :: rhythm target colors; modify only if a palette entry is needed

#### Details

- Add a `drawRhythmTargets(ctx, rhythmState)` helper or renderer-local equivalent. Draw each active target as a translucent filled circle with a visible ring, distinguish primary/secondary by palette and a small label/icon, and never mutate target/state.
- Draw target coordinates in logical Canvas space and leave target overlap with cat/entities valid. Use target radius from state; do not clip targets to a side panel.
- Change health display from 3 hearts based on `GAME_CONFIG.maxHealth / 3` to `state.maxHealth` filled/empty slots, so 4-, 5-, and 6-health cats are unambiguous. Avoid assuming 30 health.
- Add compact rhythm accuracy and active local/server mode indicators without covering pause control. Existing score, distance, effect, pause hit area, and return value remain unchanged.
- Renderer must continue to use copied presentation data and must not mutate player collision dimensions or rhythm counters.

### I03. Render/input tests

- Related Files:
  - `test/render.test.js` :: target draw calls, 5/6 health display, immutability; modify
  - `test/game-core.test.js` :: pointer normalization and cleanup; modify

#### Details

- Assert primary and secondary targets produce distinct Canvas draw operations, retain logical x/y/radius, and render with alpha/outline.
- Assert logical coordinate conversion works under letterboxing and right-click maps to `secondary` while context menu is prevented.
- Assert renderer does not alter game state, player width/height, active target status, or collision geometry. Preserve existing sprite/vector cat and HUD tests.

## Acceptance Criteria

- [ ] Canvas shows active targets in full-screen random logical positions with primary/bonus visual distinction.
- [ ] Left/right clicks resolve through normalized logical coordinates without interfering with keyboard controls or collision.
- [ ] 4~6 health and rhythm accuracy are visible while existing HUD behavior remains compatible.
- [ ] Render and input tests cover letterboxing, button mapping, and immutability.

## Validation

- `npm.cmd test -- test/render.test.js test/game-core.test.js`

## Commit Message

```text
feat(render): add canvas rhythm targets and mouse input

Plan: 2026-09-22-mayhem-dual-input-difficulty
Phase: P01-mayhem-dual-input-difficulty
Task: T04-canvas-rhythm-input

- Render zone-scaled primary and bonus targets on Canvas
- Forward left and right mouse clicks without changing runner physics
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending

## Execution Record

- Implementation complete
- Validation passed: `npm.cmd test -- test/render.test.js test/game-core.test.js` (25 tests); `npm.cmd test -- test/app-flow.test.js` (9 tests)
- Commit: pending
