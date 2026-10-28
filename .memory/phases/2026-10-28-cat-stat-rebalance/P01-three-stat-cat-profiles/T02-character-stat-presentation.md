# Task: T02 Character Stat Presentation

## Status: done

## Goal
Show only the three approved ratings and accurate cat strengths/weaknesses in character selection, and update player and maintainer documentation so they no longer describe jump power or magnet range as cat-specific stats.

## Decision Summary
- Keep the current 1–5 bar UI and show only speed, health, and item duration. Do not display exact multipliers or seconds.
- Keep every character's approved three-stat profile and the identical jump/shared magnet behavior documented accurately.

## Implementation

### I01. Update card labels, accessible stat rows, and character-selection coverage

- Related Files:
  - `public/js/ui/cat-card.js` :: `STAT_LABELS`, `renderStatRow`, `renderCatCard` — remove old stat labels and present the three dynamic rating rows; modify.
  - `test/app-flow.test.js` :: `character selection renders six cats and defaults each new run to black` — update the expected row count/keys and verify the six cards retain their content and selection behavior; modify.
  - `public/styles.css` :: `.cat-stat-grid` and responsive `.cat-stat-grid` rule — read-only unless visual inspection shows a 3-row or mobile overflow issue; do not change layout speculatively.

#### Details
- **Signatures & Types**:
  ```js
  const STAT_LABELS = Object.freeze({
    speed: "속도",
    health: "체력",
    itemDuration: "아이템 지속",
  });
  function renderStatRow(documentRef, statKey, rating) {}
  function renderCatCard(catDefinition, selected, onSelect, documentRef, options) {}
  ```
- **Data & Schema Fields**:
  - Each card's `data-stat-count` must be `"3"` and its `<ul class="cat-stat-grid">` rows must have keys in exact order `speed`, `health`, `itemDuration`.
  - Preserve each row's accessible label `{Korean stat label} {rating}/5`, five visual bar segments, card IDs, names, advantage/weakness text, image fallback, and selected state.
- **Execution Flow / Logic**:
  1. Precondition & Validation: T01 has already changed `CAT_STAT_KEYS` and definitions to the approved three-axis model. Read those values from constants; do not hard-code another stat list in rendering.
  2. Core Processing: Delete `jump` and `magnetRange` from `STAT_LABELS`. Keep the existing generic `CAT_STAT_KEYS` loop so each cat renders the three configured ratings. In the app-flow test, assert three rows, exact keys/order, rating accessibility labels, bar segment counts, six cats, and unchanged selection/image fallback behavior.
  3. Error & Exception Handling: Do not remove W jump, the slide animation, or magnet items from gameplay when removing their stat rows. Do not set the 3-column desktop / 2-column narrow-screen grid to a fixed row count; the existing grid already adapts to its child count.
  4. State Transition & Return: Each of six selectable cards exposes only the three 1–5 rating bars, and selecting a card continues to start that cat as before.

### I02. Update README and developer checklist for the approved traits

- Related Files:
  - `README.md` :: `고양이 선택` table — replace outdated jump/magnet advantages and weaknesses with the three-stat profiles; modify.
  - `docs/development.md` :: `Character selection and movement` manual acceptance checklist — replace the old per-cat jump-modifier statement with checks for the three card ratings, shared jump physics, and shared magnet reach; modify.
  - `.memory/decisions/2026-10-28-cat-stat-rebalance.md` :: D01–D09 — read-only source of approved ratings and mappings.

#### Details
- The README table remains concise and uses these agreed summaries:
  - 검정: advantage `이동 속도`; weakness `아이템 지속 시간`.
  - 하양: advantage `아이템 지속 시간`; weakness `이동 속도`.
  - 삼색: advantage `체력`; weakness `이동 속도`.
  - 치즈: advantage `균형 잡힌 능력`; weakness `뚜렷한 약점 없음`.
  - 고등어: advantage `이동 속도`; weakness `아이템 지속 시간`.
  - 카오스: advantage `이동 속도`; weakness `체력`.
- In the maintainer checklist, verify all six visible cards show speed, health, and item-duration ratings; verify all cats jump at the same strength and the magnet item uses the same radius. Remove the obsolete claim that jump/slide modifiers differ by selected cat.
- Keep unrelated gameplay guidance, including the W/S/P controls, double jump, and magnet effect itself. Do not change the decision doc or actual game values in this presentation/documentation task.

### I03. Update authenticated completion test fixtures to use the new health ratings

- Related Files:
  - `test/integration.test.js` :: `HEALTH_BY_CAT` and `completeRun` — update expected collision counts for cats whose approved health changed; modify.
  - `test/run-resume.test.js` :: `completion endpoint stores an authoritative score and personal best` — submit enough unique obstacle collisions for the new black-cat health of 3; modify.
  - `test/security-regression.test.js` :: `malformed, oversized, invalid, and expired requests use stable safe errors` — submit three black-cat collisions before `run_gameover` so the intended rhythm error remains the first validation failure; modify.

#### Details
- `test/integration.test.js` health table must match the server catalog: black 3, white 3, calico 5, cheese 3, mackerel 3, chaos 1.
- The black-cat completion fixture in `test/run-resume.test.js` must use three distinct manifest obstacle IDs, then its existing `run_gameover`; retain its expected score and result fields.
- The black-cat rhythm-validation fixture in `test/security-regression.test.js` must use three distinct obstacle events and sequence numbers before its invalid rhythm summary. Keep each event time ordered and keep `run_gameover` after all collisions. This ensures the test reaches `RHYTHM_ACCURACY_INVALID` / `RHYTHM_ACCURACY_MISMATCH` validation instead of failing earlier with `GAMEOVER_HEALTH_INVALID`.
- These are test-fixture corrections for the intentionally changed health catalog. Do not change the server validation order, error codes, collision damage, or request contract to make old two-hit fixtures pass.

## Acceptance Criteria
- [x] Character cards show exactly three 1–5 rows in order speed, health, item duration, with unchanged labels accessible to assistive technology.
- [x] All six cards keep their image fallback, selection behavior, and approved advantage/weakness copy; cheese is described as balanced.
- [x] README and developer checklist describe no per-cat jump or magnet-range difference and still describe jump and magnet gameplay.
- [x] No obsolete five-stat assertion or cat-specific jump/magnet description remains in README or developer guide.
- [x] Authenticated endpoint test fixtures reflect the new per-cat health totals and reach their intended validations.
- [x] Character selection and the full Node test suite pass.

## Validation
- `node --test test/app-flow.test.js` — character cards and selection flow pass.
- `npm.cmd test` — complete unit/integration/security suite passes.
- `git diff --check` — no whitespace errors.
- `rg -n "jump power|점프력|magnetRange|자석 범위|자석범위|speed, jump|jump, slide" README.md docs/development.md` — inspect remaining references and confirm they refer only to equal jump behavior, controls, or the magnet effect, not cat-specific stats.

## Commit Message
```text
docs(ui): show three cat stats

Plan: 2026-10-28-cat-stat-rebalance
Phase: P01-three-stat-cat-profiles
Task: T02-character-stat-presentation

- Render only speed, health, and item-duration ratings
- Align README and acceptance guidance with shared jump and magnet behavior
```

## Progress
- [x] Implementation complete
- [x] Validation passed (`node --test test/app-flow.test.js`: 26 passed; `npm.cmd test`: 163 passed, 0 failed; `git diff --check` clean; obsolete per-cat stat references removed from player/maintainer docs).
- commit: recorded in Git history with this Task's commit
