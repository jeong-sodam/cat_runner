# Plan: Fullscreen Container

## Goal

Make the in-page game container fill the browser viewport on every application screen while preserving the existing visual frame, 16:9 logical game rendering, light-blue letterbox background, responsive UI sizing, and scoped scrolling for long panels. The browser Fullscreen API is out of scope.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `complete` | Convert the shell and document layout to viewport-sized fullscreen behavior, preserve inner scrolling and responsive canvas behavior, then add regression coverage. | [P01](../phases/2026-09-27-fullscreen-container/P01-viewport-shell/phase.md) |
