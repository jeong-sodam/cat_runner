# Task: T02 Switch Pause Shortcut to Escape

## Status: done

## Goal
During gameplay, make `Escape` toggle pause and resume, remove `P` as a pause shortcut, and preserve the pause overlay, pause-button, audio, and frozen-simulation behavior.

## Decision Summary
- Replace the `P` keyboard shortcut with `Escape`; a non-repeating Escape keydown uses the existing pause-toggle callback.
- Keep pause-button and overlay behavior in `createPauseController` unchanged. Ignore Escape auto-repeat so holding the key cannot rapidly toggle state.

## Implementation

### I01. Map Escape to the existing pause toggle and remove P mapping

- Related Files:
  - `public/js/game/input-controller.js` :: `normalizeKey`, `onKeyDown`, `createInputController` — keyboard-to-game input mapping; modify
  - `public/js/app/app-controller.js` :: `createInputController` setup — existing callback already calls `pauseController.togglePause()`; read-only
  - `public/js/ui/pause-controller.js` :: `togglePause` — shared pause/resume and audio transition; read-only

#### Details
- **Signatures & Types**:
  ```javascript
  function createInputController(canvas, onPause, options = {})
  function normalizeKey(event)
  function onKeyDown(event)
  ```
- **Data & Schema Fields**:
  - No persistent settings or input schema changes. `normalizeKey(event)` returns `event.key.toLowerCase()` when `event.key` is a string, otherwise `""`.
  - Existing input state remains `jumpPressed: boolean`, `slideHeld: boolean`, and `slidePressed: boolean`.
- **Execution Flow / Logic**:
  1. Continue recognizing `w` for jump and `s` for slide. Replace `p` in the recognized-key allowlist with `escape`.
  2. Ignore unsupported keys, including `p`, before calling `preventDefault()`; P must not invoke `onPause`.
  3. Call `preventDefault()` for recognized gameplay keys as today.
  4. On `key === "escape" && !event.repeat`, invoke `onPause?.()` exactly once. Ignore repeat keydowns so a held Escape does not immediately undo its own pause or resume.
  5. Do not add a separate paused state, keyup state, or audio action. The callback already reaches `pauseController.togglePause()`, which pauses/stops music or resumes/restarts music and updates the overlay.
- **Error & Exception Handling**: Keep optional chaining for the `onPause` callback. Unknown keys must not prevent browser defaults or mutate jump/slide state.
- **State Transition & Return**: Running + first Escape keydown -> paused; paused + next non-repeating Escape keydown -> running. Repeating Escape does not transition state. P never transitions state.

### I02. Cover key mapping and retain clickable pause behavior

- Related Files:
  - `test/game-core.test.js` :: pause toggle / frozen simulation test — modify
  - `test/audio-pause.test.js` :: pause overlay resume-button toggle — replace unreachable stale assertions about a non-existent DOM pause button; modify

#### Details
- Update the game-core pause test to use `Escape` and rename it accordingly. Assert Escape's default is prevented, the game reaches `PAUSED`, simulation elapsed time and distance remain unchanged while paused, and a second non-repeating Escape resumes without losing the zone.
- In the same test, dispatch `p` before Escape and assert the state stays running and P's default is not prevented.
- Dispatch an Escape repeat while paused and assert it stays paused; only the next non-repeat keydown resumes.
- `createPauseController` renders its resume button inside `.pause-overlay` with the label `▶ 계속하기`; the canvas HUD pause control is not a DOM `.pause-button`. Remove the unreachable tail that expects `.pause-button`, and activate the overlay resume button's registered `click` listener in the fake DOM test. Verify it resumes, hides the overlay, and produces the existing resume/music-start events.

## Acceptance Criteria
- [x] Escape pauses and resumes during gameplay.
- [x] Repeated Escape keydown does not toggle pause more than once while held.
- [x] P no longer invokes pause or gets intercepted by the game input handler.
- [x] The pause overlay, its `▶ 계속하기` resume button, music/audio events, and frozen simulation still pass their tests.

## Validation
- `npm.cmd test` — pause, game-core, and audio-pause tests pass.
- `git diff --check` — no whitespace errors.

## Commit Message
```text
feat(input): use Escape to pause the game

Plan: 2026-10-29-game-over-controls-jump
Phase: P01-results-controls-and-jump
Task: T02-switch-pause-shortcut-to-escape

- Replace P pause mapping with Escape
- Preserve pause toggle, audio, and overlay behavior
```

## Progress
- [x] 구현 완료
- [x] 검증 통과 (`npm.cmd test`: 109/109; `git diff --check`; P shortcut scan)
- commit: `46e31d5`
