# Task: T02 Fullscreen Regression Tests

## Status: done

## Goal

Add automated regression coverage for the fullscreen layout contract introduced by T01, then run the full Node test suite to ensure the existing app flow, font/layout, canvas viewport, and gameplay behavior remain intact.

## Decision Summary

- The shell must use the viewport directly on every screen and the document must not scroll.
- Scoped scrolling is allowed for content panels; it must not be replaced by page scrolling.
- The canvas viewport must continue to preserve its logical 1600×900 dimensions and contain-style coordinate mapping.

## Implementation

### I01. Add static fullscreen CSS contract tests

- Related Files:
  - `test/fullscreen-layout.test.js` :: new Node test module
  - `public/styles.css` :: read-only fixture under test
  - `public/index.html` :: read-only fixture under test

#### Details

- Read `public/styles.css` and `public/index.html` using the same `node:fs`/`node:path` style used by `test/font-layout.test.js`.
- Add a test that asserts the stylesheet contains viewport sizing for `#game-shell` (`100vw`, `100vh`, and a `100dvh` support/fallback contract), no body padding in the base fullscreen rule, and document overflow suppression.
- Add a test that asserts the shell still declares the existing border/radius treatment, `overflow: hidden`, and the light-blue `#game-canvas` background.
- Add a test that asserts the character panel retains `overflow-y: auto` while `body`/the shell remain non-scrolling at the document level. The test should target selectors/rules rather than exact whitespace so formatting changes do not cause false failures.
- Add a test that asserts `index.html` still contains the viewport meta tag and the `game-shell`, `screen-root`, and `game-canvas` elements.
- Do not assert browser Fullscreen API usage; the absence of such an API is covered by implementation review and the CSS-only contract.

### I02. Validate canvas and application resize contracts

- Related Files:
  - `test/render.test.js` :: existing viewport tests; extend only if needed
  - `public/js/render/canvas-viewport.js` :: read-only unless a failing regression requires a minimal fix
  - `public/js/app/app-controller.js` :: read-only unless a failing regression requires a minimal fix

#### Details

- Preserve the existing test that checks the canvas intrinsic size is 1600×900, the display is contain-letterboxed in a non-16:9 rectangle, and logical center coordinates map correctly.
- If the implementation changes the resize path, add a focused test proving a second `viewport.resize()` reads the new bounding rectangle and updates scale/offset metrics; avoid adding a browser or DOM dependency.
- Run the app-flow tests to verify screen transitions still set `game-shell.dataset.screen` and that no UI flow relies on the old 48px/16px shell inset.

## Acceptance Criteria

- [ ] `test/fullscreen-layout.test.js` covers viewport shell sizing, no document scroll, preserved frame/background, scoped panel scrolling, and required HTML anchors.
- [ ] Existing `test/render.test.js` viewport assertions remain green, including logical dimensions and coordinate mapping.
- [ ] `npm test` passes with no unrelated test regressions.
- [ ] No implementation code outside the planned layout/test files is changed without a documented failing-test reason.

## Validation

- `node --test test/fullscreen-layout.test.js test/font-layout.test.js test/render.test.js test/app-flow.test.js`
- `npm test`

## Commit Message

```text
test(layout): cover fullscreen shell contract

Plan: 2026-09-27-fullscreen-container
Phase: P01-viewport-shell
Task: T02-fullscreen-regression-tests

- Add viewport and scroll-containment CSS regression checks
- Preserve canvas resize and app-flow coverage
```

## Progress

- [x] Implementation complete
- [x] Fullscreen-related validation passed; the full suite retains three pre-existing SQLite native cleanup failures
- commit: recorded in git history

## Validation Results

- `node --test test/fullscreen-layout.test.js test/font-layout.test.js test/render.test.js test/app-flow.test.js`: pass, 46/46.
- `npm test`: 139 total, 136 passed; three database-backed test files still terminate with the existing Node 24/Windows `better-sqlite3` `RemoveEnvironmentCleanupHook` native assertion. No fullscreen test fails.
