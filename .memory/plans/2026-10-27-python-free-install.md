# Plan: Python-Free Clone and Run Setup

## Goal
Allow someone with Node.js 22 or 24 and npm to clone Cat Runner and install/start it with `npm.cmd install` and `npm.cmd start` on Windows x64, or `npm install` and `npm start` on Intel and Apple Silicon Macs, without installing Python or compiler tools. Preserve the SQLite implementation and Linux Render deployment. Document the prerequisites and verify dependency installation and tests across supported platforms.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Use the compatible SQLite dependency release, cover all supported platforms in CI, and document setup | [P01](../phases/2026-10-27-python-free-install/P01-cross-platform-install/phase.md) |
