# Task: T03 GitHub Pages Publishing

## Status: pending

## Goal
Serve the repository's static game correctly from `https://jeong-sodam.github.io/cat_runner/` and deploy the contents of `public/` automatically from `main` after the existing Node 24 CI matrix passes.

## Decision Summary
- GitHub Pages publishes the existing static `public/` directory without a bundler.
- Pages deployment runs only on a successful push to `main`; pull requests run tests but do not publish.

## Implementation

### I01. Make all browser entry, stylesheet, font, and sprite paths repository-subpath safe

- Related Files:
  - `public/index.html` :: stylesheet and module script references — modify
  - `public/styles.css` :: `@font-face` source — modify
  - `public/js/render/asset-manifest.js` :: `CAT_ASSET_MANIFEST`, `BACKGROUND_ASSET_MANIFEST`, `ITEM_ASSET_MANIFEST` — modify
  - `test/render.test.js` :: asset manifest assertions — modify
  - `test/app-flow.test.js` :: public startup remains fetch-free — read-only

#### Details
- **Signatures & Types**:
  ```javascript
  const assetUrl = (fileName) =>
    new URL("../../assets/cat-runner/" + fileName, import.meta.url).href;
  ```
- **Execution Flow / Logic**:
  1. Use `./styles.css` and `./js/app/main.js` in `index.html`; these resolve relative to the Pages project root.
  2. In `styles.css`, use `url("./assets/fonts/PretendardVariable.woff2")`; CSS asset paths resolve relative to `styles.css`.
  3. In `asset-manifest.js`, build every cat/background/item source with the `assetUrl` helper and paths relative to `import.meta.url`. Preserve all existing asset identifiers, dimensions, frame metadata, and file names.
  4. Keep intra-module imports relative as they already are. Do not add a bundler or rewrite game imports.
  5. Update assertions to verify every manifest URL ends in the expected `/cat-runner/{cats|backgrounds|items}/...` path and is resolvable when the page is mounted below `/cat_runner/`.
- **Error & Exception Handling**: Keep existing renderer fallback when an image fails. Do not use a root-leading `/` URL for any page-owned asset.

### I02. Add a test-gated Pages deployment job and publish instructions

- Related Files:
  - `.github/workflows/node-compatibility.yml` :: existing `test` matrix and new `deploy` job — modify
  - `README.md` :: public URL and automatic publishing note — modify
  - `docs/development.md` :: first-time GitHub Pages setup and manual smoke checklist — modify

#### Details
- **Data & Schema Fields**:
  - Deployment artifact directory: repository `public/`; no build output directory or generated bundle.
  - GitHub Actions job permissions: deployment job gets `pages: write`, `id-token: write`, and `contents: read`; test job remains read-only.
- **Execution Flow / Logic**:
  1. Preserve current `pull_request` and `push` to `main` triggers and the four-platform Node 24 test matrix.
  2. Add a `deploy` job with `needs: test` and condition `github.event_name == 'push' && github.ref == 'refs/heads/main'`.
  3. In deploy job, check out the repository, upload `public/` using `actions/upload-pages-artifact@v5`, then deploy with `actions/deploy-pages@v5`. Use environment `github-pages` and expose the deployment URL.
  4. Document the one-time repository setting: Settings → Pages → Build and deployment → Source = GitHub Actions. Explain that pushes to main deploy only after all compatibility jobs pass.
  5. Add manual smoke steps to open `https://jeong-sodam.github.io/cat_runner/`, verify the module and font load, start local play, and check the browser console/network for failed `/cat_runner/` assets or API requests.
- **Error & Exception Handling**: The deploy job must be skipped for pull requests and must not run when any matrix test fails. If Pages is not enabled in repository settings, document the exact setting rather than silently treating a failed deployment as success.

## Acceptance Criteria
- [ ] All CSS, font, script, and sprite assets resolve under the `/cat_runner/` prefix.
- [ ] Pull requests run tests without deploying; successful pushes to `main` deploy `public/` only after the entire test matrix passes.
- [ ] Repository setup instructions identify GitHub Actions as the Pages source.
- [ ] The deployed welcome screen and local game work without Node or API calls in the visitor's browser.

## Validation
- `npm test` — manifest and browser app tests pass.
- GitHub Actions PR run — all four Node 24 platform jobs pass and deployment is skipped.
- GitHub Actions push to `main` — tests pass, Pages artifact contains `public/index.html`, and deployment publishes the Pages URL.
- Browser smoke check at `https://jeong-sodam.github.io/cat_runner/` — no page-owned request is sent to domain root or `/api/*`.

## Commit Message
```text
feat(deploy): publish the static game with GitHub Pages

Plan: 2026-10-29-github-pages-performance-cleanup
Phase: P01-static-game-performance
Task: T03-github-pages-publishing

- Support repository-prefixed Pages asset URLs
- Deploy public files from main after the Node 24 CI matrix passes
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
