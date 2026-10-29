# Decisions: Game Controls and Results Cleanup

- Date: 2026-10-29
- Status: Confirmed

## D01. Game-over actions and duplicate personal-record screen
- **Chosen**: Keep the game-over result details and show only `캐릭터 선택` and `내 기록` actions. Remove the duplicate `개인기록표` screen and its navigation.
- **Rationale**: The user confirmed both labels lead to the same personal score history and prefers the cleaner `내 기록` UI.

## D02. Preserve score history
- **Chosen**: Remove the duplicate screen UI only; keep score history in browser storage and keep the existing `내 기록` screen.
- **Rationale**: `내 기록` reads the same stored score history, so deleting the underlying data or store would break the retained screen.

## D05. Keep the rhythm metrics visible in My Records
- **Chosen**: Add rhythm accuracy and rhythm multiplier to the retained `내 기록` table and latest-result summary before deleting the duplicate screen.
- **Rationale**: The current duplicate screen shows these two metrics even though the existing `내 기록` UI does not; the user chose to retain them in `내 기록`.

## D03. Pause keyboard shortcut
- **Chosen**: Use `Escape` to toggle pause and resume; remove `P` as a pause shortcut.
- **Rationale**: The user chose Escape in place of P. The existing pause controller already handles both pause and resume through one toggle.

## D04. Jump height
- **Chosen**: Change the shared jump multiplier from `1.2` to `1.0` for both jumps.
- **Rationale**: The user chose the largest offered reduction, lowering the estimated apex from about 243 to 169 logical pixels (about 30%) while retaining the two-jump mechanic.

## Codebase findings
- `personal-records.js` renders a separate personal-record table and is reachable from the result screen. `leaderboard.js` already renders the same browser-local score history under the cleaner `내 기록` label. The old screen uniquely displays rhythm accuracy and its multiplier; the user chose to add both metrics to `내 기록` before removing the duplicate screen.
- `input-controller.js` currently toggles pause on non-repeating `P` keydown. The controller is mounted only during gameplay; the shared pause controller handles resuming too.
- `game-loop.js` applies `jumpVelocity * jumpMultiplier` to each of the two jump presses. The multiplier is shared across cats, and existing tests assert both the multiplier and basic-obstacle clearance.
- This decision interview adds no change to the browser-local score format or record-retention policy.

## Follow-up verification notes
- Revisit the basic-obstacle jump-clearance test after lowering the multiplier; keep gameplay/collision behavior unchanged unless the new jump height makes the current obstacle contract impossible.
- Verify `Escape` does not fire repeatedly when held and that the existing pause-button resume path still works.
