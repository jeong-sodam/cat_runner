# Plan: Local Mode and osu Ease

## Goal

현재 플레이를 서버 저장 실패 경로에서 분리해 모든 신규 플레이·재개 진입을 LOCAL 게임으로 고정한다. 게임오버 결과는 항상 개인기록표로 이어지게 하고, 브라우저 저장소가 차단되어도 세션 메모리 기록과 경고를 제공한다. 동시에 osu 스타일 타겟은 더 크게 보이고 더 넓게 인정되며, 등장 간격·이동 거리·유지 시간을 완화한다.

## Scope

- 로그인 여부와 무관한 LOCAL 신규 플레이
- 서버 시작·재개 확인·서버 게임오버 저장 호출 차단
- 서버 코드/API와 서버 순위표 화면 보존
- `localStorage` 실패 시 세션 메모리 fallback 및 사용자 경고
- osu 타겟 시각/판정 반지름 25% 확대
- 모든 구역 1,000ms 등장 간격, 최소 거리 100px, 유지 시간 1,000ms

## Non-goals

- 서버 API 제거 또는 서버 순위표 구현
- 로그인·배포용 전체 순위 기능 변경
- 구역별 osu 동시 등장 개수 변경
- 개인기록표 삭제/초기화 기능

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `complete` | LOCAL 실행 경로, 저장 fallback, osu 난이도 완화를 적용한다. | [P01](../phases/2026-09-23-local-mode-osu-ease/P01-local-mode-osu-ease/phase.md) |

## Decision Source

- `.memory/decisions/2026-09-23-local-mode-osu-ease.md`
