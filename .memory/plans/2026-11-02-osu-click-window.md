# Plan: Ease osu Click Window

## Goal
Give players more time to click osu/rhythm targets before they become misses by extending the active lifetime by 500 ms in each game zone, while preserving the existing target spawn intervals, sizes, and single-active-target behavior.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Increase each zone's rhythm target lifetime and update boundary tests | [P01](../phases/2026-11-02-osu-click-window/P01-adjust-click-windows/phase.md) |

## Adjacent Finding (Not Included)
- The top-level `RHYTHM_CONFIG.targetLifetimeMs` remains `1000` and is currently only asserted by a test; spawning reads the zone-specific value instead. This plan preserves the top-level value and changes only the three zone values. Confirm whether to include a separate cleanup of that unused duplicate configuration field.
