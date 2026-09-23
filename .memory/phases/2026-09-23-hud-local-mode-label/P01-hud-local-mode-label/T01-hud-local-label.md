# Task: T01 HUD Local Mode Label

## Status: done

## Goal

Change the HUD mode text below accuracy and target count from connection-derived `SERVER`/`LOCAL` output to the confirmed current-release label `LOCAL`, and add a render regression assertion so the local-only UI cannot imply server synchronization.

## Decision Summary

- Source of truth: `.memory/decisions/2026-09-23-hud-local-mode-label.md`, D01–D02.
- The current release is local-only; do not add connection detection or change game synchronization state in this task.
- Preserve the HUD position, accuracy text, target count, health hearts, and all game state behavior.

## Implementation

### I01. Make the HUD label explicitly local

- Related Files:
  - `public/js/render/draw-hud.js` :: `drawHud` — modify the mode-label `fillText` call only.
  - `public/js/render/scene-renderer.js` :: `drawHudScene` — read-only; verify it continues delegating to `drawHud`.

#### Details

- Replace the expression `(state.connectionMode || state.runMode || "LOCAL").toUpperCase()` with the literal display value `"LOCAL"` for the current release.
- Keep the existing draw coordinates `(246, 112)`, font, color, HUD panel dimensions, and surrounding accuracy/target labels unchanged.
- Do not modify `state.connectionMode`, `state.runMode`, `run-sync`, network monitoring, server completion, or local leaderboard flow. Dynamic `SERVER` display is explicitly deferred until server play is re-enabled.

### I02. Add render regression coverage

- Related Files:
  - `test/render.test.js` :: HUD render tests near `HUD renders the complete health capacity...` — modify/add.

#### Details

- Render a state with `connectionMode: "server"` and `runMode: "server"`, collect `fillText` labels, and assert the HUD contains `LOCAL` and does not contain `SERVER`.
- Preserve existing health-heart, score, distance, effect, target, and non-mutating render assertions.

## Acceptance Criteria

- [x] The HUD mode text under accuracy/target metrics is always `LOCAL` in the current release.
- [x] A state carrying server-like mode fields cannot make the HUD display `SERVER`.
- [x] Existing HUD layout and rendering behavior remain unchanged.

## Validation

- `npm.cmd test -- test/render.test.js` — HUD and renderer regression tests pass.
- `git diff --check`

## Commit Message

```text
fix(ui): label hud as local mode

Plan: 2026-09-23-hud-local-mode-label
Phase: P01-hud-local-mode-label
Task: T01-hud-local-label

- Show LOCAL while the release is local-only
- Prevent misleading SERVER HUD output
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending

## Execution Record

- HUD mode text is now the explicit current-release label `LOCAL`; game synchronization state remains unchanged.
- Added a renderer regression test proving server-like state fields cannot produce `SERVER`.
- Validation: `npm.cmd test -- test/render.test.js` (17 passed); `git diff --check` passed.
