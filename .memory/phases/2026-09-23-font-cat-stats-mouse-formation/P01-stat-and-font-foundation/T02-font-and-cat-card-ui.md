# Task: T02 폰트와 고양이 선택 UI

## Status: done

## Goal

웹 UI와 캔버스 HUD/리듬 텍스트에 공통 한국어 폰트 우선순위를 적용하고, 주요 제목·버튼·HUD·능력치 라벨이 의도하지 않게 두 줄로 쪼개지지 않도록 크기와 레이아웃을 조정한다. 고양이 선택 카드에는 새 5개 능력치만 눈에 띄게 표시한다.

## Decision Summary

- 폰트 스택은 `Pretendard`, `Noto Sans KR`, `Malgun Gothic`, `system-ui`, `sans-serif` 순서다.
- UI·캔버스 모두 적용한다.
- 제목·버튼·핵심 HUD·능력치 라벨은 single-line이며, 설명문과 긴 기록 요약만 줄바꿈할 수 있다.

## Implementation

### I01. 웹 스타일 폰트와 단일 행 레이아웃

- Related Files:
  - `public/styles.css` :: `:root`, `#screen-root h1`, `.flow-card h1`, `.game-button`, `.cat-card`, `.cat-stat-label`, result/leaderboard rules, responsive media queries; modify

#### Details

- `:root`의 기존 폰트 선언을 결정된 fallback 순서로 교체한다. 외부 CDN이나 네트워크 폰트 의존성은 추가하지 않는다.
- 제목, 버튼, `.local-mode-badge`, `.cat-stat-label`, `.cat-stat-value`, HUD와 결과 화면의 핵심 숫자/레이블은 `white-space: nowrap`을 적용한다.
- `.flow-card h1`과 결과 제목은 `clamp`를 사용하되 카드 내부 폭보다 긴 경우 글자 크기를 줄여 한 줄을 우선한다. 설명문, 긴 개인 기록 요약, 표 셀은 기존처럼 필요한 줄바꿈/스크롤을 허용한다.
- 카드 폭과 모바일 breakpoint에서 제목·버튼이 잘리지 않도록 `min-width: 0`, `overflow: hidden`, 적절한 `text-overflow`를 사용한다. 접근성상 텍스트를 숨기는 방식은 사용하지 않는다.
- 5개 능력치 카드가 데스크톱 3열과 모바일 1열에서 읽히도록 stat grid의 label/bar/value 비율을 재조정하고, 긴 `아이템 지속시간`이 두 줄로 내려가지 않게 축약 표시 또는 충분한 셀 폭을 확보한다.

### I02. 고양이 카드 5개 능력치 표시

- Related Files:
  - `public/js/ui/cat-card.js` :: `STAT_LABELS`, `renderStatRow`, `renderCatCard`; modify
  - `public/js/ui/character-select.js` :: 카드 렌더링 호출; read-only unless required for layout hook

#### Details

- `STAT_LABELS`는 `jump: 점프력`, `speed: 속도`, `health: 체력`, `itemDuration: 아이템 지속`, `magnetRange: 자석 범위`로 정의한다.
- `CAT_STAT_KEYS` 순서대로 정확히 5개의 row만 만든다. 폐기된 능력치의 label, bar, aria-label은 DOM에 생성하지 않는다.
- 기존 1~5 segment bar와 `aria-label="... rating/5"` 접근성 표현을 유지하되, 등급 차이가 시각적으로 명확하도록 filled segment 대비를 유지한다.
- 장점/약점 문구도 새 능력치에 맞게 각 고양이 정의에서 함께 갱신한다. 이전 슬라이드·낙사·점수·무적 문구는 남기지 않는다.

### I03. 캔버스 폰트

- Related Files:
  - `public/js/render/draw-hud.js` :: `drawHud`; modify
  - `public/js/render/scene-renderer.js` :: `drawRhythmTargets`; modify
  - `test/render.test.js` :: 폰트와 HUD 텍스트 호출 검증; modify

#### Details

- `draw-hud.js`와 `scene-renderer.js`의 하드코딩된 `Trebuchet MS`를 웹과 같은 폰트 fallback 문자열로 교체한다.
- HUD의 점수·거리·하트·정확도·타겟·효과 이름은 현재 패널 안에서 한 줄로 유지되도록 고정 크기와 패널 폭을 함께 조정한다.
- 리듬 타겟의 L/R 텍스트는 새 폰트로도 원 안에 유지되도록 현재 20px 기준을 보정한다.
- 캔버스 draw 호출이 state를 변형하지 않는 기존 계약을 유지한다.

### I04. UI 테스트

- Related Files:
  - `test/app-flow.test.js` :: 고양이 카드/결과 화면의 텍스트; modify
  - `test/render.test.js` :: 캔버스 폰트와 HUD; modify

#### Details

- 카드 DOM에 5개 stat row만 존재하고 폐기된 label이 포함되지 않는지 확인한다.
- 정적 CSS와 캔버스 draw 호출에 `Pretendard` 우선 fallback이 있는지 확인한다.
- 결과 제목 및 핵심 버튼 텍스트가 줄바꿈 방지 규칙의 대상인지 검증한다.

## Acceptance Criteria

- [ ] 웹 UI와 캔버스 텍스트가 동일한 한국어 폰트 fallback을 사용한다.
- [ ] 주요 제목·버튼·HUD·능력치 라벨이 한 줄로 유지된다.
- [ ] 고양이 카드에 새 5개 능력치만 표시된다.
- [ ] 모바일 카드와 결과 화면에서 텍스트가 잘리거나 의도하지 않게 두 줄로 분리되지 않는다.

## Validation

- `npm test -- --test-name-pattern="cat card|render|HUD|screen|flow"`

## Commit Message

```text
feat(ui): apply Korean game font and five-stat cat cards

Plan: 2026-09-23-font-cat-stats-mouse-formation
Phase: P01-stat-and-font-foundation
Task: T02-font-and-cat-card-ui

- use the shared Korean font fallback across UI and canvas
- keep key labels on one line with responsive sizing
- render only the five confirmed cat stats
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
