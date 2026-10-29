# Decisions: Stage Two and Three Rhythm Difficulty

- Date: 2026-10-29
- Status: Confirmed

## D01. Ease target size only in stages two and three
- **Chosen**: Increase the rhythm target size for stage two (`outside`) and stage three (`home_night`) by changing their rhythm `difficultyScale` to `1.25` and `1.5`, respectively. Keep their spawn intervals and target lifetimes unchanged at 800 ms and 600 ms.
- **Rationale**: The user asked to ease osu difficulty by enlarging targets while preserving the existing timing challenge and the size progression between stages.

## D02. Keep target size fixed for its lifetime
- **Chosen**: Apply the size configuration when a target spawns. Do not resize an already active target when the stage changes or when a saved run resumes; the new size takes effect on the next target.
- **Rationale**: Target radius is stored on the active target and in saved run snapshots. Keeping its size fixed avoids a target changing under the player's pointer while preserving the current snapshot format.

## D03. Keep overall obstacle difficulty out of scope
- **Chosen**: Adjust only rhythm target sizes. Keep the general runner and obstacle difficulty progression unchanged.
- **Rationale**: The user chose to limit this change to the osu/rhythm targets.

## Codebase Findings
- The three rhythm zones are `home_day` (stage one), `outside` (stage two, reached at score 800), and `home_night` (stage three, reached at score 3600).
- `targetRadius()` derives radius from the rhythm zone's `difficultyScale`: the current stage-two radius is about 35.4 logical pixels; stage three is clamped to 28.125 pixels by the configured minimum. The selected scales yield radii of 42.5 and about 35.4 pixels.
- Stage two and three currently use 800 ms and 600 ms for both spawn interval and target lifetime. These values stay unchanged.
- The general runner/obstacle difficulty also increases by zone in `patterns.js`; it is independent of rhythm target size and is not part of this decision.
- Primary and bonus targets use the same radius calculation. Primary/secondary mouse-button rules and mobile-input scope remain unchanged.
