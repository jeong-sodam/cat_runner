# Decisions: GitHub Pages Static Game and Performance

- Date: 2026-10-29
- Status: Confirmed

## D01. Public hosting
- **Chosen**: Publish the browser game on GitHub Pages at the repository's `github.io` URL.
- **Rationale**: Visitors can play in a browser without installing Node.js; GitHub Pages serves static HTML, CSS, JavaScript, and image files.

## D02. Server backend and Render configuration
- **Chosen**: Remove the Node/Express backend, Render configuration, and backend-only application code.
- **Rationale**: The selected public experience is browser-local gameplay and does not need server APIs, authentication, or SQLite.
- **Supersedes**: `.memory/decisions/2026-10-02-public-web-deployment.md`'s Render hosting choice.

## D03. Related tests, dependencies, and documentation
- **Chosen**: Remove server-only tests, backend dependencies, environment configuration, and Render/backend setup documentation; keep browser game and UI tests.
- **Rationale**: Retain checks for the game people will play while removing checks and setup for deleted server features. Keep Node 24 available for contributors and CI to run the retained tests; visitors do not need Node.

## D04. Pages deployment workflow
- **Chosen**: Automatically publish the static site from the `public` directory when changes reach `main`, using GitHub Actions and the GitHub Pages deployment environment.
- **Rationale**: The site already consists of static files in `public` and has no bundling step. Automatic deployment keeps the public game in sync with the main branch.

## D05. First screen and gameplay mode
- **Chosen**: Keep a welcome/start screen with a local-play button, then show character selection. Remove the server login path and its `/api/me` startup request.
- **Rationale**: This keeps the existing clear entry flow while making startup independent of a backend.

## D06. Records and rankings
- **Chosen**: Keep gameplay and personal records in browser-local storage; do not provide accounts or a shared server leaderboard.
- **Rationale**: Local play and personal records work without a backend and are isolated to each visitor's browser.

## D07. Performance target
- **Chosen**: Reduce startup and in-game stutter, targeting close to 60 frames per second on a typical desktop PC using current Chrome or Edge.
- **Rationale**: The user reports lag both when play starts and as play continues, and selected desktop Chrome/Edge as the primary environment.
- **Implementation constraint**: Preserve current game rules and visual behavior while optimizing loading, simulation, and rendering work.

## D08. GitHub Pages paths
- **Chosen**: Make page, script, stylesheet, and asset URLs work under the repository subpath (for example `/cat_runner/`).
- **Rationale**: Current references use domain-root paths such as `/styles.css` and `/assets/...`, which do not resolve to the repository's Pages subpath.
