# Task: T01 Pretendard 로컬 폰트 로딩

## Status: done

## Goal

실제 폰트 파일이 없는 상태에서 이름만 지정되어 있던 Pretendard를 프로젝트 정적 자산으로 포함하고, 앱의 주요 화면이 폰트 로딩 완료 후 렌더링되도록 초기 부트스트랩 순서를 보완한다. 네트워크가 없어도 동일한 글꼴을 사용하고, `document.fonts`를 지원하지 않는 테스트·구형 환경에서는 정상적으로 즉시 진행해야 한다.

## Decision Summary

- Pretendard Variable `woff2` 한 개를 로컬 자산으로 사용한다.
- 폴백 순서는 `Noto Sans KR` → `맑은 고딕` → `system-ui` 등 시스템 폰트다.
- 폰트 로딩은 기존 로딩 화면을 표시한 뒤 인증·캐릭터 선택 화면으로 넘어가기 전에 기다린다.
- 로딩 실패나 `document.fonts` 미지원은 앱 시작을 막지 않는다.

## Implementation

### I01. Pretendard 웹폰트 자산과 CSS 선언

- Related Files:
  - `public/assets/fonts/PretendardVariable.woff2` :: 공식 Pretendard Variable 정적 자산을 저장; new binary asset
  - `public/styles.css` :: `@font-face` 및 전역 폰트 스택; modify

#### Details

- `public/assets/fonts/PretendardVariable.woff2`는 한글 글리프를 포함한 Pretendard Variable 파일이어야 한다.
- `@font-face` 선언은 다음 계약을 따른다.
  - `font-family: "Pretendard"`
  - `src: url("/assets/fonts/PretendardVariable.woff2") format("woff2")`
  - `font-style: normal`
  - `font-weight: 100 900`
  - `font-display: block`으로 초기 다른 폰트와의 레이아웃 점프를 방지
- `:root`와 `body`, 폼 컨트롤, 버튼이 동일한 스택을 상속하도록 현재 전역 선언을 정리한다.
- 폴백은 정확히 `"Pretendard", "Noto Sans KR", "Malgun Gothic", system-ui, sans-serif` 순서를 유지한다.
- 캔버스 폰트 상수도 같은 스택을 사용하도록 T02의 렌더링 계약과 맞춘다.

### I02. 폰트 준비 대기 유틸리티

- Related Files:
  - `public/js/ui/font-loader.js` :: 폰트 준비 대기 함수; new
  - `test/font-loader.test.js` :: 지원·미지원·실패 시나리오 검증; new

#### Details

- Export signature:

  ```js
  function waitForFonts(documentRef = globalThis.document): Promise<void>
  ```

- `documentRef?.fonts?.ready`가 Promise-like이면 `await`하고, 속성이 없으면 즉시 resolve한다.
- 폰트 준비 Promise가 reject되어도 예외를 호출자에게 전파하지 않고 resolve하여 코드 기반 렌더링 fallback과 인증 화면 진입을 보장한다.
- 유틸리티는 전역 DOM을 직접 생성하거나 네트워크 요청하지 않으며, 주입된 `documentRef`만 읽는다.
- 테스트는 다음을 검증한다.
  1. `fonts.ready`가 해결되기 전 Promise가 완료되지 않는다.
  2. `fonts.ready`가 거부되어도 함수가 완료된다.
  3. `fonts`가 없는 문서에서도 함수가 완료된다.

### I03. 앱 부트스트랩 게이트 연결

- Related Files:
  - `public/js/app/app-controller.js` :: `createAppController`, `bootstrap`; modify
  - `public/js/app/main.js` :: 브라우저 진입점; read-only unless import wiring is required

#### Details

- `app-controller.js`에서 `waitForFonts`를 import한다.
- `bootstrap()`의 순서는 다음을 지킨다.
  1. `setScreen(SCREEN_NAMES.LOADING)` 및 `renderLoadingScreen()` 실행
  2. `await waitForFonts(documentRef)` 실행
  3. 기존 `assetLoader.preload()` 실행
  4. 기존 `/api/me` 인증 흐름 실행
- 폰트 대기는 기존 자산 프리로드와 인증 오류 처리의 의미를 변경하지 않는다.
- 테스트용 `documentRef`가 `fonts`를 제공하지 않아도 기존 앱 플로우가 통과해야 한다.

## Acceptance Criteria

- [ ] Pretendard Variable 파일이 `public/assets/fonts/PretendardVariable.woff2`에 존재한다.
- [ ] CSS의 `@font-face`와 폴백 스택이 로컬 파일을 가리킨다.
- [ ] 인증·캐릭터 선택 화면은 폰트 준비 Promise가 해결된 뒤 표시된다.
- [ ] 폰트 API 부재·로딩 실패가 앱 시작 실패로 이어지지 않는다.

## Validation

- `node --test test/font-loader.test.js test/app-flow.test.js`
- `rg -n "@font-face|PretendardVariable|waitForFonts|fonts\.ready" public/styles.css public/js test`

## Commit Message

```text
feat(ui): load Pretendard locally before app screens

Plan: 2026-09-23-font-clipping-font-application
Phase: P01-font-loading-responsive-layout
Task: T01-local-font-loading

- add the local Pretendard variable font asset and fallback declaration
- gate initial app rendering on safe font readiness
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: 3c8e50d
