# Decisions: Rhythm Feedback and Local-Play Copy

- Date: 2026-10-29
- Status: Confirmed

## D01. Remove local-play wording
- **Chosen**: Remove the welcome screen's local-play explanation, relabel its start button as `게임 시작`, and remove the result screen's local-mode badge. Keep actionable save-failure and session-only persistence warnings.
- **Rationale**: The user asked to remove local-play guidance but selected keeping warnings that explain whether a score was saved. They chose `게임 시작` for the button label so its action remains clear without labeling the play mode.

## D02. Feedback coverage for rhythm targets
- **Chosen**: Show positive feedback for a successful target hit, and negative feedback for every misclick and for target timeout.
- **Rationale**: Targets currently disappear without explaining whether a click was judged, while invalid clicks are silently ignored.

## D03. Feedback appearance and duration
- **Chosen**: A successful hit shows a green expanding ring with a check mark. A misclick or timeout shows a red X that shrinks and fades. Keep each animation visible for about 400 ms.
- **Rationale**: Color, shape, and motion distinguish success from failure at a glance without requiring a text label.

## D04. Misclick scoring and target lifecycle
- **Chosen**: Each misclick adds one miss to rhythm accuracy, but leaves the active target available for a later correct hit. A later timeout adds its own miss.
- **Rationale**: The user explicitly requested that misclicks reduce accuracy while still allowing continued play on the target.

## D05. Mobile input scope
- **Chosen**: Mobile-specific input support is out of scope for this plan.
- **Rationale**: The user said not to account for mobile. The existing secondary rhythm target still requires the right mouse button on desktop.

## Codebase findings
- The welcome screen's `로컬로 플레이` button starts character selection. A separate small paragraph explains local browser storage. The result screen uses a `local-mode-badge` for save status while a separate status paragraph already explains save failure or session-only persistence.
- Rhythm targets are rendered on the game canvas. Only active targets are drawn; a correct hit changes status to `hit`, timeout changes it to `miss`, and invalid clicks currently have no visible response.
- Rhythm accuracy currently uses hit and miss counts. Timeout increments misses, while invalid clicks are not counted.
- Primary and secondary targets require matching left and right mouse inputs respectively. Invalid pointer clicks can be given feedback without changing the target's active state.
