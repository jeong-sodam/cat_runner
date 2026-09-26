# Task: T01 정확도 0.5~1.5배 점수 보정과 서버 재계산

## Status: done

## Goal

오수 정확도를 전체 달리기 점수에 선형으로 반영한다. 정확도 0%는 0.5배, 50%는 1.0배, 100%는 1.5배가 되며, 오수 시도 횟수가 0이면 정확도 0%·보정 0.5배로 처리한다. 클라이언트와 서버가 동일한 수식을 사용하고 서버는 hit/miss count로 보정값을 재계산한다.

## Decision Summary

- score multiplier formula는 `0.5 + accuracy`이며 accuracy는 0~1로 clamp한다.
- attempts가 0이면 accuracy는 0이다.
- 최종 score는 `floor((mouseScore + floor(distanceM) + rhythmBonusPoints) * scoreMultiplier * rhythmScoreMultiplier)`로 계산해 정확도 보정을 bonus points에도 적용한다.
- rhythm fields가 없는 legacy server event는 기존 호환을 위해 multiplier 1과 bonus 0을 사용한다.

## Implementation

### I01. client rhythm summary and score

- Related Files:
  - `public/js/game/rhythm-targets.js` :: `RHYTHM_CONFIG`, `getRhythmSummary`; modify/new `calculateRhythmScoreMultiplier`
  - `public/js/game/scoring.js` :: `calculateScore`, `updateScore`; modify

#### Details

- `RHYTHM_CONFIG.scoreMultiplierMin = 0.5`, `scoreMultiplierMax = 1.5`로 변경한다.
- `calculateRhythmScoreMultiplier(accuracy)`는 `clamp(0.5 + clamp(accuracy, 0, 1), 0.5, 1.5)`를 반환한다.
- `getRhythmSummary`는 `attempts === 0 ? 0 : hitCount / attempts`로 accuracy를 계산하고, hit/miss count가 실제 summary source다.
- `calculateScore`는 mouse score·거리·rhythmBonusPoints를 합산한 뒤 cat `DOUBLE_SCORE` multiplier와 rhythm multiplier를 적용한다. 기존 인자 `scoreMultiplier`는 cat/effect용으로 유지한다.
- 반환 score는 기존처럼 integer floor를 사용한다. `updateScore`는 매 tick 같은 summary를 사용해 zone 전환도 새 점수에 맞춘다.
- export 목록에 새 helper를 추가해 테스트와 서버 수식 parity 검증에 사용할 수 있게 한다.

### I02. authoritative server validation

- Related Files:
  - `src/services/run-validation-service.js` :: `rhythmSummaryFromEvent`, `validateEventStream`; modify
  - `src/game/event-contract.js` :: `validateRhythmPayload`; modify only if mismatch validation is needed
  - `src/services/run-service.js` :: completed result rhythm fields; read-only/modify for multiplier propagation

#### Details

- rhythm fields가 제공된 event에서 `hitCount`, `missCount`로 attempts와 accuracy를 다시 계산한다. attempts 0은 accuracy 0, 그 외는 `hitCount / attempts`다.
- payload의 `rhythmAccuracy`가 제공되면 서버 계산값과 허용 오차 `1e-9` 이내인지 확인하고 다르면 `RHYTHM_ACCURACY_MISMATCH` validation error를 반환한다. 최종 multiplier는 payload 값이 아니라 서버 계산값으로 만든다.
- multiplier는 정확히 `0.5 + accuracy`로 계산해 0.5~1.5 범위를 보장한다. legacy event처럼 rhythm field가 전혀 없으면 기존 multiplier 1을 유지한다.
- `calculateVerifiedResult`의 base score와 bonus points 계산을 client `calculateScore`와 동일하게 맞춘다. client/server 모두 bonus points에도 rhythm multiplier가 적용된다.
- 서버 result에 `rhythmAccuracy`, `rhythmMultiplier`, `rhythmBonusPoints`를 유지해 UI에서 표시할 수 있게 한다.

### I03. score and contract regression tests

- Related Files:
  - `test/game-systems.test.js` :: rhythm summary and client score tests; modify/new
  - `test/score-validation.test.js` :: rhythm multiplier and authoritative count tests; modify
  - `test/integration.test.js` :: completed result score/rhythm fields; modify expected values
  - `test/security-regression.test.js` :: forged accuracy mismatch/error response; modify/new

#### Details

- accuracy 0, 0.5, 1의 multiplier가 각각 0.5, 1, 1.5인지 검증한다.
- no-attempt summary가 accuracy 0/multiplier 0.5인지 검증한다.
- same mouse/distance/bonus input에서 client와 server score가 일치하는지 확인한다.
- payload accuracy를 높여 보내도 hit/miss count와 다르면 거부되고, client score/health/distance를 위조해도 server result가 영향을 받지 않는지 검증한다.
- legacy run_gameover payload는 기존 multiplier 1로 처리되는지 유지한다.

## Acceptance Criteria

- [ ] 정확도 0/50/100%가 각각 0.5/1.0/1.5배다.
- [ ] 오수 미시도 결과가 0.5배다.
- [ ] client/server 최종 score 수식과 multiplier가 일치한다.
- [ ] 서버가 hit/miss count 기반으로 정확도를 재계산하고 위조값을 거부한다.
- [ ] legacy rhythm-less event 호환이 유지된다.

## Validation

- `node test/game-systems.test.js`
- `node test/score-validation.test.js`
- `node test/integration.test.js`
- `node test/security-regression.test.js`

## Commit Message

```text
feat(scoring): apply extreme rhythm accuracy weighting

Plan: 2026-09-26-cookie-route-rhythm-score-balance
Phase: P04-accuracy-score-breakdown
Task: T01-apply-accuracy-score-multiplier

- map rhythm accuracy to a 0.5 to 1.5 score multiplier
- recalculate rhythm accuracy authoritatively on the server
```

## Progress

- [x] 구현 완료
- [x] 검증 통과: game-systems 27/27, score-validation 11/11, security 3/3
- [ ] integration: better-sqlite3 Windows native cleanup assertion으로 실행 차단
- commit: recorded in git history
