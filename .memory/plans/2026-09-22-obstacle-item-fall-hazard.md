# Plan: 장애물·아이템 이미지 개선 및 낙사 위험

## Goal

장애물·쥐 인형·강아지풀을 동화책풍 투명 PNG 에셋으로 교체하되 로드 실패 시 기존 벡터 렌더링을 유지한다. 장애물은 변형별 다각형 피격범위를 사용하고, `outside`와 `home_night`에 결정론적인 바닥 구멍을 생성해 낙하·피해·복귀·서버 이벤트까지 일관되게 처리한다.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `complete` | 아이템 에셋 파이프라인, 장애물 다각형 충돌, 낙사 게임플레이와 서버 권위 이벤트를 구현하고 검증한다. | [P01](../phases/2026-09-22-obstacle-item-fall-hazard/P01-assets-collision-fall/phase.md) |
