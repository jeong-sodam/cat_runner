# Task: T05 고양이 능력치 카드와 Mayhem 표시

## Status: pending

## Goal

캐릭터 선택 화면에서 6마리 고양이의 9종 1~5 능력치와 강점·약점을 이해하기 쉽게 표시한다. `chaos`의 한국어 표시명은 유지하고 내부 metadata만 `Mayhem`으로 바꾸며, 기존 chaos asset path와 selection contract를 보존한다.

## Decision Summary

- 카드에 9종 능력치 막대를 모두 표시한다.
- 값은 1~5 등급이며 3이 평균이다. 기존 advantage/weakness 문구는 유지하고 새 능력치의 한국어 라벨을 고정한다.
- 화면 이름은 기존 `카오스`를 유지한다. `englishName: "Mayhem"`은 metadata/diagnostics 용도이며 `catId`, asset key, server ID를 바꾸지 않는다.

## Implementation

### I01. Cat card data rendering

- Related Files:
  - `public/js/ui/cat-card.js` :: `renderCatCard`, `formatMultiplier`; modify
  - `public/js/ui/character-select.js` :: `CAT_IDS`, card rendering; read-only unless metadata needs forwarding
  - `public/styles.css` :: `.cat-card`, new stat grid/bar classes; modify

#### Details

- Replace the existing single `small` multiplier line with a semantic `ul`/grid containing exactly these labels in stable order: `점프`, `속도`, `슬라이드`, `아이템`, `체력`, `자석 범위`, `점수`, `낙사 저항`, `무적 지속`.
- Each stat row renders a 5-segment visual bar and accessible text `N/5`. It reads `catDefinition.statRatings` and does not recompute values from floating multipliers.
- Keep `data-cat-id="chaos"`, preview source `/assets/cat-runner/cats/chaos.png`, existing selection/aria behavior, and `advantage`/`weakness` text. Add `data-english-name="Mayhem"` only if needed for diagnostics; do not display it in the card.
- CSS must keep three-column desktop cards and existing responsive mobile layout. Stat bars must wrap or compress without hiding any of the nine values.

### I02. Cat UI tests

- Related Files:
  - `test/app-flow.test.js` :: character selection and card assertions; modify
  - `test/game-core.test.js` :: CAT_DEFINITIONS metadata assertions; modify if needed

#### Details

- Assert six cards remain, chaos card keeps its ID and asset path, label remains `카오스`, and `englishName` is `Mayhem`.
- Assert every card contains nine labeled 1~5 stat rows, correct `aria-pressed`, selection behavior, and no missing values.
- Assert responsive class names and existing start button behavior remain intact.

## Acceptance Criteria

- [ ] Six cat cards expose all nine 1~5 stats, advantages, and weaknesses.
- [ ] Chaos remains server/client ID `chaos`, asset path unchanged, and display label remains Korean `카오스`.
- [ ] Metadata contains `englishName: "Mayhem"` without changing API payload IDs.
- [ ] Desktop/mobile card layout and existing selection tests remain green.

## Validation

- `npm.cmd test -- test/app-flow.test.js test/game-core.test.js`

## Commit Message

```text
feat(ui): show nine-stat cat role cards

Plan: 2026-09-22-mayhem-dual-input-difficulty
Phase: P01-mayhem-dual-input-difficulty
Task: T05-cat-selection-ui

- Render all cat ratings and preserve chaos identity
- Add accessible stat bars for character selection
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
