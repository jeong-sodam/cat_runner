# Plan: 러너 1단계·장애물 밀도·2단 점프 패턴

## Goal

캐릭터 선택 화면의 캐릭터 목록만 내부 스크롤되도록 만들고, 첫 번째 러너 구간을 400점부터 외부 구간으로 전환한다. 일반 쥐 인형은 현재 출력량보다 약 1.5배, 진형 생성은 약 30%로 늘린다. 기존 장애물 밀도와 패턴 사이 간격을 조정하고, 첫 구간부터 낮은 빈도로 2단 점프 중심의 새 패턴 3종을 추가한다. 점프력 1 고양이도 높은 장애물을 1단 점프로 간신히 피할 수 있어야 하며, 2단 점프는 추가 여유를 제공해야 한다.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | 캐릭터 선택 패널 내부 세로 스크롤 | [P01](../phases/2026-09-26-runner-stage-density-double-jump-patterns/P01-character-select-scroll/phase.md) |
| P02 | `done` | 첫 구간 전환 기준과 쥐 인형 밀도 조정 | [P02](../phases/2026-09-26-runner-stage-density-double-jump-patterns/P02-stage-mouse-density/phase.md) |
| P03 | `done` | 장애물 밀도와 2단 점프 패턴 3종 추가 | [P03](../phases/2026-09-26-runner-stage-density-double-jump-patterns/P03-obstacle-double-jump-patterns/phase.md) |

## Decision Source

- [확정 결정 문서](../decisions/2026-09-26-runner-stage-density-double-jump-patterns.md)

## Global Constraints

- 구현은 `.memory/current.md`가 가리키는 Task 하나씩만 진행한다.
- 기존 로컬 기록/순위표, osu 입력, 낙사, 피격범위, 폰트 및 무스크롤 UI 회귀를 만들지 않는다.
- 기존 랜덤 스트림의 동일 seed 결정성을 유지한다.
- 기존 장애물과 새 장애물 모두 `isValidPattern` 안전 검증을 통과해야 한다.
- 구현 후 `npm test`를 실행한다. 환경상 Node test runner의 spawn 권한 오류가 재현되면 해당 오류를 기록하고, 가능한 개별 테스트 파일 명령으로 추가 검증한다.
