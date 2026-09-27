# Decisions: Mouse Cleanup and Stage Score Thresholds

- Date: 2026-09-26
- Status: Confirmed

## D01. Scope of mouse cleanup
- **Chosen**: Reorganize ordinary route mice only. Preserve heart, star, clover, thumbs-up, alphabet, and DEX formation shapes and cell counts.
- **Rationale**: The special formations are intentional patterns and should not be flattened by ordinary route cleanup.

## D02. Ordinary mouse layout
- **Chosen**: Place ordinary mice on one horizontal row at `y=610`, with seeded spacing between `48px` and `58px`.
- **Rationale**: This removes the current visual overlap while keeping a continuous, readable route.

## D03. Obstacle and fall-gap handling
- **Chosen**: Remove only ordinary mouse positions that overlap an obstacle, resume at the next safe point using the normal spacing, and continue the row across fall gaps at `y=610`.
- **Rationale**: The route remains a collectible jump guide without placing collectibles inside unfair obstacle collisions.

## D04. Pattern boundary continuity
- **Chosen**: Carry the previous ordinary route endpoint into the next pattern so the mouse route remains visually continuous across pattern boundaries.
- **Rationale**: A continuous runner route should not visibly reset at each generated pattern.

## D05. Ordinary mouse density
- **Chosen**: Keep the existing ordinary mouse generation amount unchanged.
- **Rationale**: This task changes placement quality, not reward density or difficulty through collectible quantity.

## D06. Stage transition thresholds
- **Chosen**: Move the stage thresholds to `800` score for the outside stage and `3600` score for the night-home stage.
- **Rationale**: The player should stay longer in each stage before background and difficulty escalation.

## D07. Stage transition behavior
- **Chosen**: Apply the new thresholds to actual background, obstacle difficulty, and osu/rhythm speed transitions in both client and server manifests.
- **Rationale**: The displayed stage and the authoritative gameplay rules must not diverge.

## D08. Score award values
- **Chosen**: Keep mouse, distance, and osu/rhythm score calculations unchanged; only the thresholds move.
- **Rationale**: The requested redistribution is a progression-gate adjustment rather than a change to per-action scoring.

## D09. Determinism and parity
- **Chosen**: Use the existing seeded random stream for `48~58px` spacing and update client/server route generation together.
- **Rationale**: Replays, validation, and server-authoritative runs must produce the same mouse layout and stage behavior.
