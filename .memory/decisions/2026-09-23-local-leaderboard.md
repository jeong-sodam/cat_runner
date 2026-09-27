# Decisions: Local Leaderboard and Rhythm Ease

- Date: 2026-09-23
- Status: Confirmed

## D01. Local leaderboard data scope

- **Chosen**: Store and display records from the current browser/device only while the game is local-only.
- **Rationale**: Login and server-wide ranking are not available yet, so local storage provides a usable personal ranking without pretending it is global.

## D02. Personal ranking coverage

- **Chosen**: Combine all cat records into one personal top-five list.
- **Rationale**: The player can compare total performance across cats; per-cat filtering is not needed for the first version.

## D03. Ranking order

- **Chosen**: Score descending, then distance descending, then earlier achievement time first.
- **Rationale**: This matches the existing server leaderboard ordering and gives deterministic tie handling.

## D04. Current result visibility

- **Chosen**: Always show the latest game result as a separate `방금 기록` row in the local leaderboard, including after reload.
- **Rationale**: The player can see the just-finished score even when it does not enter the top five; persisted latest-result state avoids losing it on refresh.

## D05. Leaderboard screen

- **Chosen**: Reuse the existing leaderboard screen with `내 점수순위` and `전체 순위` tabs. The personal tab is active locally; the global tab is visible but disabled with a login-required message.
- **Rationale**: This establishes the future deployment shape without displaying fake global data or creating a duplicate screen.

## D06. Existing local-best migration

- **Chosen**: Automatically migrate the existing single local-best record into the new top-five list on first read.
- **Rationale**: Existing player progress must not be discarded when the storage schema expands.

## D07. Local leaderboard navigation

- **Chosen**: Local play opens the reused leaderboard screen without server leaderboard requests.
- **Rationale**: The current local-only mode must work offline and must not depend on authentication or network availability.

## D08. Rhythm target size and hit area

- **Chosen**: Increase both the visible target circle and its accepted hit radius by 25%.
- **Rationale**: The target is easier to see and click consistently; visual and hit geometry remain aligned.

## D09. Rhythm target movement difficulty

- **Chosen**: Reduce the preferred minimum distance between consecutive target centers from 240px to 160px, while retaining the safe HUD area and bounded fallback generation.
- **Rationale**: Shorter cursor movement lowers difficulty and reduces excessive movement between targets.
