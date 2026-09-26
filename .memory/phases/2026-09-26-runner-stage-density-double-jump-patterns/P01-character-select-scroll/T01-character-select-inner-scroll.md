# Task: T01 캐릭터 선택 패널 내부 스크롤

## Status: done

## Goal

캐릭터 선택 화면에서 전체 게임 셸이나 다른 화면을 스크롤시키지 않고, `.character-screen` 패널 내부의 캐릭터 목록과 선택 버튼을 세로로 볼 수 있게 한다. 현재 비게임 화면 전체에 적용된 `overflow: hidden` 계약을 유지하면서 캐릭터 선택 패널만 예외로 만든다.

## Decision Summary

- 캐릭터 선택 화면은 게임 셸을 고정한다.
- 스크롤 컨테이너는 캐릭터 선택 패널 내부 하나로 제한한다.
- 카드 크기 축소나 1열 강제는 이 Task의 목표가 아니다.

## Implementation

### I01. 캐릭터 선택 패널 스크롤 규칙

- Related Files:
  - `public/styles.css` :: `.character-screen`, `.wide-card`, `#game-shell[data-screen]:not([data-screen="game"]) .flow-card` 관련 규칙; modify

#### Details

- `.character-screen`에 `min-height: 0`, `max-height: 100%`, `overflow-y: auto`, `overflow-x: hidden`을 적용한다.
- 캐릭터 선택 패널의 내부 콘텐츠가 줄어들 수 있도록 `align-content: start`를 적용한다.
- 기존의 일반 `.wide-card` 및 결과/순위표 화면의 `overflow: hidden` 동작은 유지한다.
- 기존 모바일 미디어 쿼리의 카드 열 수와 카드 축소 규칙은 유지하며, 스크롤바가 생겨도 `start-game-button`과 `local-mode-note`가 패널 콘텐츠 뒤에 가려지지 않도록 패널의 실제 스크롤 콘텐츠에 포함한다.
- 새 규칙은 게임 화면(`data-screen="game"`)의 캔버스 레이아웃에 영향을 주지 않아야 한다.

### I02. 정적 레이아웃 계약 검증

- Related Files:
  - `test/font-layout.test.js` :: `responsive title and body rules avoid clipping contracts` 또는 별도 `character-select-layout` test; modify/new

#### Details

- `public/styles.css`를 읽어 `.character-screen` 규칙이 존재하고 `overflow-y: auto` 또는 동등한 세로 스크롤 계약을 포함하는지 검증한다.
- 비게임 화면 전체 규칙이 여전히 `#screen-root` 및 일반 카드에 `overflow: hidden`을 지정하는지 검증한다.
- `overflow-x: hidden`이 있어 가로 스크롤이 생기지 않는지 계약으로 고정한다.

## Acceptance Criteria

- [ ] 6개 고양이 카드가 긴 화면에서 캐릭터 선택 패널 내부 세로 스크롤로 접근된다.
- [ ] 게임 셸, body, 다른 wide-card 화면에는 새 전역 스크롤이 생기지 않는다.
- [ ] 캐릭터 선택 화면의 시작 버튼과 로컬 모드 안내문은 내부 스크롤 끝에서 접근할 수 있다.
- [ ] 기존 폰트/제목 잘림 방지 테스트가 유지된다.

## Validation

- `npm test -- --test-name-pattern="responsive title|index provides|character"`
- `npm test`

## Commit Message

```text
fix(ui): add inner scroll to character selection

Plan: 2026-09-26-runner-stage-density-double-jump-patterns
Phase: P01-character-select-scroll
Task: T01-character-select-inner-scroll

- keep the game shell fixed while scrolling the character panel
- add static layout coverage for the scoped overflow rule
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
