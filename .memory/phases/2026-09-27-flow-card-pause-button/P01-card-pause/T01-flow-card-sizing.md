# Task: T01 Flow Card Sizing

## Status: done

## Goal

Increase the breathing room of ordinary .flow-card panels used by authentication, nickname, result, and similar information screens. Preserve font sizes, internal gap, wide-card dimensions, scoped scrolling, and mobile safety while making the card approximately 20% wider and its top/bottom padding approximately 50% larger.

## Decision Summary

- Only ordinary .flow-card panels change; .wide-card panels such as character selection, leaderboard, and personal records remain unchanged.
- The base width changes from the current 430px cap to the 20%-larger 516px cap, while max-width: 100% and the existing viewport subtraction prevent horizontal overflow.
- Only block padding changes: current top/bottom values are multiplied by 1.5; inline padding, font sizes, gap, border, radius, and card content order remain unchanged.

## Implementation

### I01. Resize the ordinary flow-card contract

- Related Files:
  - public/styles.css :: .flow-card, .wide-card, responsive .flow-card rules; modify

#### Details

- Change the base .flow-card width from min(430px, calc(100% - 8px)) to min(516px, calc(100% - 8px)); retain max-width: 100% and min-width: 0.
- Change the base .flow-card padding from the single clamp(10px, 3vw, 32px) value to separate block/inline values: block padding clamp(15px, 4.5vw, 48px) and inline padding clamp(10px, 3vw, 32px). This is the 1.5x vertical expansion while preserving current horizontal padding behavior.
- Keep .flow-card gap: clamp(8px, 1.5vw, 12px), border, radius, background, shadow, max-height, and overflow unchanged.
- Do not modify .wide-card, .character-screen, .cat-grid, or leaderboard/personal-record layout rules.
- In the existing max-width: 500px block, keep the card within the shell by updating the mobile cap to width: min(100%, 516px) so the base 20% increase is not silently undone. Retain max-width: 100% and do not permit horizontal overflow.
- Do not change heading/body font sizes; the requested extra space is padding, not typographic scaling.

### I02. Preserve viewport and scrolling behavior

- Related Files:
  - public/styles.css :: #screen-root, .flow-card, .wide-card, body overflow rules; read-only unless the card change causes a regression

#### Details

- Verify that the increased card padding remains bounded by the existing max-height and the root’s overflow: hidden.
- Keep page-level overflow hidden and keep any content scrolling scoped to the existing wide panels; the card expansion must not create a body scrollbar.
- Ensure the login/auth card is enlarged by the same ordinary .flow-card rule and remains centered in #screen-root.

## Acceptance Criteria

- [ ] Login, nickname, result, and other ordinary .flow-card panels use a 516px maximum width and 48px maximum block padding.
- [ ] Ordinary flow-card text size, internal gap, and content order are unchanged.
- [ ] Character selection, leaderboard, and personal-record .wide-card panels retain their existing width and scroll behavior.
- [ ] At narrow viewports, ordinary cards remain within the shell with no horizontal document overflow.

## Validation

- node --test test/fullscreen-layout.test.js test/font-layout.test.js test/app-flow.test.js — existing and new layout contracts must pass.
- Manual browser check: inspect login and result screens at desktop and narrow viewport widths; confirm larger card breathing room without clipped text or page scrolling.

## Commit Message

~~~text
style(ui): add breathing room to flow cards

Plan: 2026-09-27-flow-card-pause-button
Phase: P01-card-pause
Task: T01-flow-card-sizing

- Increase ordinary flow-card width by twenty percent
- Increase only vertical card padding while preserving responsive bounds
~~~

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: recorded in git history

## Validation Results

- `node --test test/fullscreen-layout.test.js test/font-layout.test.js test/app-flow.test.js`: pass, 28/28.
