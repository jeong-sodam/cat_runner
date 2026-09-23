# Plan: 폰트 적용 및 글씨 잘림 개선

## Goal

Pretendard Variable을 로컬 웹폰트로 적용하고, 로그인·게임 HUD·결과 화면·개인기록표·순위표 전체에서 글꼴을 통일한다. 중요 제목은 320px 이상의 화면에서 잘리지 않는 한 줄 표시를 우선하고, 긴 본문은 최대 2줄 범위에서 자연스럽게 줄바꿈하며, 캔버스 HUD 텍스트는 영역 너비에 맞춰 자동 축소한다.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | 로컬 폰트 로딩, 반응형 HTML 텍스트, 캔버스 텍스트 자동 축소 및 검증 | [P01](../phases/2026-09-23-font-clipping-font-application/P01-font-loading-responsive-layout/phase.md) |
