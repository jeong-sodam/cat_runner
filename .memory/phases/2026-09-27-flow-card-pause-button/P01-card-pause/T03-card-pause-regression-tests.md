# Task: T03 Card and Pause Regression Tests

## Status: done

## Goal

Lock the new flow-card sizing and canvas pause-control contracts with focused automated tests, preserve existing rendering/app-flow coverage, and run the complete Node test suite before closing the phase.

## Decision Summary

- Tests must distinguish ordinary .flow-card changes from unchanged .wide-card panels.
- Tests must prove the canvas pause rectangle geometry and hitbox boundary behavior without requiring a browser DOM.
- Existing pause overlay tests must assert the duplicate DOM button is absent while toggle behavior remains available.

## Implementation

### I01. Add layout contract assertions

- Related Files:
  - test/fullscreen-layout.test.js :: flow-card sizing tests; modify
  - public/styles.css :: read-only fixture

#### Details

- Add assertions for the ordinary .flow-card rule: width min(516px, calc(100% - 8px)) or equivalent 516px responsive cap, separate block padding with a 48px maximum, unchanged inline padding cap, and max-width: 100%.
- Assert that .wide-card still uses its existing 1050px width cap and is not accidentally rewritten by the flow-card rule.
- Assert the mobile flow-card rule does not introduce a width greater than 100% or restore document scrolling.
- Keep all existing fullscreen shell, canvas, and scoped-scroll assertions green.

### I02. Test pause hitbox and DOM removal

- Related Files:
  - test/pause-hitbox.test.js :: new Node test module
  - test/audio-pause.test.js :: existing pause-controller test; modify
  - test/render.test.js :: existing renderer pause rectangle test; extend only if needed

#### Details

- In test/pause-hitbox.test.js, import isPointInsideRect and assert true for center and all four inclusive edges of { x: 1480, y: 24, width: 86, height: 52 }, false for points just outside each edge, false for missing rectangles, and false for non-finite coordinates.
- Update the pause-controller test to assert mounting creates the overlay but no child with class pause-button game-button; call controller.togglePause() to verify pause/resume, audio events, and aria-hidden behavior remain unchanged.
- Keep or extend the renderer test to assert renderer.render(state).pauseButton still exactly exposes x, y, width, and height with the established values.
- Do not add browser automation or change the existing fake DOM contract beyond the assertions required by this feature.

### I03. Run focused and complete validation

- Related Files:
  - test/app-flow.test.js :: read-only unless the new pause lifecycle needs a focused assertion
  - test/game-core.test.js :: read-only

#### Details

- Run the focused layout/pause/render/app-flow command first and resolve any regressions.
- Run npm test afterward. If the known Node 24/Windows better-sqlite3 RemoveEnvironmentCleanupHook native cleanup failures recur after their assertions pass, record them as environment failures and ensure all feature-related tests pass.

## Acceptance Criteria

- [ ] Flow-card width/padding and wide-card preservation are covered by automated tests.
- [ ] Pause hitbox edge behavior, canvas geometry, and DOM button removal are covered by automated tests.
- [ ] Focused tests pass with zero failures.
- [ ] Full suite results are recorded, with no fullscreen/card/pause regression.

## Validation

- node --test test/fullscreen-layout.test.js test/pause-hitbox.test.js test/audio-pause.test.js test/render.test.js test/app-flow.test.js
- npm test

## Commit Message

~~~text
test(ui): lock flow card and canvas pause behavior

Plan: 2026-09-27-flow-card-pause-button
Phase: P01-card-pause
Task: T03-card-pause-regression-tests

- Cover responsive flow-card sizing and wide-card preservation
- Cover canvas pause hitbox boundaries and DOM control removal
~~~

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: included in this commit

## Validation Results

- Focused command passed: 49 tests, 49 passed, 0 failed.
- `npm test` completed with 139 tests, 136 passed, and 3 existing Windows/Node 24 `better-sqlite3` native cleanup-hook failures in `test/run-resume.test.js`, `test/security-regression.test.js`, and `test/server.test.js`; all feature-related tests passed.
