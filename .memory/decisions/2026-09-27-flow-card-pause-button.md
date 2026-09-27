# Decisions: Flow Card Sizing and Canvas Pause Button

- Date: 2026-09-27
- Status: Confirmed

## D01. Card Scope
- **Chosen**: Resize ordinary `.flow-card` panels used by login, nickname, result, and similar information screens; leave character selection, leaderboard, and personal-record `.wide-card` panels unchanged.
- **Rationale**: Give the primary information cards more breathing room without disturbing data-heavy panels that already manage their own layout and scrolling.

## D02. Card Width
- **Chosen**: Increase the ordinary flow-card width by approximately 20%, while retaining `max-width: 100%` so narrow viewports never overflow horizontally.
- **Rationale**: Improve desktop readability and visual balance while keeping mobile cards inside the viewport.

## D03. Card Vertical Spacing
- **Chosen**: Increase only the top and bottom padding of ordinary flow cards by approximately 50%; keep font sizes and internal content spacing unchanged.
- **Rationale**: Create the requested vertical breathing room without scaling text or changing the information hierarchy.

## D04. Pause Control Rendering
- **Chosen**: Remove the separate DOM pause button and use the existing canvas-rendered pause icon at its current logical position and size in the upper-right HUD.
- **Rationale**: Eliminate the duplicate outer pill button and keep the control visually inside the game scene.

## D05. Pause Hit Detection
- **Chosen**: Reserve the existing canvas pause-button rectangle as a dedicated pointer hit area that toggles pause and is evaluated separately from osu/rhythm targets.
- **Rationale**: Preserve reliable mouse control without allowing a pause click to score a rhythm target.

## D06. Existing Controls and Layout
- **Chosen**: Keep keyboard `P` pause behavior and the current pause overlay/resume flow; preserve the existing canvas pause icon position and size.
- **Rationale**: Limit the change to the duplicate-button removal and in-game pointer interaction.
