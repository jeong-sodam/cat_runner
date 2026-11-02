# Decisions: Ease osu Click Window

- Date: 2026-11-02
- Status: Confirmed

## D01. Increase the click window by stage
- **Chosen**: Add 500 ms to the active lifetime in every rhythm zone: `home_day` from 1,000 to 1,500 ms, `outside` from 800 to 1,300 ms, and `home_night` from 600 to 1,100 ms.
- **Rationale**: The user selected a moderate, consistent increase that gives players more time while preserving the shorter time window in later stages.

## D02. Apply the same lifetime to every target type
- **Chosen**: Use each zone's new lifetime for both primary and bonus targets.
- **Rationale**: The existing `spawnTarget` function assigns `config.targetLifetimeMs` uniformly, regardless of whether the target requires the primary or secondary mouse button.

## D03. Preserve rhythm pacing and target rules
- **Chosen**: Keep spawn intervals (`1,000 / 800 / 600 ms` by zone), one active target, target size, and existing hit/misclick scoring rules unchanged.
- **Rationale**: The feedback asks for more time to click, so adjust the timeout only. With one active target, a target remains available for the full new window and no overlapping targets are introduced.
