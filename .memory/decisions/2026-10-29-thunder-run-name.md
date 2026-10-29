# Decisions: Thunder Run Name

- Date: 2026-10-29
- Status: Confirmed

## D01. Change the public-facing game name
- **Chosen**: Use `썬더런` for the name shown in the browser tab, initial page heading and accessible game label, and the brand label/loading heading in the start screen. Update README and development-document titles/references to `썬더런 (Thunder Run)`.
- **Rationale**: The user wants the game renamed while keeping its existing Korean interface and adding an English equivalent in project documentation.

## D02. Preserve technical identifiers and published address
- **Chosen**: Keep the GitHub repository and Pages URL, npm package name, asset directory, local-storage keys, and other internal identifiers unchanged.
- **Rationale**: The user selected a public-facing rename only. Preserving storage keys keeps existing browser saves and records available, and preserving the published address avoids changing the link players use.

## Codebase Findings
- The static page title, page heading, and accessible game label are in `public/index.html`.
- The start-screen brand label and loading heading are created in `public/js/ui/auth-screen.js`.
- `README.md` and `docs/development.md` use `Cat Runner` in their title and introduction.
- Internal identifiers such as npm package name `cat-runner`, asset directory `public/assets/cat-runner`, and browser storage keys use `cat-runner`; leave them as-is per D02.
- There is no separate logo or favicon asset in `public/` to rename or recreate.

## Out of Scope
- No repository rename, Pages URL change, storage migration, asset-folder move, logo design, or gameplay change is included.
- No other adjacent issue was found during this name-surface inspection.
