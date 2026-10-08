# Plan: Node 24 SQLite Compatibility

## Goal

Remove the Node 24 native SQLite cleanup crash by upgrading `better-sqlite3`, explicitly support Node.js 22 and 24, document that support, and exercise the existing test suite on both versions across Windows and Ubuntu. Make the Render service wait for successful CI checks before deployment, then return the active task pointer to the pending public deployment blueprint task.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | Upgrade SQLite/runtime support, add the cross-platform Node matrix, and prepare the deployment blueprint to gate deploys on CI. | [P01](../phases/2026-10-08-node24-sqlite-compatibility/P01-node-runtime-ci/phase.md) |

## Confirmed Constraints

- Use `better-sqlite3` `^13.0.3`; keep the current SQL schema and application behavior.
- Support Node.js 22 and 24 only, expressed as `engines.node: "^22 || ^24"`.
- Update the README prerequisite to Node.js 22 or 24.
- Add GitHub Actions coverage for Node 22 and 24 on `ubuntu-latest` and `windows-latest`, on pull requests and pushes to `main`.
- Make Render wait for passing checks. The CI plan task updates the existing deployment decision and its active T01 blueprint; the existing Public Web Deployment T01 applies the `render.yaml` change and resumes after this plan.
- No database schema migration or new functional test files are required; use the existing full suite.
