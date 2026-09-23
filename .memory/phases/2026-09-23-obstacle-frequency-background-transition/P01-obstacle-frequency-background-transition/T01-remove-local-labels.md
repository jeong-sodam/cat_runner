# Task: T01 Remove Local Labels

## Status: done

## Goal

지정된 두 UI 위치에서만 중복 `LOCAL` 표기를 제거하고 HUD 오른쪽 정보 패널의 높이를 정확도·활성 타겟 두 줄에 맞춰 축소한다. 결과 화면과 저장 경고의 `LOCAL` 표기 및 로컬 동작은 변경하지 않는다.

## Decision Summary

- 개인기록표 설명은 `LOCAL 플레이 개인 최고 기록 5개`에서 `개인 최고 기록 5개`로 변경한다.
- HUD에서는 정확도·활성 타겟 아래의 `LOCAL` 한 줄만 제거한다.
- HUD 오른쪽 패널은 기존 `x=230, y=12, width=270, height=142`에서 `height=100`으로 축소한다.
- 정확도 y 좌표 `40`, 타겟 y 좌표 `76`, 패널 x/y/width는 유지한다.
- 결과 화면 배지와 개인기록 저장 경고의 `LOCAL` 텍스트는 유지한다.

## Implementation

### I01. Personal records copy

- Related Files:
  - `public/js/ui/personal-records.js` :: `createPersonalRecordsPanel`, `intro.textContent`; modify

#### Details

- 개인기록표 heading, 표 헤더, 최근 기록, 세션 저장 경고는 변경하지 않는다.
- `intro.textContent`만 `개인 최고 기록 5개`로 변경한다.
- `local-storage-warning`의 세션 저장 안내 문구와 `currentResult.storageWarning` 동작은 그대로 유지한다.

### I02. HUD layout and label removal

- Related Files:
  - `public/js/render/draw-hud.js` :: `drawHud`; modify

#### Details

- 오른쪽 HUD 패널의 정확도 텍스트와 활성 타겟 텍스트는 그대로 렌더링한다.
- 세 번째 줄의 `LOCAL` `fillText` 호출을 제거한다.
- 오른쪽 패널 높이를 `100`으로 줄여 제거된 줄 아래의 빈 공간을 없앤다.
- 정확도 y 좌표 `40`, 타겟 y 좌표 `76`, 패널 x/y/width는 유지한다.
- `state.runMode`나 `state.connectionMode`를 읽어 다른 표기를 추가하지 않는다.

### I03. UI regression tests

- Related Files:
  - `test/app-flow.test.js` :: personal records rendering tests; modify
  - `test/render.test.js` :: HUD local-mode label test; modify

#### Details

- 개인기록표 렌더링 테스트에서 `개인 최고 기록 5개`가 보이고 `LOCAL 플레이`가 보이지 않는지 검증한다.
- 기존 개인기록 행·최근 기록·세션 경고 테스트는 유지한다.
- HUD 렌더링 라벨 목록에 `LOCAL`이 포함되지 않고 `SERVER`도 포함되지 않는지 검증한다.
- fake canvas 호출에서 오른쪽 HUD 패널이 `x=230, y=12, width=270, height=100`으로 그려지는지 검증한다.
- 왼쪽 점수·체력 및 정확도·타겟 라벨의 기존 검증은 유지한다.

## Acceptance Criteria

- [ ] 개인기록표 설명에 `LOCAL`이 표시되지 않는다.
- [ ] 정확도·타겟 아래 HUD 줄에 `LOCAL`이 표시되지 않는다.
- [ ] HUD 오른쪽 패널 높이가 두 줄 정보에 맞게 축소된다.
- [ ] 결과 화면과 저장 경고의 `LOCAL` 표기는 유지된다.

## Validation

- `node --test --test-isolation=none --test-concurrency=1 test/app-flow.test.js`
- `node --test --test-isolation=none --test-concurrency=1 test/render.test.js`

## Commit Message

```text
fix(ui): remove duplicate local labels from records and hud

Plan: 2026-09-23-obstacle-frequency-background-transition
Phase: P01-obstacle-frequency-background-transition
Task: T01-remove-local-labels

- remove LOCAL from personal records copy and HUD status line
- tighten the HUD panel to the remaining two information rows
```

## Progress

- [x] 구현 완료
- [x] 검증 통과 (`node --test --test-isolation=none --test-concurrency=1 test/app-flow.test.js`, `node --test --test-isolation=none --test-concurrency=1 test/render.test.js`)
- commit: pending
