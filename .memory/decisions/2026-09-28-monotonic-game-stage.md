# Decisions: Monotonic Game Stage

- Date: 2026-09-28
- Status: Confirmed

## D01. Stage progression behavior
- **Chosen**: Once a run reaches a higher stage, its stage never decreases during that run.
- **Rationale**: Accuracy multipliers can temporarily lower the calculated score, but the background and gameplay stage must not oscillate between stages.

## D02. Scope of monotonic progression
- **Chosen**: Apply the monotonic rule to the complete game zone state: background, difficulty, obstacle patterns, and rhythm targets.
- **Rationale**: These systems all consume `zoneId`; keeping only the background stable would make the visible stage and actual gameplay inconsistent.

## D03. Run lifecycle
- **Chosen**: Preserve the highest reached stage through pause/resume and resume-from-snapshot, but reset to the initial stage when a new run starts.
- **Rationale**: A run should resume consistently, while separate runs must start from the normal initial zone.

## D04. Existing threshold behavior
- **Chosen**: Keep the existing score thresholds and ascending zone order; only prevent regression after advancement.
- **Rationale**: The requested fix concerns stage oscillation, not the balance or threshold values.

## D05. Verification
- **Chosen**: Add regression coverage for score-based advancement followed by a lower recalculated score, plus reset/resume behavior.
- **Rationale**: The bug is caused by repeated score-to-zone calculation and needs an explicit non-regression guarantee.
