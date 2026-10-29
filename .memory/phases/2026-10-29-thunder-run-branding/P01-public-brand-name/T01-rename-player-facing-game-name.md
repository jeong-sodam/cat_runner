# Task: T01 Rename Player-Facing Game Name

## Status: done

## Goal
Show `썬더런` as the game brand in the browser tab, static entry page, and dynamic welcome/loading screens, and use `썬더런 (Thunder Run)` in project documentation without changing game data, technical identifiers, or the existing Pages address.

## Decision Summary
- Use `썬더런` for browser-facing UI and `썬더런 (Thunder Run)` in README/developer documentation.
- Preserve the npm name, local-storage keys, asset folder, repository/Pages URL, gameplay copy, and all game behavior.

## Implementation

### I01. Update the static and dynamic browser-facing brand

- Related Files:
  - `public/index.html` :: `<title>`, `main#game-shell[aria-label]`, initial `h1` — browser tab, accessible game name, and static first-frame brand; modify
  - `public/js/ui/auth-screen.js` :: `renderWelcomeScreen`, `renderLoadingScreen` — dynamic welcome eyebrow and loading title; modify
  - `test/fullscreen-layout.test.js` :: `index keeps the responsive viewport and fullscreen layout anchors` — extend the static entry-page contract to check the brand title, main accessible name, and heading; modify
  - `test/app-flow.test.js` :: `bootstrap waits for font readiness and opens the welcome screen without API requests`, `bootstrap renders the welcome screen without fetch` — check loading and welcome brand text; modify

#### Details
- **Signatures & Types**:
  ```javascript
  function renderWelcomeScreen(root, options = {})
  function renderLoadingScreen(root, options = {})
  test(name, async () => { /* Node.js built-in test */ })
  ```
- **Data & Schema Fields**:
  - No data model or browser-storage schema changes.
  - Static page text contract: document `<title>` is `썬더런`; `main#game-shell` accessible label is `썬더런 게임`; the initial `h1` text is `썬더런`.
  - Welcome screen brand contract: the `.eyebrow` text is `썬더런`.
  - Loading screen heading contract: text is `썬더런 불러오는 중...`.
- **Execution Flow / Logic**:
  1. In `public/index.html`, replace only the old game name in `<title>`, `#game-shell`'s `aria-label`, and the initial `<h1>` with the exact strings above. Keep the welcome description and canvas accessible label unchanged.
  2. In `renderWelcomeScreen(root, options = {})`, change only the eyebrow brand text to `썬더런`; retain the existing tagline, description, and `게임 시작` button.
  3. In `renderLoadingScreen(root, options = {})`, change the heading to `썬더런 불러오는 중...`; keep screen structure and font fitting behavior unchanged.
  4. Extend the static index test in `test/fullscreen-layout.test.js` to assert the exact title, main accessible label, and initial heading while retaining its current viewport and shell assertions.
  5. Extend `test/app-flow.test.js` to assert the loading heading while font readiness is pending and assert the welcome brand after bootstrap completes. Keep the existing no-fetch and screen-transition assertions.
  6. Do not rename CSS classes, IDs, JavaScript symbols, game descriptions/taglines, cats, score labels, storage keys, npm metadata, or asset paths.
- **Error & Exception Handling**: Keep the current null-root handling and font-fitting fallback behavior unchanged. No new runtime branches or errors are introduced.
- **State Transition & Return**: Bootstrap still transitions from `LOADING` to `WELCOME` after fonts are ready; only the displayed brand text changes.

### I02. Update the project documentation brand

- Related Files:
  - `README.md` :: document title, opening description, and game link label — identify the published game consistently; modify
  - `docs/development.md` :: document title and opening project description — identify the source project consistently; modify

#### Details
- **Signatures & Types**:
  - Markdown documents; no code signatures or data types.
- **Data & Schema Fields**:
  - README heading: `# 썬더런 (Thunder Run)`.
  - README opening description begins with `썬더런 (Thunder Run)은`.
  - README play link label: `썬더런 (Thunder Run) 열기`; preserve the existing URL `https://jeong-sodam.github.io/cat_runner/` exactly.
  - Developer guide heading: `# 썬더런 (Thunder Run) 개발 안내`.
  - Developer guide opening project reference begins `썬더런 (Thunder Run)은`.
- **Execution Flow / Logic**:
  1. Replace only the old product-name references in the README heading, first description sentence, and link label with the exact wording above.
  2. Replace the old product-name references in the developer-guide heading and first paragraph with the exact wording above.
  3. Preserve documented Node.js 24 development/CI requirements, Pages setup, URLs, gameplay instructions, and all other technical content.
  4. Do not change `package.json`'s `name`, lockfile names, storage keys, repository name, or asset path segments; these are technical identifiers intentionally kept for compatibility.
- **Error & Exception Handling**: Not applicable; documentation-only text edits.
- **State Transition & Return**: Not applicable; no runtime behavior changes.

## Acceptance Criteria
- [x] Browser tab, static entry page, welcome brand label, and loading heading display the exact `썬더런` branding.
- [x] README and developer-guide headings/opening references use `썬더런 (Thunder Run)` and the README link still targets the current Pages URL.
- [x] Existing welcome tagline, gameplay copy, local saves, package name, asset paths, and game behavior remain unchanged.
- [x] Static page and dynamic screen tests assert the new brand text.

## Validation
- [x] `npm.cmd test` — all 113 tests pass, including the updated index and app-flow contracts.
- [x] `git diff --check` — no whitespace errors.
- Review `git diff` to confirm changes are limited to the four public/documentation files, two targeted test files, and this plan's task record.

## Commit Message
```text
feat(brand): rename game to Thunder Run

Plan: 2026-10-29-thunder-run-branding
Phase: P01-public-brand-name
Task: T01-rename-player-facing-game-name

- Show 썬더런 across the game entry and loading screens
- Update project documentation to 썬더런 (Thunder Run)
```

## Progress
- [x] Implementation complete.
- [x] Validation passed.
- commit: `dadcddf` (`feat(brand): rename game to Thunder Run`)
