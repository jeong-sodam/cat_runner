# Task: T02 반응형 텍스트 자동 축소

## Status: done

## Goal

로그인·결과·개인기록표·순위표·캐릭터 선택·일시정지 등 HTML 화면에서 제목 잘림과 카드 좌우 잘림을 제거하고, 본문은 최대 2줄 범위에서 읽기 좋게 줄바꿈한다. 캔버스 HUD와 리듬 타겟 글자는 고정 패널의 실제 너비를 넘지 않도록 최소 크기 10px까지 자동 축소한다.

## Decision Summary

- 중요 제목은 28px에서 시작해 좁은 화면에서는 20px까지 자동 축소하며 한 줄을 우선한다.
- 최소 크기에서도 긴 제목이면 카드 폭을 화면 안에서 넓히고 좌우 여백을 줄인다. 말줄임표로 숨기지 않는다.
- 본문과 안내 문구는 최대 2줄까지 자연스럽게 줄바꿈한다.
- 최소 320px 화면 폭부터 데스크톱까지 지원한다.
- 캔버스 전체를 축소하지 않고 텍스트만 패널별 너비에 맞춰 축소한다.

## Implementation

### I01. HTML 카드와 제목의 반응형 CSS

- Related Files:
  - `public/styles.css` :: `#screen-root`, `.flow-card`, `.wide-card`, 제목·본문·버튼·표·media query 규칙; modify

#### Details

- `#screen-root h1` 및 `.flow-card h1`의 `text-overflow: ellipsis`를 제거하고, 중요한 제목은 `white-space: nowrap`을 유지하되 텍스트를 숨기지 않는다.
- 카드에는 `min-width: 0`, `max-width: 100%`, `width: min(...)`, `padding: clamp(...)`을 적용해 320px에서도 테두리와 콘텐츠가 모두 화면 안에 들어오게 한다.
- 제목의 기본 범위는 일반 화면 28px 이상, 좁은 화면 20px 이상으로 정의하고, 자동 fitting 유틸리티가 계산한 인라인 크기를 우선한다.
- `.flow-card p`, `.result-status`, `.leaderboard-note`, `.local-storage-warning`, `.current-result p`에는 `overflow-wrap: anywhere`와 읽을 수 있는 `line-height`를 적용한다. 본문은 제목처럼 `nowrap`이나 ellipsis로 자르지 않는다.
- `.result-actions`는 계속 wrap하며 버튼은 컨테이너 너비를 넘지 않도록 `max-width: 100%`를 갖는다.
- `.wide-card`와 기록표는 화면 폭을 넘지 않는 카드 안에서 동작하도록 조정한다. 표의 열 정보는 유지하되 좁은 화면에서는 표 영역만 가로 스크롤할 수 있게 한다.
- `@media (max-width: 760px)`, `@media (max-width: 500px)`, 필요 시 `@media (max-width: 360px)`에서 카드 여백·제목 크기·버튼 간격을 조정하되, 320px 미만을 지원하기 위해 레이아웃을 숨기지 않는다.

### I02. DOM 제목 fitting 유틸리티와 화면 연결

- Related Files:
  - `public/js/ui/text-fitting.js` :: 제목을 한 줄에 맞추는 측정·반응형 유틸리티; new
  - `public/js/ui/auth-screen.js` :: 인증·로딩 제목에 fitting 적용; modify
  - `public/js/ui/result-screen.js` :: 결과 제목과 상태문구 클래스 적용; modify
  - `public/js/ui/personal-records.js` :: 개인기록표 제목·최근 기록 텍스트 적용; modify
  - `public/js/ui/leaderboard.js` :: 순위표 제목·현재 기록 텍스트 적용; modify
  - `public/js/ui/character-select.js` :: 캐릭터 선택 제목 적용; modify
  - `public/js/ui/nickname-screen.js` :: 닉네임 화면 제목 적용; modify
  - `public/js/app/app-controller.js` :: 앱에서 직접 생성하는 resume/start-error 제목 적용; modify

#### Details

- Export signature:

  ```js
  function fitSingleLineText(element, {
    minPx = 20,
    maxPx = 48,
    container = element?.parentElement,
  } = {}): number
  ```

- 함수는 요소가 DOM에 연결된 뒤 현재 컨테이너의 콘텐츠 너비와 텍스트의 실제 렌더링 너비를 비교해 `font-size`를 `maxPx`에서 줄인다. `minPx`보다 작아지지 않는다.
- `ResizeObserver`가 있으면 카드 폭 변경 시 다시 계산하고, 없는 환경에서는 최초 계산만 수행한다. 측정 API가 없는 테스트 DOM에서는 예외 없이 no-op한다.
- 화면별 `h1` 및 중요한 `h2`에 `fit-title` 클래스를 부여하고, root에 append한 뒤 `fitSingleLineText`를 호출한다.
- 로그인 제목, `달리기 완료`, `개인기록표`, `순위표`, 캐릭터 선택 등 제목은 `minPx: 20`, `maxPx: 48`을 사용한다.
- 본문·상태·최근 기록 요약에는 fitting을 적용하지 않고 CSS 줄바꿈을 사용한다. 결과 상태처럼 긴 문장은 의미 있는 문장을 삭제하거나 ellipsis 처리하지 않는다.
- 화면 재생성 시 이전 Observer가 남지 않도록 유틸리티가 반환하는 cleanup을 화면 teardown 시 사용하거나, 기존 root 교체로 Observer가 회수되는 구조를 명시적으로 정리한다.

### I03. 캔버스 텍스트 fitting

- Related Files:
  - `public/js/render/text-fitting.js` :: Canvas 2D 폰트 측정·축소 함수; new
  - `public/js/render/draw-hud.js` :: 점수·거리·정확도·효과·일시정지 텍스트 적용; modify
  - `public/js/render/scene-renderer.js` :: 리듬 타겟 `L`/`R` 텍스트와 공통 폰트 상수 연결; modify

#### Details

- Export signatures:

  ```js
  const CANVAS_FONT_FAMILY = '"Pretendard", "Noto Sans KR", "Malgun Gothic", system-ui, sans-serif';
  function fitCanvasText(ctx, text, x, y, maxWidth, {
    minPx = 10,
    maxPx = 28,
    weight = "bold",
    family = CANVAS_FONT_FAMILY,
  } = {}): number
  ```

- `fitCanvasText`는 `ctx.measureText(text).width`가 `maxWidth` 이하가 될 때까지 1px 단위로 폰트 크기를 줄이고, 최종 `ctx.font`를 설정한 뒤 한 번만 `fillText`한다.
- `measureText`가 없는 테스트용 context에서는 최대 크기로 안전하게 그리며 예외를 발생시키지 않는다.
- 점수·거리 패널은 패널 내부 여백을 제외한 너비, 정확도 패널은 238px, 활성 효과는 라벨·초 단위 각각의 가용 너비, 일시정지 버튼은 버튼 내부 너비를 max width로 사용한다.
- 최소 크기는 HUD·타겟 모두 10px로 제한한다. 하트 아이콘의 개수와 위치 계약은 변경하지 않는다.
- 리듬 타겟의 `L`/`R`은 기존 중앙 정렬과 링 위치를 유지하며, 폰트 계열만 공통 상수로 통일한다.
- 캔버스 논리 해상도 1600×900과 viewport scale 계산은 변경하지 않는다.

## Acceptance Criteria

- [ ] 로그인·결과·개인기록표·순위표의 중요 제목이 ellipsis 없이 한 줄을 우선하고 20px 아래로 내려가지 않는다.
- [ ] 긴 본문·결과 상태·최근 기록 요약이 카드 밖으로 잘리지 않고 자연스럽게 줄바꿈한다.
- [ ] 320px 화면에서도 카드 테두리·버튼·제목이 좌우로 잘리지 않는다.
- [ ] 캔버스 HUD의 긴 숫자와 효과 라벨이 해당 패널 밖으로 넘지 않으며 10px 미만으로 작아지지 않는다.
- [ ] 캔버스 전체 크기, 게임 입력 좌표, 하트 개수, 리듬 타겟 위치는 변경되지 않는다.

## Validation

- `node --test test/render.test.js test/app-flow.test.js`
- 브라우저 수동 확인: `npm start` 실행 후 320px, 500px, 768px, 1280px 폭에서 로그인·캐릭터 선택·게임·결과·개인기록표·순위표를 확인
- 게임 화면에서 긴 점수/거리와 활성 효과를 발생시켜 HUD 패널 경계 안에 표시되는지 확인

## Commit Message

```text
fix(ui): fit Korean titles and canvas labels responsively

Plan: 2026-09-23-font-clipping-font-application
Phase: P01-font-loading-responsive-layout
Task: T02-responsive-text-fitting

- prevent UI card and title clipping across narrow screens
- shrink canvas labels to their panel widths without scaling gameplay
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: 649f12c
