# Task: T02 Canvas Pause Input

## Status: done

## Goal

Use the existing canvas-rendered pause icon at logical rectangle { x: 1480, y: 24, width: 86, height: 52 } as the sole mouse pause control. Remove the duplicate DOM pause button, reserve the rectangle before osu/rhythm target resolution, and preserve keyboard P plus the existing pause overlay/resume behavior.

## Decision Summary

- drawHud already draws and returns the pause rectangle; its position and size must not change.
- A primary pointer inside that rectangle toggles pause and returns before rhythm scoring. Other pointer buttons and points continue through the existing rhythm path.
- The pause overlay keeps its DOM resume/restart/settings controls; only the always-visible duplicate DOM pause button is removed.

## Implementation

### I01. Remove the duplicate DOM pause button

- Related Files:
  - public/js/ui/pause-controller.js :: createPauseController, mount, sync, destroy; modify

#### Details

- Remove the pauseButton variable and all DOM button creation, text synchronization, append, and removal logic from createPauseController.
- Remove PAUSE_COPY if it becomes unused. The overlay’s resume button remains the control for resuming after the game is paused.
- Keep togglePause behavior exactly as-is: unlock audio, pause/resume the loop, play the corresponding SFX, start/stop music, and sync overlay visibility/aria-hidden.
- Keep pause-overlay, pause-card, heading fitting, resume/restart buttons, settings panel mounting, and destroy cleanup for the overlay.
- Do not add another positioned HTML button over the canvas.

### I02. Route canvas pause hit detection before rhythm scoring

- Related Files:
  - public/js/ui/pause-hitbox.js :: isPointInsideRect; new
  - public/js/app/app-controller.js :: initializeGame; modify
  - public/js/render/draw-hud.js :: drawHud; read-only
  - public/js/render/scene-renderer.js :: render; read-only

#### Details

- Add a pure helper with signature isPointInsideRect(point, rect). It must accept the logical pointer object from createInputController and a { x, y, width, height } hit area, return false for missing/non-finite inputs, and treat the four rectangle edges as inside.
- Import the helper into app-controller.js. During initializeGame, keep a local pauseHitArea initialized from the renderer’s first render result and refresh it from every subsequent renderer.render(nextState) result. The renderer’s returned shape is { pauseButton: { x, y, width, height } }.
- In the createInputController onPointerDown callback, first check button === primary and isPointInsideRect({ x, y }, pauseHitArea). If true, call pauseController?.togglePause?.() and return immediately.
- Only when the click is not the pause hit area should the existing gameState.status !== running guard and resolveRhythmTarget scoring path run. This guarantees a pause click cannot score an osu/rhythm target.
- Preserve the existing P key callback, logical pointer conversion, secondary-button behavior, and renderer HUD rectangle. Do not change canvas dimensions or pause icon coordinates.

### I03. Keep render lifecycle synchronized

- Related Files:
  - public/js/app/app-controller.js :: renderer setup and onStateChange; modify

#### Details

- Render once before the loop starts or otherwise ensure pauseHitArea is populated before the first pointer event.
- On each state change, assign the returned pauseButton only when a valid renderer result exists; avoid throwing when canvas/context/renderer is unavailable in tests.
- pauseController may be assigned after the input callback is created; the callback must resolve it at event time, as the current keyboard pause callback does.

## Acceptance Criteria

- [ ] No .pause-button DOM element is mounted in the game shell.
- [ ] The existing canvas pause icon remains at { x: 1480, y: 24, width: 86, height: 52 }.
- [ ] Primary click inside that logical rectangle toggles pause and does not resolve or score a rhythm target.
- [ ] Clicks outside the rectangle retain the existing rhythm behavior; secondary clicks do not pause.
- [ ] Keyboard P, pause overlay resume/restart/settings, audio effects, and cleanup continue to work.

## Validation

- node --test test/pause-hitbox.test.js test/audio-pause.test.js test/render.test.js test/app-flow.test.js
- Manual browser check: start a run, click the canvas pause icon, confirm the overlay opens without scoring; resume from the overlay and confirm the DOM duplicate button is gone.

## Commit Message

~~~text
feat(game): move pause control into the canvas HUD

Plan: 2026-09-27-flow-card-pause-button
Phase: P01-card-pause
Task: T02-canvas-pause-input

- Remove the duplicate DOM pause button
- Route the existing canvas pause hit area before rhythm scoring
~~~

## Progress

- [x] Implementation complete
- [x] Existing pause/render/app-flow validation passed; dedicated hitbox coverage is scheduled in T03
- commit: recorded in git history

## Validation Results

- `node --test test/audio-pause.test.js test/render.test.js test/app-flow.test.js`: pass, 43/43.
- The dedicated `test/pause-hitbox.test.js` command is deferred to T03 because that test file is created by the next task.
