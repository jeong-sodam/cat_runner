# Plan: 난이도·장애물 밀도·고양이 점프 연출

## Goal

초반 `home_day`의 학습 난이도는 유지하면서 `outside`부터 기존 장애물 밀도를 `2/2/3`으로 높이고, 6개의 결정론적 복합 장애물 패턴을 추가한다. 기존 에셋만 사용해 점프 상승·하강을 간단히 표현하고, 클라이언트와 서버가 같은 seed·패턴 버전을 재현하도록 한다.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | zone별 장애물 밀도, 복합 패턴, 점프 애니메이션, 서버 매니페스트 parity를 구현한다. | [P01](../phases/2026-09-22-difficulty-obstacle-cat-jump/P01-difficulty-obstacle-cat-jump/phase.md) |
