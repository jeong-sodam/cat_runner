# Decisions: Optional Login and Browser Local Play

- Date: 2026-09-29
- Status: Confirmed

## D01. Local play identity
- **Chosen**: Use a completely browser-local mode without a user ID, server session, guest account, or Entra configuration.
- **Rationale**: A person who clones the repository must be able to run the game without editing `.env`; local play should not create server-side identity data.

## D02. Local play entry flow
- **Chosen**: From the initial access screen, local play moves directly to the cat selection screen without nickname or login onboarding.
- **Rationale**: Local play is intended to start immediately and does not need account identity.

## D03. Entra login implementation status
- **Chosen**: Preserve the existing Entra backend routes and configuration for future use, but do not enable login from the current UI.
- **Rationale**: The authentication integration remains available for a later feature while the current clone-and-run experience stays configuration-free.

## D04. Login button behavior
- **Chosen**: Show a login option that, when clicked, displays a `로그인 기능은 개발 예정입니다` notice and does not navigate to `/auth/signin`.
- **Rationale**: Users can see the planned feature without reaching a configuration error or unfinished authentication flow.

## D05. Missing configuration and network fallback
- **Chosen**: Missing Entra variables, an unavailable `/api/me`, or a failed session check all show the same initial choice screen with local play available.
- **Rationale**: Authentication availability must not block browser-local gameplay.

## D06. Local result storage
- **Chosen**: Save completed local scores and personal records in browser storage; show the local personal record view. The server leaderboard remains a development notice.
- **Rationale**: Local results should persist per browser without pretending to be shared server rankings.

## D07. Existing authenticated sessions
- **Chosen**: Honor an already valid authenticated session and keep the existing authenticated user flow; disabling the new login UI does not invalidate existing sessions.
- **Rationale**: This preserves backward compatibility while new visitors use local mode.

## D08. Local in-progress resume
- **Chosen**: Persist local in-progress game state and support resuming it after refresh or reopening the app.
- **Rationale**: Local play should not lose an active run merely because the browser was refreshed or closed.

## D09. Resume prompt
- **Chosen**: When a saved local run exists, show an `이어하기` / `새 게임` choice from the cat-selection flow rather than resuming silently.
- **Rationale**: The user controls whether to continue the saved run or discard it.

## D10. Resume retention
- **Chosen**: Keep the local in-progress run until it is completed or the user chooses `새 게임`; do not expire it by time.
- **Rationale**: Local storage is user-owned and there is no server run lifecycle requiring expiration.

## D11. Local snapshot frequency
- **Chosen**: Save a local snapshot every 1 second during gameplay and save once more on page hide/unload.
- **Rationale**: This balances recovery accuracy with synchronous browser-storage overhead.

## D12. Local mode availability
- **Chosen**: Browser-local mode is always available regardless of `NODE_ENV` or whether `.env` exists.
- **Rationale**: Browser-only local play does not expose server credentials or create guest accounts, so it should not be restricted by the server guest-mode flag.
