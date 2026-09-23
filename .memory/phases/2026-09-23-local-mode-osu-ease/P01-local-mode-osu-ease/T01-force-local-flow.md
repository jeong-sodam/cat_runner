# Task: T01 Force Local Flow

## Status: done

## Goal

로그인 상태나 서버 연결 여부와 무관하게 캐릭터 선택에서 시작하는 모든 신규 플레이를 LOCAL 모드로 실행한다. 기존 서버 시작·재개·동기화 코드는 삭제하지 않되 현재 UI 흐름에서 호출하지 않으며, 게임오버 결과가 서버 저장 실패 화면으로 빠지지 않도록 한다.

## Decision Summary

- `startGame`은 항상 `runMode: "local"`로 `initializeGame`을 호출한다.
- 캐릭터 선택 화면은 서버 재개 확인과 재개 팝업을 호출하지 않는다.
- 서버 API·`runSync` 모듈은 추후 배포를 위해 유지하지만 현재 신규 플레이 경로에서는 사용하지 않는다.
- 서버 `순위표` 버튼과 서버 모드 화면은 유지한다.

## Implementation

### I01. 신규 플레이와 재개 진입 차단

- Related Files:
  - `public/js/app/app-controller.js` :: `showCharacterSelect`, `checkForResume`, `startGame`, `initializeGame`, `SCREEN_NAMES`; modify
  - `public/js/ui/character-select.js` :: 현재 선택 콜백 계약; read-only unless test adjustment is required

#### Details

- `showCharacterSelect({ allowResume = true } = {})`의 기존 호출 호환성은 유지하되, 현재 동작에서는 `setupRunSync()`와 `checkForResume()`를 호출하지 않는다. `allowResume`는 무시하거나 향후 서버 모드 플래그를 위한 내부 호환값으로만 둔다.
- `startGame(catId, runOptions = {})`는 인증 사용자 여부와 `runOptions.runMode`, `runOptions.resumed`를 검사해 서버 시작으로 분기하지 않는다. 항상 다음 의미의 초기화를 사용한다.
  ```js
  startGame(catId, runOptions) -> initializeGame(catId, {
    ...runOptions,
    runMode: "local",
    resumed: false,
    snapshot: undefined,
  })
  ```
- LOCAL 고정으로 인해 서버 `startRun`을 호출하지 않고 `state.runMode`와 `gameState.runMode`를 모두 `"local"`로 만든다. 기존 `runApiClient`, `runSync`, `setupRunSync`, 서버 재개 함수는 삭제하지 않는다.
- `initializeGame`의 기존 `runMode`/`connectionMode` 상태 필드는 유지하되, T01 경로에서 항상 local 값을 받는다.
- `showStartFailure`와 로컬 플레이 선택 버튼은 서버 기능 보존을 위해 남겨두지만 신규 시작에서 도달하지 않아야 한다.
- `completeGameover`는 LOCAL 상태로 진입하므로 서버 `completeRun`, `runSync.flush`, 서버 이벤트 저장이 실행되지 않아야 한다. 기존 서버 branch는 향후 명시적 서버 모드 복구를 위해 코드로 보존한다.
- `SCREEN_NAMES.PERSONAL_RECORDS`와 개인기록표 라우팅은 기존 구현을 유지한다.

### I02. LOCAL 흐름 회귀 테스트

- Related Files:
  - `test/app-flow.test.js` :: 시작·재개·게임오버 흐름 테스트; modify/add

#### Details

- 인증된 상태에서 `startGame("black")`를 호출해도 `runApiClient.startRun`이 호출되지 않고, 완료 후 `state.runMode === "local"`인지 검증한다.
- 일반 캐릭터 선택과 게임오버 후 캐릭터 선택 모두 `getResumableRun`을 호출하지 않고 재개 모달을 만들지 않는지 검증한다.
- 서버 연결 실패를 기다린 뒤 `로컬 플레이`를 누르는 기존 테스트는 유지하되, 정상적인 캐릭터 선택에서도 동일하게 LOCAL로 시작되는지 별도 검증한다.
- LOCAL 게임오버에서 `getLeaderboard`, `completeRun`, `runSync.flush`가 호출되지 않고 `개인기록표` 화면으로 이동할 수 있는지 검증한다.
- 서버 API 객체를 주입해 호출 횟수를 세고, 기존 서버 모듈이 보존된 상태에서 현재 UI 경로만 차단됐음을 검증한다.

## Acceptance Criteria

- [ ] 로그인 사용자도 새 게임을 시작하면 항상 LOCAL 모드다.
- [ ] 캐릭터 선택 화면에서 서버 재개 확인·재개 팝업이 표시되지 않는다.
- [ ] 정상적인 신규 플레이에서 서버 `startRun`이 호출되지 않는다.
- [ ] LOCAL 게임오버가 서버 저장 실패 결과 화면을 만들지 않는다.
- [ ] 서버 API/동기화 모듈 소스는 삭제되지 않는다.

## Validation

- `node --test --test-concurrency=1 test/app-flow.test.js`

## Commit Message

```text
feat(flow): force new runs through local mode

Plan: 2026-09-23-local-mode-osu-ease
Phase: P01-local-mode-osu-ease
Task: T01-force-local-flow

- bypass server start and resume checks for current play
- preserve server modules for future deployment mode
```

## Progress

- [x] 구현 완료
- [x] 검증 통과 (`node --test --test-isolation=none --test-concurrency=1 test/app-flow.test.js`)
- commit: a6d3893
