# Decisions: Python-Free Clone and Run Setup

- Date: 2026-10-27
- Status: Confirmed

## D01. Supported local environments
- **Chosen**: Windows x64 and macOS on both Intel and Apple Silicon, with Node.js and npm already installed. Keep Linux support for the existing Render deployment.
- **Rationale**: The requested workflow is for people cloning the repository and running it locally; the repository currently deploys to Render on Linux.

## D02. Node.js prerequisite
- **Chosen**: Keep the existing Node.js 22 or 24 requirement. Users need Node.js/npm installed before running `npm.cmd install` and `npm.cmd start` on Windows (or the equivalent `npm` commands on macOS/Linux).
- **Rationale**: These commands install and start a Node.js application; they cannot replace installing the Node.js runtime itself.

## D03. SQLite installation approach
- **Chosen**: Downgrade `better-sqlite3` from 13.x to 12.x and keep the current SQLite implementation.
- **Rationale**: The project uses the synchronous `better-sqlite3` API throughout repositories and session storage. The 12.x install path uses prebuilt binaries before attempting native compilation, reducing the need for Python and compiler tools while keeping code changes small.

## D04. Setup documentation
- **Chosen**: Clarify the clone-and-run prerequisites and commands in the README, including that Python is not a prerequisite for the supported Windows x64 and macOS architectures when a compatible prebuilt binary is available.
- **Rationale**: The requested experience should be visible to people following the project setup instructions.
