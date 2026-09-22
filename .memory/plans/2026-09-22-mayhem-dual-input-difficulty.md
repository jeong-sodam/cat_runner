# Plan: Mayhem 듀얼 입력·난이도 상향

## Goal

`chaos` 고양이의 서버 연결 실패 원인을 추적 가능한 형태로 수정하고 표시용 영문명은 `Mayhem`으로 유지한다. 모든 zone의 장애물·속도 난이도를 상향하고 9종 수치형 고양이 능력치와 4~6칸 체력을 도입한다. 기존 키보드 러너를 유지하면서 Canvas 위에 osu 스타일 마우스 타겟을 추가하고, 정확도 기반 점수 배율·보너스 점수·서버 검증·로컬 플레이 fallback까지 연결한다.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | 고양이 능력치·체력·난이도·장애물 패턴·osu 듀얼 입력·연결 fallback·서버 검증을 완료한다. | [P01](../phases/2026-09-22-mayhem-dual-input-difficulty/P01-mayhem-dual-input-difficulty/phase.md) |

## Dependencies and Risk Notes

- 기존 `catId: "chaos"`와 `/assets/cat-runner/cats/chaos.png` 경로는 유지한다. 표시용 `englishName: "Mayhem"`만 추가한다.
- 클라이언트와 서버가 공유하는 장애물 패턴은 반드시 동일한 PRNG 소비 순서와 entity/gap ID를 유지해야 한다.
- osu 타겟은 브라우저 `Math.random()` 기반이므로 서버는 타겟을 재현하지 않는다. 서버는 최종 정확도 범위, 보너스 횟수 상한, 최종 배율 상한만 검증한다.
- 기존 authenticated run은 서버 연결을 먼저 확인한 뒤 시작한다. 사용자가 명시적으로 로컬 플레이를 선택한 경우에만 서버 동기화를 만들지 않는다.
- `npm.cmd test` 전체 suite의 `run-resume.test.js` better-sqlite3 native cleanup abort는 기존 환경 문제로 별도 기록한다.
