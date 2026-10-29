# Task: T04 Rendering Performance

## Status: pending

## Goal
Reduce per-frame JavaScript work and unnecessary Canvas draw calls so local gameplay starts and continues smoothly on a typical desktop PC in current Chrome or Edge, while preserving draw order and gameplay visuals.

## Decision Summary
- The fixed-step simulation prunes entities behind the player. Keep that lifecycle and local game rules.
- Preserve the invariant that `worldEntities` is ordered by ascending world-space `x`; use the invariant to cull off-screen entities without cloning/sorting the array on every rendered frame.

## Implementation

### I01. Maintain sorted world entities when patterns are spawned

- Related Files:
  - `public/js/game/world.js` :: `spawnNextPattern`, `updateWorldEntities` — maintain sorted world-space entity order; modify
  - `test/game-systems.test.js` :: world pattern spawn/pruning tests — add invariant coverage

#### Details
- **Signatures & Types**:
  ```javascript
  function spawnNextPattern(state, patternStream)
  function updateWorldEntities(state, patternStream)
  ```
- **Data & Schema Fields**:
  - World entity shape remains unchanged: each existing entity retains numeric `x`, `width`, `type`, `variant`, and gameplay metadata.
  - Ordering invariant: for every adjacent pair `worldEntities[i - 1]`, `worldEntities[i]`, require `worldEntities[i - 1].x <= worldEntities[i].x`.
- **Execution Flow / Logic**:
  1. Sort only the newly generated `bridgeEntities` + pattern `entities` by `x` before appending them in `spawnNextPattern`.
  2. Preserve pattern-relative IDs and all other fields. Do not mutate pattern library templates; spawned entities are already copied before insertion.
  3. Append new groups in their existing forward world order, relying on `minimumStartX` and `lastPatternEndX`; add an invariant assertion in tests covering a bridge plus a formation pattern.
  4. Keep `updateWorldEntities`' behind-player `filter`; filtering preserves order. Do not sort the complete live entity array in this per-step function.
- **Error & Exception Handling**: Keep the current safe-pattern retry and throw behavior unchanged. Entities with equal `x` may retain either stable order; they must not be dropped or merged.
- **State Transition & Return**: `updateWorldEntities` still returns `state.worldEntities` and leaves gaps, pattern indices, and formation state unchanged except for existing spawn/prune behavior.

### I02. Iterate only visible entities without per-frame array sorting or entity copies

- Related Files:
  - `public/js/render/scene-renderer.js` :: `drawEntity`, `render`, `getItemPresentation` — cull and draw visible entities from the sorted array; modify
  - `public/js/render/draw-entities.js` :: `drawObstacle`, `drawMouse`, `drawGrass` — accept a screen-space x override without cloning the entity; modify
  - `test/render.test.js` :: scene ordering, culling, and non-mutation checks — add

#### Details
- **Signatures & Types**:
  ```javascript
  function drawEntity(entity, state, screenX)
  function drawObstacle(ctx, entity, screenX = entity.x)
  function drawMouse(ctx, entity, screenX = entity.x)
  function drawGrass(ctx, entity, screenX = entity.x)
  function render(state, world = state.worldEntities || [])
  ```
- **Execution Flow / Logic**:
  1. Remove `[...world].sort(...)` from `render`; never modify or copy the world array during rendering.
  2. For each sorted entity calculate `screenX = entity.x - state.worldOffset`. Skip it when `screenX + entity.width < 0`; stop iteration when `screenX > GAME_CONFIG.canvasWidth`.
  3. Skip collected entities as before. For visible entities, pass `screenX` to drawing functions rather than making `{ ...entity, x: screenX }`.
  4. For sprite draws, preserve entity y, dimensions, variant, and brightness animation; compute the item bob phase from the same screen-space x used previously.
  5. Update vector drawing functions to translate to `screenX` while reading width/height and variant from the original entity.
  6. Keep background, gap, cat, rhythm target, and HUD draw order unchanged.
  7. Verify tests assert input entities retain their coordinates and array order after rendering, visible items keep ascending draw order, left/right off-screen items are not drawn, and partially visible items still draw.
- **Error & Exception Handling**: Empty arrays and arrays with no visible entities render normally. Do not assume a missing width is positive; treat the existing game entity dimensions as numeric and cull only with their current values.
- **State Transition & Return**: `render` continues returning the HUD result, including pause-button hitbox data, with no game state mutation.

### I03. Verify the frame-time target on desktop browsers

- Related Files:
  - `docs/development.md` :: manual performance check instructions — modify
  - `test/game-systems.test.js`, `test/render.test.js` :: regression coverage — read-only after I01/I02

#### Details
- Use Chrome or Edge DevTools Performance/Rendering tools on a desktop PC at the game's existing 1600×900 logical canvas; capture both the first 10 seconds after starting and a sustained run after several minutes.
- Record average frame rate and long frames before/after in the task notes. A 60 FPS frame budget is approximately 16.7 ms. Aim close to 60 FPS without sustained visible stutter; do not alter game speed, difficulty, collision, or asset artwork to satisfy the measurement.
- Add the manual check to developer docs so future rendering changes can be compared on the same browser/device class.

## Acceptance Criteria
- [ ] World entity arrays remain in ascending x order through bridge, normal, formation, spawn, and prune paths.
- [ ] Rendering performs no entity-array copy or sort per frame and does not draw fully off-screen entities.
- [ ] Canvas draw order, visible animation, pause hitbox, and gameplay state remain unchanged.
- [ ] Desktop Chrome/Edge profiling is close to 60 FPS and shows reduced scripting/rendering work compared with the pre-change capture.

## Validation
- `npm test` — all game, world, app-flow, and renderer tests pass.
- Chrome or Edge DevTools on a desktop PC — compare first-10-second and sustained-run captures; target frame interval is approximately 16.7 ms with no sustained visible stutter.

## Commit Message
```text
perf(game): reduce per-frame rendering work

Plan: 2026-10-29-github-pages-performance-cleanup
Phase: P01-static-game-performance
Task: T04-rendering-performance

- Maintain world entity order as patterns are appended
- Cull off-screen entities without copying and sorting each frame
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
