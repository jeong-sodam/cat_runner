# Task: T03 폰트 및 레이아웃 회귀 검증

## Status: pending

## Goal

로컬 폰트 자산, 폰트 준비 게이트, DOM 제목 fitting, 본문 줄바꿈 규칙, 캔버스 텍스트 fitting을 자동 테스트와 브라우저 확인으로 검증한다. 기존 게임 렌더링·기록 화면·인증 플로우의 동작을 보존한다.

## Decision Summary

- 자동 검증은 현재 프로젝트의 Node built-in test runner를 사용한다.
- DOM 테스트는 기존 FakeDocument 패턴을 사용하고, 실제 폭 측정이 필요한 부분은 순수 fitting 함수의 주입 가능한 측정값으로 검증한다.
- 최종 확인 폭은 최소 320px, 좁은 화면 500px, 태블릿 768px, 데스크톱 1280px로 고정한다.

## Implementation

### I01. 정적 자산·스타일 계약 테스트

- Related Files:
  - `test/font-layout.test.js` :: 폰트 파일·CSS·화면 클래스 계약; new
  - `public/styles.css` :: 검증 대상; read-only in this task
  - `public/index.html` :: viewport meta 및 stylesheet 로딩 검증 대상; read-only in this task

#### Details

- `fs.existsSync`로 `public/assets/fonts/PretendardVariable.woff2`를 확인한다.
- CSS 문자열에 `@font-face`, `PretendardVariable.woff2`, `font-display: block`, 폴백 순서, 20px/28px 관련 반응형 규칙이 있는지 확인한다.
- 제목 규칙에 `text-overflow: ellipsis`가 남아 있지 않고, 본문·카드가 overflow를 숨김으로 잘라내지 않는 계약을 확인한다.
- `index.html`이 `/styles.css`를 로드하고 `viewport` 메타를 포함하는지 확인한다.

### I02. 폰트·DOM fitting 단위 테스트

- Related Files:
  - `test/font-loader.test.js` :: T01 유틸리티 검증; created by T01, extend if needed
  - `test/text-fitting.test.js` :: DOM fitting 함수와 캔버스 fitting 함수; new
  - `test/app-flow.test.js` :: 로딩 게이트와 기존 화면 텍스트 회귀; modify
  - `test/render.test.js` :: HUD 폰트 계열·최소 크기·패널 폭 회귀; modify

#### Details

- DOM fitting 테스트는 긴 제목이 측정 폭을 넘을 때 font size가 감소하고, 최소 20px 아래로 내려가지 않는지 확인한다.
- `ResizeObserver`가 없는 FakeDocument에서도 helper가 throw하지 않는지 확인한다.
- Canvas fitting 테스트 context는 결정적인 `measureText` 구현을 제공하고, 긴 문자열이 max width를 넘을 때 최종 font size가 10px 이상인지 확인한다.
- `drawHud` 호출 후 기존 레이블(점수, 거리, 정확도, 타겟, 효과, 초, 일시정지)이 모두 계속 그려지는지 확인한다.
- 기존 `render.test.js`의 Pretendard 포함 assertion을 새 공통 상수/헬퍼 구조에 맞게 유지한다.
- `app-flow.test.js`에서 `documentRef.fonts.ready`를 pending Promise로 주입해 인증 화면이 Promise 해결 전에는 표시되지 않고, 해결 후 기존 AUTH/CHARACTER_SELECT 플로우로 진행되는지 확인한다.
- 개인기록표·결과 화면의 한국어 제목과 상태 문구, 순위표의 표·방금 기록이 기존 테스트대로 렌더링되는지 확인한다.

### I03. 전체 회귀 및 브라우저 수동 검증

- Related Files:
  - `test/*.test.js` :: 전체 회귀; read-only unless a test needs a deterministic fixture adjustment
  - `public/styles.css`, `public/js/ui/*`, `public/js/render/*` :: 브라우저 확인 대상

#### Details

- `npm test`를 실행해 기존 게임·서버·기록 저장 테스트를 모두 통과시킨다.
- `npm start`로 로컬 서버를 실행하고 다음 화면을 실제 브라우저에서 확인한다.
  1. 로그인: `집 밖으로, 고양이 출동!` 제목과 Entra 로그인 버튼
  2. 캐릭터 선택: 긴 제목과 카드 설명
  3. 게임: 점수·거리·정확도·타겟·효과·일시정지 HUD
  4. 결과: `달리기 완료`, 개인 최고 기록/저장 상태, 버튼 행
  5. 개인기록표: 제목, 5개 기록 표, 방금 기록
  6. 순위표: 탭, 설명, 표, 방금 기록
- DevTools 또는 창 크기 조절로 320×568, 500×800, 768×900, 1280×720 이상에서 좌우 clipping, 제목 ellipsis, 버튼 겹침, 표 접근성을 확인한다.
- 확인 결과와 재현 조건이 있으면 테스트 파일이나 CSS 계약에 반영하고, 단순히 스크린샷만 통과로 간주하지 않는다.

## Acceptance Criteria

- [ ] 새 폰트·fitting 단위 테스트가 통과한다.
- [ ] 기존 `npm test`가 통과한다.
- [ ] 지정한 네 가지 화면 폭에서 중요 제목이 잘리지 않는다.
- [ ] 결과·개인기록표·순위표의 한국어 텍스트가 기존 의미와 버튼 동작을 유지한다.
- [ ] Canvas HUD 텍스트가 패널 밖으로 넘지 않고 게임 입력·렌더링 회귀가 없다.

## Validation

- `node --test test/font-loader.test.js test/text-fitting.test.js test/font-layout.test.js test/render.test.js test/app-flow.test.js`
- `npm test`
- `npm start` 후 브라우저 수동 반응형 확인

## Commit Message

```text
test(ui): verify font loading and responsive text layout

Plan: 2026-09-23-font-clipping-font-application
Phase: P01-font-loading-responsive-layout
Task: T03-font-layout-verification

- cover font readiness, text fitting, and Korean layout contracts
- run full game regression and viewport smoke checks
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending

