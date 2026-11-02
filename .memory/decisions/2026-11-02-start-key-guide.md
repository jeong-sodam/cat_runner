# Decisions: Start Screen Key Guide

- Date: 2026-11-02
- Status: Confirmed

## D01. Feature scope
- **Chosen**: Add keyboard shortcut guidance before play. Do not add a global leaderboard. Keep the existing local personal-record leaderboard.
- **Rationale**: The requested global ranking feature was withdrawn; the user selected keeping the current local records screen.

## D02. Guide placement
- **Chosen**: Show the guide on the welcome screen, before the player selects “게임 시작”.
- **Rationale**: Players can learn the controls before entering the character selection and gameplay flow.

## D03. Shortcut content
- **Chosen**: Document `W` for jumping (including one additional jump in the air), hold `S` to slide, and both `Escape` and `P` to pause or resume.
- **Rationale**: The existing input handler supports `W`, `S`, and `Escape`; add `P` as an equivalent pause toggle so both pause shortcuts shown in the guide work.
