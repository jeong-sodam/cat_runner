# Decisions: HUD Local Mode Label

- Date: 2026-09-23
- Status: Confirmed

## D01. HUD connection label

- **Chosen**: Display `LOCAL` under the accuracy/target HUD instead of `SERVER` for the current release.
- **Rationale**: The current playable build does not have an active server connection, so the HUD must describe the actual available play mode rather than imply server synchronization.

## D02. Future server mode

- **Chosen**: Do not add dynamic `SERVER` detection in this change; revisit the label when authenticated server play is enabled again.
- **Rationale**: The immediate requirement is a clear local-only label, and adding a connection-state state machine would expand this small UI change beyond scope.
