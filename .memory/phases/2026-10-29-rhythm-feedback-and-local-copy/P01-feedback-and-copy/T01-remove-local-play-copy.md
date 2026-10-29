# Task: T01 Remove Local-Play Copy

## Status: done

## Goal
Remove local-play explanatory copy and mode branding from the welcome and result screens while keeping the welcome action and all useful score-persistence status messages.

## Decision Summary
- The welcome button remains and reads `게임 시작`; remove its small local-storage explanation. Remove the result mode badge, but keep success, save-failure, and session-only status messages.

## Implementation

### I01. Simplify welcome-screen copy without changing navigation

- Related Files:
  - `public/js/ui/auth-screen.js` :: `renderWelcomeScreen` — builds welcome-screen text and its start action; modify
  - `test/app-flow.test.js` :: welcome-screen bootstrap and start-action tests — cover visible copy and navigation; modify

#### Details
- **Signatures & Types**:
  ```javascript
  function renderWelcomeScreen(root, options = {})
  // options.documentRef?: Document
  // options.onLocalPlay?: () => void
  // returns HTMLElement | null
  ```
- **Data & Schema Fields**:
  - No stored data, route names, or callback API changes.
- **Execution Flow / Logic**:
  1. Keep the existing heading, introductory game description, button class, and click callback to `options.onLocalPlay?.()`.
  2. Change only the visible button label from `로컬로 플레이` to `게임 시작`.
  3. Remove the `<small>` explanatory paragraph about login-free browser record storage.
  4. Keep the click action entering character selection with `allowResume: true`; do not add a login or network request.
  5. Update welcome-screen tests to assert the new label, absence of local-play/storage guidance, and unchanged transition to character selection without fetch calls.
- **Error & Exception Handling**: Preserve the existing null return for missing root/document APIs and optional callback behavior.
- **State Transition & Return**: The welcome button still calls `onLocalPlay`; only visible wording changes.

### I02. Remove result mode badge and its unused style

- Related Files:
  - `public/js/ui/result-screen.js` :: `createResultScreen().mount` — renders result status and actions; modify
  - `public/styles.css` :: `.local-mode-badge` — styles the removed badge; modify
  - `test/app-flow.test.js` :: result save-warning tests — ensure warnings remain without a badge; modify

#### Details
- **Signatures & Types**:
  ```javascript
  function createResultScreen(result = {}, callbacks = {}, options = {})
  // result.saved?: boolean
  // result.storageWarning?: boolean
  // mount(root): HTMLElement | null
  ```
- **Data & Schema Fields**:
  - Keep `saved`, `storageWarning`, `errorMessage`, `isPersonalBest`, and `rank` behavior unchanged.
- **Execution Flow / Logic**:
  1. Remove creation, text assignment, and append of the `local-mode-badge` element, including all `로컬 플레이` badge variants.
  2. Remove the now-unused `.local-mode-badge` CSS rule.
  3. Preserve the existing `.result-status` content and classes for saved, unsaved, and session-only cases; these explain score persistence and must remain visible.
  4. Preserve score/accuracy/multiplier stats, rank visibility, and the two existing actions (`캐릭터 선택`, `내 기록`).
  5. Update tests to assert there is no `.local-mode-badge` and no local-play wording, while saved-failure and session-only warning assertions still pass.
- **Error & Exception Handling**: Do not suppress or replace the existing storage error/session warning messages.
- **State Transition & Return**: Result navigation and save-state handling stay unchanged; only the redundant mode badge is removed.

## Acceptance Criteria
- [x] The welcome screen has a `게임 시작` button, no local-play storage explanation, and still opens character selection.
- [x] No result-screen local-mode badge or local-play wording remains.
- [x] Save-failure and session-only warnings, result metrics, and result actions remain visible and functional.

## Validation
- `npm.cmd test` — all app-flow and result-screen tests pass.
- `git diff --check` — no whitespace errors.

## Commit Message
```text
refactor(ui): remove local-play guidance copy

Plan: 2026-10-29-rhythm-feedback-and-local-copy
Phase: P01-feedback-and-copy
Task: T01-remove-local-play-copy

- Relabel the welcome action and remove local-play explanations
- Preserve result persistence warnings without the mode badge
```

## Progress
- [x] 구현 완료
- [x] 검증 통과 (`npm.cmd test`: 109/109; `git diff --check`; local-play copy scan)
- commit: pending
