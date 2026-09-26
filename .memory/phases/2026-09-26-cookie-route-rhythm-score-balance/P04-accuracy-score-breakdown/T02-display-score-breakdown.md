# Task: T02 결과 화면과 로컬 기록에 정확도 보정 표시

## Status: done

## Goal

달리기 완료 화면과 로컬 개인기록의 최신 기록에서 최종 점수가 오수 정확도에 의해 어떻게 보정되었는지 확인할 수 있게 한다. 정확도, 보정 배율, 최종 점수를 함께 표시하고 local/server 결과 데이터와 저장소 정규화가 이 값을 보존한다.

## Decision Summary

- 결과 화면은 정확도와 보정 배율을 최종 점수와 함께 표시한다.
- local result와 last-result/personal records 저장 시 `rhythmMultiplier`를 보존한다.
- 기존 개인기록 순위 비교는 score 우선 규칙을 유지하며, multiplier는 설명용 필드다.

## Implementation

### I01. result payload and local persistence

- Related Files:
  - `public/js/app/app-controller.js` :: `completeGameover`; modify
  - `public/js/sync/local-run-store.js` :: `normalizeScoreRecord`, `sameScoreRecord`, `saveLocalResult`; modify
  - `src/services/run-service.js` :: completed result fields; read-only/modify if server response omits multiplier

#### Details

- `completeGameover`에서 `getRhythmSummary(completedState.rhythm)`를 한 번 계산해 `rhythmAccuracy`와 `rhythmMultiplier`를 local result와 scoreRecord에 넣는다.
- `normalizeScoreRecord`가 `rhythmMultiplier`를 finite number로 보존하고, 누락된 legacy record는 accuracy가 0이면 0.5, otherwise `0.5 + accuracy`로 보정해 표시값을 채운다.
- `sameScoreRecord`는 기존 rank identity를 유지하되 multiplier 차이만으로 같은 score record가 중복 저장되지 않도록 한다.
- server completed result가 제공하는 `rhythmMultiplier`를 그대로 result screen에 전달한다. 저장 실패/세션 fallback에서도 같은 필드를 잃지 않는다.

### I02. result and personal record UI

- Related Files:
  - `public/js/ui/result-screen.js` :: `createResultScreen`, `addStat`; modify
  - `public/js/ui/personal-records.js` :: `renderLatest`, optional table headers; modify
  - `public/styles.css` :: `.result-stats`, `.result-stat`; modify only if five-stat layout clips or wraps

#### Details

- 결과 stat 영역에 다음 값을 single-line-safe text로 추가한다:
  - `정확도`: `Math.round(rhythmAccuracy * 100) + "%"`
  - `정확도 보정`: `"x" + rhythmMultiplier.toFixed(2)`
  - existing `점수`, `거리`, `쥐 인형` 유지
- missing/legacy multiplier는 `0.5 + normalized accuracy` fallback을 사용하고, NaN/Infinity는 표시하지 않는다.
- 개인기록표의 `방금 기록` 요약에 정확도 보정 배율과 최종 점수를 함께 표시한다. 기존 5개 최고 기록 표의 순위·점수·거리·정확도·날짜 구조는 유지해 폭을 과도하게 늘리지 않는다.
- CSS는 기존 no-scroll/single-line UI 계약을 해치지 않도록 필요한 경우 grid column을 responsive하게 조정하고, 제목·버튼·개인기록표의 기존 텍스트 fitting을 유지한다.

### I03. UI and storage tests

- Related Files:
  - `test/app-flow.test.js` :: result screen, local save, personal records tests; modify/new
  - `test/run-resume.test.js` :: local result persistence and legacy record fixtures; modify
  - `test/text-fitting.test.js` :: result stat text if layout contract changes; modify only if needed

#### Details

- result screen text에 정확도, `x0.50`/`x1.00`/`x1.50`, 최종 점수가 함께 나타나는지 검증한다.
- local save success, storage warning, save failure, last-result, personal-records latest rendering이 multiplier를 유지하는지 확인한다.
- 기존 legacy local record가 crash 없이 읽히고 fallback multiplier가 계산되는지 확인한다.
- server result와 local result가 동일한 multiplier 표기를 사용하며, 개인기록 순위 계산이 multiplier 때문에 바뀌지 않는지 검증한다.

## Acceptance Criteria

- [ ] 완료 화면에 정확도·보정 배율·최종 점수가 함께 표시된다.
- [ ] 개인기록표의 방금 기록에도 보정 배율이 표시된다.
- [ ] local/server/fallback 저장 경로가 `rhythmMultiplier`를 보존한다.
- [ ] 기존 순위 비교·폰트 fitting·무스크롤 UI 회귀가 없다.

## Validation

- `node test/app-flow.test.js`
- `node test/run-resume.test.js`
- `node test/text-fitting.test.js`
- `npm test`

## Commit Message

```text
feat(ui): show rhythm score breakdown

Plan: 2026-09-26-cookie-route-rhythm-score-balance
Phase: P04-accuracy-score-breakdown
Task: T02-display-score-breakdown

- show accuracy multiplier beside the final score
- preserve the breakdown in local records and fallback results
```

## Progress

- [x] 구현 완료
- [x] 검증 통과: app-flow 20/20, run-resume local/legacy 8/8, text-fitting 3/3
- [x] npm test: 122/125 pass; 3 test files fail during better-sqlite3 Windows native cleanup
- commit: recorded in git history
