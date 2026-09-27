# Decisions: Fullscreen Container

- Date: 2026-09-27
- Status: Confirmed

## D01. Fullscreen Scope
- **Chosen**: Apply the viewport-filling container to every screen: login, character selection, gameplay, and result screens.
- **Rationale**: Keep the entire application visually consistent instead of changing layout only during gameplay.

## D02. Fullscreen Mechanism
- **Chosen**: Use CSS viewport sizing; do not use the browser Fullscreen API.
- **Rationale**: The request is to expand the in-page game container, while keeping normal browser navigation and controls available.

## D03. Container Frame
- **Chosen**: Keep the existing border and rounded corners, sized within the viewport.
- **Rationale**: Preserve the established visual identity while removing the large outer margins.

## D04. Page Scrolling
- **Chosen**: Disable document-level scrolling; retain scrolling only inside screens that need it, such as the character list.
- **Rationale**: Fullscreen play should remain stable while long content remains accessible through its own scroll area.

## D05. Aspect Ratio and Letterboxing
- **Chosen**: Preserve the 16:9 game ratio and use the existing light-blue container background for unused space.
- **Rationale**: Prevent image/UI distortion and keep the selected background consistent across screens.

## D06. Responsive UI Scaling
- **Chosen**: Scale the complete game UI proportionally to the available viewport while preserving the 16:9 layout.
- **Rationale**: Make the enlarged container usable across different desktop window sizes without clipping or stretching.

## D07. Resize Behavior
- **Chosen**: Recalculate the container and UI layout immediately when the browser viewport changes.
- **Rationale**: Keep the application fitted after window resize, browser zoom changes, and orientation/viewport changes.
