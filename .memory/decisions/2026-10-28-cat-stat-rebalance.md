# Decisions: Cat Stat Rebalance

- Date: 2026-10-28
- Status: Confirmed

## D01. Cat-specific stat axes
- **Chosen**: Cat differences consist only of speed, health, and item duration. Remove jump power and magnet range as cat-specific stats and from the character-selection stat display.
- **Rationale**: Jump power differences make low-rated cats unable to reliably clear jump obstacles, while magnet range is not wanted as a character trait. Three remaining traits make the meaningful tradeoffs clearer.

## D02. Jump behavior after removing jump power
- **Chosen**: Use the same `jumpMultiplier` of `1.2` for every cat. Keep the jump control and existing maximum of two jumps.
- **Rationale**: Equalizing the jump multiplier removes cat-specific jump differences while giving every cat the current strongest jump setting to clear obstacles more reliably.

## D03. Magnet behavior after removing magnet range
- **Chosen**: Remove cat-specific magnet-range ratings and multipliers, but keep the magnet item effect with a shared range of 260 pixels.
- **Rationale**: Magnet range is no longer a cat-selection trait; the existing item remains part of gameplay. The current implementation defines a 260-pixel base range before applying the cat-specific multiplier.

## D04. Character-selection stat presentation
- **Chosen**: Keep the existing 1–5 filled-bar presentation and show only those ratings, without exposing exact speed multipliers or durations.
- **Rationale**: Preserve the current character-card visual language while removing the two unwanted stat rows.

## D05. Rating-to-gameplay mapping
- **Chosen**: Rating 3 remains the neutral baseline. Map the five ratings piecewise evenly from rating 1 to rating 3 and from rating 3 to rating 5.
  - Speed ratings 1–5 map to `0.75x`, `0.875x`, `1.0x`, `1.15x`, and `1.3x`.
  - Item-duration ratings 1–5 map to `3`, `4`, `5`, `6.5`, and `8` seconds.
  - Health ratings continue to mean 1–5 hearts.
- **Rationale**: This preserves the existing meaning of rating 3 as normal speed and a five-second beneficial item effect while expanding the lowest-to-highest gameplay differences to the user-selected ranges.

## D06. Item effect duration scope
- **Chosen**: Apply the cat's item-duration value to beneficial grass effects only: magnet, invincibility, and double score. Keep the slow-miss penalty fixed at five seconds for every cat.
- **Rationale**: Preserve the existing rule that a cat's item-duration trait improves beneficial effects without extending the negative effect.

## D07. Equal rating budget and cat profiles
- **Chosen**: Keep every cat's total visible rating points equal to 9. Preserve the current relative stat tendencies where possible, with cheese's final profile set to 3/3/3 as requested.
  - Ratings below are ordered speed / health / item duration.

| Cat | Speed | Health | Item duration | Total |
| --- | ---: | ---: | ---: | ---: |
| Black | 5 | 3 | 1 | 9 |
| White | 2 | 3 | 4 | 9 |
| Calico | 1 | 5 | 3 | 9 |
| Cheese | 3 | 3 | 3 | 9 |
| Mackerel | 4 | 3 | 2 | 9 |
| Chaos | 5 | 1 | 3 | 9 |

- **Rationale**: Equal totals retain the existing fairness rule while concentrating each profile's standout/weak ratings on three meaningful traits. Cheese's equal ratings make it the all-rounder.

## D08. Source-of-truth and compatibility requirements
- **Chosen**: Keep client gameplay values, server-side run-validation values, and selection-card ratings synchronized. Update tests, the player README, and maintainer documentation that assert or describe the old five-stat model.
- **Rationale**: The client uses cat values for movement and effects, while the server independently reconstructs cat effects during run validation. If they disagree, a locally valid run may fail server validation. Existing tests assert the five-stat shape and near-equal totals and must reflect the new three-stat design.

## D09. Jump-related acceptance behavior
- **Chosen**: All cats have identical jump physics at multiplier `1.2`; preserve the existing single- and double-jump controls.
- **Rationale**: This addresses the reported jump limitation without tying obstacle clearance to a cat stat. Existing code already contains a regression test for a one-jump clearance at the old lowest multiplier (`0.8`), which remains useful as a boundary check.
