# Plan: Game-over Actions, Escape Pause, and Lower Jump

## Goal
Remove the duplicate personal-record table screen while keeping the existing `내 기록` screen and browser-saved score history, move its rhythm-accuracy and multiplier displays into `내 기록`, expose only `캐릭터 선택` and `내 기록` actions after game over, replace the `P` pause shortcut with `Escape`, and lower the shared jump multiplier from 1.2 to 1.0 without breaking double-jump or basic-obstacle clearance.

## Confirmed Decisions
- The result screen keeps its score details but has exactly two actions: `캐릭터 선택` and `내 기록`.
- Remove the duplicate `개인기록표` page; preserve locally saved records and the `내 기록` leaderboard screen.
- Preserve the duplicate screen's rhythm accuracy and multiplier information by adding it to the `내 기록` table and latest-result summary.
- `Escape` toggles pause and resume. `P` no longer toggles pause.
- Set `GAME_CONFIG.jumpMultiplier` to `1.0` for both jumps and every cat.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `complete` | Remove the duplicate results UI, replace the pause shortcut, and lower the shared jump impulse with regression coverage. | [P01](../phases/2026-10-29-game-over-controls-jump/P01-results-controls-and-jump/phase.md) |
