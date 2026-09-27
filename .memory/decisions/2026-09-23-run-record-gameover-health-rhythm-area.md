# Decisions: Run Record, Gameover Flow, Health Scaling, and Rhythm Area

- Date: 2026-09-23
- Status: Confirmed

## D01. Health rating to health capacity

- **Chosen**: Health rating 1 gives 1 health cell, rating 2 gives 2 cells, and so on through rating 5 giving 5 cells.
- **Rationale**: The displayed health capacity should directly communicate the cat's health rating with no hidden offset.

## D02. Run record saving

- **Chosen**: Save the result automatically immediately on gameover; show the current result and whether it is a personal best.
- **Rationale**: A completed run should not depend on an extra button press to preserve the player's score.

## D03. Save failure behavior

- **Chosen**: Server-backed save failures show a clear `save failed / retry` action; local records continue using device storage attempts.
- **Rationale**: Server failures need recovery without hiding data loss, while local mode must remain independent of server availability.

## D04. Gameover character selection flow

- **Chosen**: After gameover, selecting a character opens character selection directly and never shows the `continue run?` prompt.
- **Rationale**: A gameover is a finished run, so the next character selection should start a new run rather than resume the ended one.

## D05. Resume prompt scope

- **Chosen**: Suppress the resume prompt only when character selection is reached from gameover; preserve it after reload, reconnect, or another unfinished server-run recovery flow.
- **Rationale**: Legitimate resumable server runs must remain recoverable while completed runs must not be mistaken for resumable runs.

## D06. Rhythm safe area

- **Chosen**: Restrict rhythm target centers to the logical canvas rectangle `x: 120..1480`, `y: 140..780`.
- **Rationale**: This leaves a 140px top exclusion for score/health HUD content and 120px side/bottom breathing room.

## D07. Consecutive rhythm target spacing

- **Chosen**: Keep consecutive target centers at least 240px apart using Euclidean distance.
- **Rationale**: This prevents abrupt repeated edge placements while preserving enough playfield variety.

## D08. Rhythm placement fallback

- **Chosen**: If the minimum-distance condition cannot be satisfied, choose a fallback position inside the safe area without enforcing the distance condition.
- **Rationale**: Target spawning must never stall or create an invisible target because the playfield is temporarily crowded.
