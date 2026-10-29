# Plan: GitHub Pages Static Game and Performance

## Goal
Serve Cat Runner as a browser-only game at the repository's GitHub Pages URL, remove the unused Node/Express server stack and Render deployment, preserve browser-local gameplay and records, and reduce visible frame stutter on desktop Chrome and Edge. Visitors must not need Node.js. Contributors keep Node 24 for the retained automated test suite. The repository Pages path is `/cat_runner/`; all entry, style, and image URLs must resolve there. Target close to 60 frames per second while preserving game rules and visual behavior.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | Convert the app to local-only static play, remove server infrastructure, publish the `public` directory through Pages, and optimize the per-frame renderer. | [P01](../phases/2026-10-29-github-pages-performance-cleanup/P01-static-game-performance/phase.md) |

## Confirmed decisions
- Static hosting is GitHub Pages; deploy automatically from `main` after CI passes.
- Keep the welcome screen, local play, browser-local progress and personal records. Remove login, API, SQLite, shared server leaderboard, and Render.
- Delete backend-only tests, dependencies, environment configuration, and setup documentation; retain browser game and UI tests.
- Preserve Node 24 as the developer/CI test runtime; it is not a requirement for visitors.
- Primary performance target is desktop Chrome/Edge, close to 60 frames per second, with startup and ongoing stutter addressed.
- The previous Render hosting choice in `.memory/decisions/2026-10-02-public-web-deployment.md` is superseded.
