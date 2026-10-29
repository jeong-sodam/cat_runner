# Decisions: Node 24 Runtime Alignment

- Date: 2026-10-29
- Status: Confirmed

## D01. Supported Node.js runtime
- **Chosen**: Support Node.js 24 only.
- **Rationale**: The current development environment runs Node.js v24.20.0, and the user wants collaborators to use the same major version line.

## D02. Runtime version hint
- **Chosen**: Add `.nvmrc` with `24`.
- **Rationale**: Version managers that read `.nvmrc` can select the Node 24 line consistently; using the major line allows compatible 24.x patch updates.

## D03. Runtime enforcement
- **Chosen**: Do not hard-fail local installation when Node is outside version 24.
- **Rationale**: Declare the supported version and validate it in CI without blocking local installs solely due to the runtime version.

## D04. Files to align
- **Chosen**: Update `package.json` and the root package lock engine declaration to Node 24, update README and developer documentation, and change the GitHub Actions Node compatibility matrix to Node 24 only.
- **Rationale**: These are the existing places that define, explain, and verify supported Node versions.

## D05. Local installation prerequisites
- **Chosen**: On the project's documented platform targets, a clean clone should install and run with Node.js 24 and npm, without requiring users to install Python or C++ build tools.
- **Rationale**: The user wants a beginner-friendly setup with only the JavaScript runtime and package manager. The project already locks `better-sqlite3` 12.11.1 for prebuilt SQLite binaries and has completed cross-platform CI coverage for Windows x64, Ubuntu x64, Intel macOS, and Apple Silicon macOS.

## Investigation note
- The provided terminal screenshot shows the shell prompt at `~`, which suggests the commands may have run in the user's home directory rather than inside the cloned repository. `npm ERR! ENOENT` can result when npm cannot find `package.json` in the current directory, so the screenshot alone does not establish a Node version failure. The README already instructs users to `cd cat_runner` before running npm commands.
- The separate comment about missing C++ build tools is consistent with a native dependency falling back to a source build when a usable prebuilt binary is unavailable. The repository pins `better-sqlite3` 12.11.1 and its completed cross-platform install work validates Windows x64, Ubuntu, Intel macOS, and Apple Silicon macOS on Node 22 and 24. The upstream project documents both supported-Node and native-build-tool troubleshooting. Therefore a Node version mismatch is plausible, while the exact cause still depends on the install log, Node version, and architecture.
- The install requirement applies to the existing documented targets; it does not claim that every operating system or CPU architecture has a prebuilt SQLite binary. If installation reports C++ tools on a documented target with Node 24, inspect the full npm debug log for why the prebuilt binary was not used instead of asking the player to install a compiler toolchain.
