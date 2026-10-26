# Decisions: README Play Guide

- Date: 2026-10-26
- Status: Confirmed

## D01. README language and scope
- **Chosen**: Translate the entire README into Korean while preserving its existing structure.
- **Rationale**: The user explicitly selected a full translation after clarification.

## D02. Gameplay details
- **Chosen**: Retain the existing README's setup, gameplay, backend, deployment, and acceptance guidance, translating explanatory prose and headings; preserve commands, environment variable names, URLs, file paths, product names, and code identifiers verbatim. Keep gameplay facts aligned with current implementation: W jumps up to twice, S slides while held, P or the on-screen button pauses, mouse toys and distance determine score, power-ups affect play, zones change at score thresholds, and health reaching zero ends the run. Correct the inaccurate fixed-three-hearts claim to explain that the heart count depends on the selected cat's health value.
- **Rationale**: Translating user-facing prose fulfills the requested scope while preserving runnable instructions and exact technical references. The health correction was explicitly accepted by the user after comparison with per-cat maximum-health configuration. Gameplay details were cross-checked against the current game code.
