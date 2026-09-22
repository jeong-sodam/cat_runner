# Task: T01 게임 중심 동화책풍 화면 마감

## Status: done

## Goal

게임 캔버스를 중심으로 두고 시작·선택·결과·순위표 패널이 그 위에서 작고 읽기 쉽게 보이도록 스타일을 완성한다. 캐릭터 선택에는 여섯 고양이의 실제 에셋 미리보기를 제공하되 이미지가 없어도 카드 기능이 유지되어야 한다.

## Decision Summary

- 메뉴는 별도 카드 중심 랜딩 페이지가 아니라 게임 배경 위의 명확한 패널이다.
- 시스템 한글 글꼴을 우선 사용하며 외부 웹폰트는 추가하지 않는다.

## Implementation

### I01. 공통 시각 토큰과 오버레이 레이아웃

- Related Files:
  - `public/styles.css` :: root tokens, shell, cards, buttons, pause/result/leaderboard/character styles, responsive rules; modify
  - `public/index.html` :: shell decorative/accessibility hooks only if required; modify only if needed

#### Details

- **Data & Schema Fields**:
  - CSS custom properties define paper/cream surface, ink, warm orange accent, soft green, shadow and rounded outline. No external font URL is added.
- **Execution Flow / Logic**:
  1. Use Korean system-font stack beginning `"Malgun Gothic"`, `"Apple SD Gothic Neo"`, `system-ui`, `sans-serif`.
  2. Retain 16:9 shell/canvas sizing. Add subtle paper texture with CSS gradients only; no overlay may intercept canvas controls.
  3. Style `flow-card`, `pause-card`, result, resume, leaderboard as semi-opaque cream panels with warm outlines/shadows, bounded dimensions and readable contrast.
  4. Keep visible hover/focus states and mobile breakpoints. At narrow widths keep controls accessible, allow wide panels to scroll and never hide game actions.

### I02. Character previews with non-blocking fallback

- Related Files:
  - `public/js/ui/cat-card.js` :: `renderCatCard`; modify
  - `public/js/ui/character-select.js` :: `createCharacterSelect`; modify only if preview URL injection is required
  - `public/js/render/asset-manifest.js` :: preview helper/export; modify only if current API needs it
  - `test/app-flow.test.js` :: preview/selection regression; modify

#### Details

- **Signatures & Types**:
  ```javascript
  function renderCatCard(catDefinition, selected, onSelect, documentRef, options = {})
  // options: { previewSrc?: string | null }
  ```
- **Execution Flow / Logic**:
  1. Add `img.cat-preview` before cat name only when a known preview URL exists. Korean alt: `{고양이 이름} 고양이 모습`; use `loading="eager"`, `decoding="async"` where supported.
  2. On image error, hide/remove only image; card must remain selectable and keep `aria-pressed`, name and stats.
  3. Use static manifest URL without waiting on preloader; preview failure stays independent of renderer fallback.
  4. Assert all six cards, default black selection and start callback behavior remain intact.

## Acceptance Criteria

- [x] Overlay screens are readable over the game and use warm storybook styling without external webfont requests.
- [x] Cat previews are distinct when loaded and cards stay functional after image failure.
- [x] Desktop/narrow screen rules preserve actions, focus, cards and scrollability.

## Validation

- `npm.cmd test -- test/app-flow.test.js test/render.test.js` — screen/card and asset API tests pass.
- `npm.cmd test` — complete serial Node test suite passes.
- Manual: inspect login, guest, nickname, character, pause, result, leaderboard at desktop and 500px width.

## Commit Message

```text
feat(ui): polish game-first storybook screens

Plan: 2026-09-22-cat-runner-visual-korean-refresh
Phase: P03-screen-polish-verification
Task: T01-game-first-screen-polish

- Style all game overlays with a warm Korean storybook visual system
- Add resilient preview art to the six selectable cat cards
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
