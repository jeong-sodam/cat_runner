# Task: T03 Animate Rhythm Feedback

## Status: done

## Goal
Render clear, non-mutating canvas animations for rhythm hits, misclicks, and target timeouts so players can immediately tell whether each click was judged.

## Decision Summary
- Draw `hit` as an expanding green ring with a check mark. Draw `miss` as a shrinking, fading red X. Use the 400 ms event lifetime created by T02 and the simulation's `elapsedMs` clock.

## Implementation

### I01. Draw timed success and failure feedback on the canvas

- Related Files:
  - `public/js/render/color-palette.js` :: `PALETTE.rhythm` — shared success/failure colors; modify
  - `public/js/render/scene-renderer.js` :: `drawRhythmTargets`, `createSceneRenderer().render` — draw active targets and transient feedback; modify
  - `test/render.test.js` :: rhythm target rendering test — assert hit and miss animation primitives, timing, and non-mutation; modify

#### Details
- **Signatures & Types**:
  ```javascript
  function drawRhythmTargets(ctx, rhythmState, nowMs = 0)
  function createSceneRenderer(ctx, assets = {})
  // renderer.render(state, world?) passes state.elapsedMs as nowMs
  ```
- **Data & Schema Fields**:
  - Consume T02 events with `type`, `x`, `y`, `createdAtMs`, and `expiresAtMs`; do not add or mutate renderer-owned state.
  - Add `PALETTE.rhythm.feedbackHit` and `PALETTE.rhythm.feedbackMiss` with green and red values.
- **Execution Flow / Logic**:
  1. Keep drawing active primary/secondary targets exactly as today.
  2. For each feedback event, compute `ageMs = nowMs - createdAtMs` and `durationMs = expiresAtMs - createdAtMs`. Skip events with invalid/non-positive duration, negative age, or `ageMs >= durationMs`; otherwise compute `progress = ageMs / durationMs` clamped to `[0, 1]`.
  3. For `hit`, draw a green stroked circle centered at `(x,y)` whose radius expands linearly from 14 to 60 logical pixels and whose alpha fades from 1 to 0. Draw a centered check mark with the same fading alpha.
  4. For `miss`, draw a centered red X with diagonal arm half-length shrinking linearly from 28 to 0 logical pixels and alpha fading from 1 to 0.
  5. Wrap each transient drawing operation in `ctx.save()`/`ctx.restore()` so fill, stroke, alpha, line width, and alignment do not leak to other scene elements.
  6. Pass `state.elapsedMs` into `drawRhythmTargets` from the renderer. Keep the exported helper's third argument optional for existing direct callers.
  7. Rendering is read-only: do not remove expired events or modify rhythm state in the renderer; T02 simulation cleanup owns event removal.
- **Error & Exception Handling**: Ignore malformed event entries and unknown feedback types without throwing. Do not draw completed/expired events even if a caller bypasses T02 cleanup.
- **State Transition & Return**: Visuals progress from event timestamps and disappear at expiry; animation rendering does not alter hit/miss counts, target state, or score.

### I02. Add deterministic canvas-renderer regression coverage

- Related Files:
  - `test/render.test.js` :: fake-canvas rhythm rendering assertions — modify

#### Details
- Cover a mid-animation hit, a mid-animation click miss, and a timeout miss at the provided logical coordinates.
- Assert the hit draws a green expanding arc and check-mark strokes; both miss sources draw a red X using shrinking dimensions and lower alpha at a later timestamp.
- Assert events before `createdAtMs`, at/after `expiresAtMs`, malformed events, and unknown `type` values draw no feedback and do not throw.
- Retain assertions that primary/secondary target labels remain `L`/`R`, inactive target circles are not drawn as active, and rendering does not mutate the state object.

## Acceptance Criteria
- [x] Hit feedback is green, expands, includes a check mark, and lasts 400 ms.
- [x] Misclick and timeout feedback are red X marks that shrink and fade for 400 ms.
- [x] Feedback uses game elapsed time, survives pause consistently with simulation time, and does not replay after snapshot restore.
- [x] Existing target rendering, labels, score state, and rhythm state are unchanged by drawing.

## Validation
- `npm.cmd test` — all render and rhythm tests pass.
- `git diff --check` — no whitespace errors.

## Commit Message
```text
feat(ui): animate rhythm hit and miss feedback

Plan: 2026-10-29-rhythm-feedback-and-local-copy
Phase: P01-feedback-and-copy
Task: T03-animate-rhythm-feedback

- Animate hits with a green expanding check ring
- Animate misclicks and timeouts with a fading red X
```

## Progress
- [x] 구현 완료
- [x] 검증 통과 (`npm.cmd test`: 113/113; `git diff --check`)
- commit: `26a12b1`
