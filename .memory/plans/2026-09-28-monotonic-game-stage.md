# Plan: Monotonic Game Stage

## Goal

Prevent the Cat Runner stage/background from oscillating backward when an accuracy multiplier temporarily lowers the recalculated score. During one run, the highest reached zone must remain active for the background, difficulty, obstacle patterns, and rhythm targets; a newly started run must still begin at `home_day`.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `complete` | Make zone progression monotonic and lock the behavior with regression tests | [P01](../phases/2026-09-28-monotonic-game-stage/P01-monotonic-game-stage/phase.md) |

## Decision Source

- [Confirmed decisions](../decisions/2026-09-28-monotonic-game-stage.md)

## Global Constraints

- Preserve the existing zone thresholds: `home_day` at score `0`, `outside` at `800`, and `home_night` at `3600`.
- Preserve the existing score formula, including accuracy/rhythm multipliers, mouse bonuses, distance points, and double-score behavior.
- The zone may advance when the recalculated score reaches a higher threshold, but it must never regress below the current `state.zoneId` during the same run.
- Keep the existing `zoneId` field as the single source of truth consumed by background rendering, difficulty, pattern generation, and rhythm target configuration.
- A new state created by `createGameState` or `resetRunState` starts at `home_day`; an existing snapshot's `zoneId` remains intact when the run is resumed.
- Do not change server score validation, leaderboard persistence, pattern version, asset manifests, or deployment behavior.

## Execution Order

1. T01: implement monotonic zone selection in the client score update path.
2. T02: add threshold, regression, reset, and snapshot/resume coverage and run focused/full validation.
