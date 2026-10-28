# Decisions: Player-Friendly README

- Date: 2026-10-27
- Status: Confirmed

## D01. Primary audience
- **Chosen**: People who clone Cat Runner and want to install, start, and play it locally.
- **Rationale**: The README's first job is to help a new player reach the game without sorting through maintainer setup details.

## D02. README content and size
- **Chosen**: Keep the README concise and Korean, with a short description, prerequisites, clone/install/start quick start, local URL, controls, and a compact summary of scoring, item effects, and cat differences.
- **Rationale**: The user selected both the basic controls/objective and gameplay detail options; concise summaries keep useful player information while reducing the current document's length.

## D03. Supported local quick-start environments
- **Chosen**: Show Windows x64 PowerShell commands (`npm.cmd install`, `npm.cmd start`) and Intel/Apple Silicon macOS Terminal commands (`npm install`, `npm start`). Include the repository clone command and Node.js 22/24 LTS prerequisite.
- **Rationale**: The quick start should cover the user's stated clone-and-run workflow on the confirmed operating systems. Python and compiler tools are not prerequisites for the supported targets with the compatible prebuilt SQLite package.

## D04. Developer and deployment details
- **Chosen**: Move detailed Entra setup, Render deployment, testing, and manual acceptance material to `docs/development.md`. Keep a short README link to that guide.
- **Rationale**: Players should not have to read backend and deployment procedures to start the game, while maintainers should retain the existing setup information in one linked guide.

## D05. Local play requirements
- **Chosen**: Clearly state that local play needs no `.env` file, account, or login setup, and direct players to `http://localhost:3000` after startup.
- **Rationale**: The application already supports local play without authentication, so the README should lead with that simplest path.
