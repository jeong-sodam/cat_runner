/# Task: T01 Viewport Shell CSS

## Status: done

## Goal

Update the global layout so `#game-shell` occupies the browser viewport on login, character selection, gameplay, result, leaderboard, and personal-record screens, without invoking the browser Fullscreen API or introducing document scrolling. Keep the existing 8px desktop frame, responsive mobile frame, rounded corners, light-blue canvas background, and 16:9 logical canvas rendering.

## Decision Summary

- The in-page shell, not the browser chrome, is fullscreen; all screens use the same viewport-sized shell.
- The document must not scroll. Long content remains scrollable only inside its existing content panels, especially character selection.
- The canvas keeps its 1600×900 logical coordinate system and uses contain-style letterboxing rather than stretching or cropping.

## Implementation

### I01. Convert the document and shell to viewport sizing

- Related Files:
  - `public/styles.css` :: `html`, `body`, `#game-shell`, `#game-canvas`; modify

#### Details

- Set the root document and body to occupy the viewport without relying on the previous 24px/8px outer padding. Use a `100vh` fallback and a `100dvh` override where supported so browser viewport changes are reflected immediately.
- Remove the current centered, max-width shell behavior (`width: min(100%, 1280px)`, `aspect-ratio: 16 / 9`) as the outer-shell sizing rule. Define the shell as a border-box viewport-sized element (`width: 100vw`, `height: 100vh`, with `height: 100dvh` in the supported override), keeping `position: relative`, `overflow: hidden`, the existing border, radius, background, and shadow.
- Remove or supersede the `#game-shell[data-screen]:not([data-screen="game"])` height cap rules so non-game screens use the same viewport shell as the game screen. Do not remove the `data-screen` attribute; application screen state still uses it.
- Set document-level overflow to hidden so no body scrollbar or page-level scroll is introduced. Keep shell overflow hidden.
- Preserve the existing mobile border-width/radius adjustments if they do not reintroduce body padding or a viewport gap; mobile rules must still use the full viewport rather than `calc(... - 16px)` sizing.
- Keep `#game-canvas` at `width: 100%` and `height: 100%` with the existing `#d8f3ff` background and contain behavior. Do not change `GAME_CONFIG.canvasWidth` or `GAME_CONFIG.canvasHeight` in this task.

### I02. Preserve scoped content scrolling and responsive UI layout

- Related Files:
  - `public/styles.css` :: `#screen-root`, `.flow-card`, `.wide-card`, `.character-screen`, `#game-shell[data-screen]:not([data-screen="game"]) ...`; modify

#### Details

- Keep `#screen-root` constrained to the shell (`inset: 0`, `max-height: 100%`, `overflow: hidden`) and retain its padding as an internal safe area rather than allowing it to grow the document.
- Keep character selection scrolling inside `.character-screen` with `overflow-y: auto` and `overflow-x: hidden`; its parent card/root must remain bounded by the shell so the scrollbar belongs to the panel.
- Ensure wide result/leaderboard/personal-record panels can access content that exceeds the available viewport through their own panel overflow, while not enabling `body` scrolling. Preserve existing pointer-event and card interaction behavior.
- Retain viewport-relative `clamp()` sizing and existing max-width limits for headings/cards so DOM UI scales with available viewport space without clipping. Do not use a global transform that would change pointer coordinates or make internal scroll behavior inaccurate.
- Keep the existing responsive breakpoint rules for grid/card layout, but remove any breakpoint-specific body padding or non-game shell height calculations that create a visible outer margin in fullscreen mode.

### I03. Keep resize and input coordinate behavior compatible

- Related Files:
  - `public/js/render/canvas-viewport.js` :: `createCanvasViewport`, `resize`, `toLogicalPoint`; read-only unless validation reveals a required compatibility fix
  - `public/js/app/app-controller.js` :: `initializeGame` resize listener; read-only unless validation reveals a required compatibility fix

#### Details

- Verify that the existing `canvas.getBoundingClientRect()`-based viewport calculation continues to compute `scale`, `displayWidth`, `displayHeight`, `offsetX`, and `offsetY` correctly when the canvas is viewport-sized.
- Verify that the existing `window.resize` listener calls `viewport.resize()` during gameplay and that `toLogicalPoint()` continues mapping pointer coordinates through the letterboxed canvas.
- Do not add Fullscreen API calls, change game logical dimensions, or alter gameplay collision/input coordinates as part of this task.

## Acceptance Criteria

- [ ] On every `data-screen` state, `#game-shell` fills the browser viewport with the existing border/radius visual treatment and no large outer margin.
- [ ] The document has no page-level scrollbar; character selection and other long panels retain only their scoped internal scrolling.
- [ ] The canvas remains visually undistorted at non-16:9 viewport sizes, with unused space rendered using the existing light-blue background.
- [ ] Resizing the browser updates the shell/UI dimensions and gameplay canvas mapping without a reload or Fullscreen API request.
- [ ] Existing mobile breakpoints do not restore body padding or force the shell to a reduced-height inset layout.

## Validation

- `npm test` — must pass all existing tests after the CSS changes.
- Manual browser check at a desktop viewport similar to the supplied screenshot and at a narrow viewport: visit login, character selection, gameplay, result, and personal-record screens; confirm no document scrollbar and confirm character-list scrolling remains internal.

## Commit Message

```text
feat(layout): make game shell fill the viewport

Plan: 2026-09-27-fullscreen-container
Phase: P01-viewport-shell
Task: T01-viewport-shell-css

- Resize the document and game shell to the browser viewport
- Preserve 16:9 canvas letterboxing and scoped panel scrolling
```

## Progress

- [x] Implementation complete
- [x] Related layout, rendering, and app-flow validation passed
- commit: recorded in git history

## Validation Results

- `node --test test/font-layout.test.js test/render.test.js test/app-flow.test.js`: pass, 42/42.
- `npm test`: the layout-related tests pass, but the full run still reports existing Node 24/Windows `better-sqlite3` `RemoveEnvironmentCleanupHook` native cleanup failures in database-backed test files; no fullscreen assertion fails.
