# Task: T01 Translate README

## Status: done

## Goal
Make every explanatory paragraph, heading, and list item in the root `README.md` readable Korean so Korean-speaking readers can understand setup, gameplay, local score storage, deployment, and acceptance instructions.

## Decision Summary
- Translate the entire README while retaining its existing section order and Markdown structure. Preserve shell commands, code blocks, environment variable names, file paths, URLs, API names, product names, and code identifiers exactly so the instructions remain executable and references remain valid. Correct the inaccurate claim that every run has three hearts: the HUD displays a number of hearts based on the selected cat's health rating, which currently ranges from one to five.
- Keep gameplay content consistent with the checked-in game: W jumps (with a second airborne jump), S slides while held, P and the on-screen pause control toggle pause, mouse toys and distance contribute to score, grass produces one of four effects, score thresholds change zones, and zero health ends a run. Avoid inventing mobile controls or account features.

## Implementation

### I01. Translate README content

- Related Files:
  - `README.md` :: Markdown document — project overview and usage guide; modify
  - `public/js/game/input-controller.js` :: `createInputController` — read-only source for keyboard and pointer controls
  - `public/js/game/game-loop.js` :: game loop — read-only source for jump behavior and run status
  - `public/js/game/scoring.js` :: `calculateScore` — read-only source for score rules
  - `public/js/game/effects.js` :: `rollGrassEffect`, `getEffectSpeedMultiplier` — read-only source for grass effects
  - `public/js/game/world.js` :: `selectZoneForScore` — read-only source for score-based zones
  - `public/js/ui/auth-screen.js` :: local-play button and login notice copy — read-only source for UI labels
  - `public/js/ui/character-select.js` :: selection and start labels — read-only source for UI labels

#### Details
- **Signatures & Types**: No code symbols or interfaces are changed. The only modified production artifact is the Markdown document `README.md`.
- **Data & Schema Fields**: No data model or schema changes.
- **Execution Flow / Logic**:
  1. Keep the existing document outline and translate the title/overview and every section: Prerequisites, Local setup, Optional Microsoft Entra ID backend, Legacy guest API mode, Game rules, Cats, Local scores and server leaderboard, Public deployment on Render, and Manual acceptance.
  2. Translate explanatory prose, bullets, inline descriptions, and interface labels into natural Korean. Fix any visibly corrupted Korean UI-label text by using the current Korean strings in the UI source files.
  3. Preserve all fenced command/configuration blocks verbatim, including `npm.cmd` invocations, PowerShell commands, `.env` keys and values, and test commands. Preserve exact URLs, paths, route names, identifiers, the `render.yaml` filename, and external link targets. Translate link labels and Markdown link headings without changing their destinations or anchors where the target heading remains the same semantic section.
  4. Translate gameplay rules accurately: W jump and double jump, held S slide, P/on-screen pause, mouse and distance scoring, double-score effect, grass outcomes (magnet, invincibility, double score, and slow effect), zone thresholds, cat choice, and health/game-over behavior. Replace the stale fixed-three-hearts claim with a statement that displayed hearts follow the selected cat's maximum health (currently one to five). Do not describe unsupported sign-in, shared scores, or mobile movement controls as available features.
  5. Translate the deployment and manual acceptance sections without changing operational limitations, links, commands, or the meaning of the checklist. Retain proper product names such as Cat Runner, Microsoft Entra ID, Render, and SQLite as names.
  6. Review the resulting diff for untranslated English prose, accidental changes to code blocks or link destinations, and Markdown structure damage.
- **Error & Exception Handling**: No runtime error paths are changed. If a Korean translation would make a command, link, environment variable, or technical label ambiguous, keep that exact technical token and translate its surrounding explanation.
- **State Transition & Return**: The task changes only `README.md`; no application state changes.

## Acceptance Criteria
- [ ] README headings and explanatory prose are in Korean throughout; technical product names and exact command/configuration tokens remain intact.
- [ ] All existing README sections, links, code blocks, setup guidance, deployment limitations, and acceptance checklist items remain present and semantically accurate.
- [ ] Gameplay instructions match the current control and scoring implementation, including jump, slide, pause, scoring, effects, zones, and game over.
- [ ] The heart-count explanation reflects the selected cat's configured maximum health rather than claiming every run has three hearts.
- [ ] `git diff --check` reports no whitespace errors.

## Validation
- `git diff --check` — no whitespace errors.
- Manual diff review of `README.md` — verify all prose is Korean, all code/configuration blocks and link destinations are preserved, and all original sections remain present.

## Commit Message
```text
docs(readme): translate README into Korean

Plan: 2026-10-26-readme-play-guide
Phase: P01-readme-translation
Task: T01-translate-readme

- Translate the complete README while preserving technical instructions
- Keep gameplay guidance aligned with current controls and rules
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: pending
