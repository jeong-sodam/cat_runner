# Phase: P01 Static Game and Performance

## Status: implementation complete; awaiting Pages publication approval and desktop FPS capture

## Tasks
| Task | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| T01 | `done ✅` | Remove browser authentication and server-run flows while preserving local play, resume, and personal records. | [T01](./T01-local-only-browser-flow.md) |
| T02 | `done ✅` | Delete Node/Express backend files and backend-only tests/configuration; retain Node 24 test tooling and update contributor docs. | [T02](./T02-remove-server-and-runtime.md) |
| T03 | `done ✅` | Make static paths work below `/cat_runner/` and automatically deploy `public/` from `main` through GitHub Pages. | [T03](./T03-github-pages-publishing.md) |
| T04 | `done ✅` | Preserve world entity ordering between simulation steps and avoid per-frame copies, sorting, and off-screen draws; losslessly optimize delivered image assets. | [T04](./T04-rendering-performance.md) |

## Progress
- done: 4/4 implementation tasks. Browser FPS capture remains unverified on a desktop browser.
