# Decisions: Mouse Overlap Cleanup and DEX Rate

- Date: 2026-09-26
- Status: Confirmed

## D01. General route overlap policy
- **Chosen**: Clean up overlap only in ordinary mouse routes; keep adjacency inside heart, star, clover, thumbs-up, and alphabet formations.
- **Rationale**: Formation cells are intentional 5x5 visual patterns, while ordinary route overlap is accidental clutter.

## D02. Overlap winner
- **Chosen**: Continuous-route mice take priority over legacy guided-route mice.
- **Rationale**: The continuous route is the primary Cookie Run-style visual guide. When its actual mouse rectangle overlaps a legacy guide mouse, remove the legacy guide mouse.

## D03. Overlap boundary
- **Chosen**: Deduplicate only when the actual mouse rectangles overlap (AABB overlap).
- **Rationale**: This removes visible collisions without deleting mice that are merely close or at different jump heights.

## D04. DEX probability
- **Chosen**: Raise the DEX branch from 5% to 15% when an alphabet formation is selected.
- **Rationale**: DEX becomes discoverable while remaining a special formation rather than the default.

## D05. DEX cooldown
- **Chosen**: After a DEX formation, block another DEX for the next 2 patterns.
- **Rationale**: Prevents back-to-back DEX sequences while preserving the increased 15% chance over longer runs.

## D06. Existing DEX behavior
- **Chosen**: Preserve the existing D/E/X three-letter sequence, obstacle suppression, zone availability, and client/server deterministic parity.
- **Rationale**: Only the frequency and cooldown change; gameplay and validation contracts remain stable.
