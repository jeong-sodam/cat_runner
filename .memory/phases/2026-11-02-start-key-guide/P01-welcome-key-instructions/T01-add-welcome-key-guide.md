# Task: T01 Add Welcome-Screen Key Guide

## Status: done

## Goal
Show all current keyboard controls on the welcome screen before the player starts, so first-time players know how to jump, slide, and pause.

## Decision Summary
- Place the guide on the existing welcome screen before the “게임 시작” button; retain the existing local personal-record leaderboard and do not add an online leaderboard.
- Show the basic controls: `W` jumps and allows one extra jump while airborne, holding `S` slides, and both `Escape` and `P` pause or resume. Add `P` as an alias in the input handler so every documented key works.

## Implementation

### I01. Render the keyboard guide on the welcome screen

- Related Files:
  - `public/js/ui/auth-screen.js` :: `renderWelcomeScreen` — add accessible key instructions before the existing start button; modify.
  - `public/js/game/input-controller.js` :: `onKeyDown` — treat `P` as a pause toggle alongside `Escape`; modify.

#### Details
- **Signatures & Types**:
  ```javascript
  function renderWelcomeScreen(root, options = {})
  ```
  Keep the existing signature and behavior. `root` is the screen root element. `options.documentRef` optionally supplies the document used to create elements, and `options.onLocalPlay` is the existing callback invoked by the start button. Return the welcome section, or `null` when the root/document cannot create elements.
- **Data & Schema Fields**:
  - No persistent model or storage fields are introduced.
  - Render four fixed key labels across three control rows, each containing semantic `<kbd>` labels and a text description:
    - `W` — `점프 (공중에서 한 번 더 점프 가능)`.
    - `S` — `누르고 있는 동안 슬라이드`.
    - `Esc` and `P` — `일시정지 / 재개`.
- **Execution Flow / Logic**:
  1. Keep the current welcome-screen content and start-button callback unchanged.
  2. After the existing introductory paragraph and before the start button, append a section with class `keyboard-guide` and accessible name `키보드 조작 안내`.
  3. Inside it, render an `h2` titled `조작 키` and a `ul` with exactly the three key rows above. Create nodes with `documentRef.createElement` and assign all user-facing copy through `textContent`.
  4. In `createInputController`'s `onKeyDown`, accept normalized `p` as a handled key and call the existing `onPause` callback once on non-repeated `p` keydown, matching the existing `Escape` repeat behavior. Preserve `W` and `S` handling and leave screen transitions and local-record behavior unchanged.

### I02. Style the guide and verify the welcome flow

- Related Files:
  - `public/styles.css` :: `.keyboard-guide` and its child selectors — style the guide to fit the existing flow card and remain legible on narrow screens; modify.
  - `test/app-flow.test.js` :: welcome-screen tests — verify the guide content and preserve the start flow; modify.
  - `test/game-core.test.js` :: keyboard input tests — verify `P` pauses and resumes without changing repeated-key behavior; modify.

#### Details
- **Signatures & Types**:
  ```javascript
  test("bootstrap renders the welcome screen without fetch", async () => { /* existing test */ })
  test("welcome start action enters character selection without network calls", async () => { /* existing test */ })
  ```
  Extend the existing welcome tests; do not change production function signatures or test harness APIs.
- **Data & Schema Fields**:
  - No data schema changes.
  - Use the existing `.flow-card` layout and typography. Keep the guide compact, allow text to wrap, and avoid fixed heights that can clip it on small screens.
- **Execution Flow / Logic**:
  1. Add styles for the guide heading, list, rows, and `kbd` labels in the existing stylesheet; scope these rules under `.keyboard-guide` so other screens are unaffected.
  2. Extend the welcome-screen test to assert that `W`, `S`, `Esc`, `P`, and their corresponding action descriptions appear before play, and that there is still exactly one start button.
  3. Keep the start-flow test asserting that clicking the existing start button enters character selection and makes no network calls.
  4. Add a game-core regression test proving `P` toggles pause/resume once per keydown and repeated `P` does not trigger another toggle.
  5. Do not change the existing leaderboard UI or local score storage.

## Acceptance Criteria
- [ ] The welcome screen shows the basic controls before the start button: `W`, `S`, `Esc`, and `P`.
- [ ] The guide describes `W` as jump with one extra airborne jump, held `S` as slide, and both `Esc` and `P` as pause/resume.
- [ ] Both `Escape` and `P` pause/resume the game; repeated keydown events do not toggle pause more than once.
- [ ] The guide uses accessible structure and stays readable without clipping at narrow viewport widths.
- [ ] The existing welcome start button still opens character selection, and the existing local personal-record leaderboard remains available.
- [ ] No global leaderboard, account flow, or network request is introduced.

## Validation
- `npm.cmd test` — the full Node test suite passes, including the updated welcome-screen and pause-key assertions (PowerShell-safe npm entry point on Windows).
- `git diff --check` — no whitespace errors are reported.

## Commit Message
```text
feat(ui): show keyboard controls before play

Plan: 2026-11-02-start-key-guide
Phase: P01-welcome-key-instructions
Task: T01-add-welcome-key-guide

- Add accessible keyboard instructions to the welcome screen
- Support P as a pause alias and cover controls with regression tests
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: feat(ui): show keyboard controls before play
