# Current Context

## Active Plan

[Mayhem 듀얼 입력·난이도](./plans/2026-09-22-mayhem-dual-input-difficulty.md)

## Active Phase

[P01 Mayhem 듀얼 입력·난이도](./phases/2026-09-22-mayhem-dual-input-difficulty/P01-mayhem-dual-input-difficulty/phase.md)

## Active Task

[T03 osu 타겟 엔진](./phases/2026-09-22-mayhem-dual-input-difficulty/P01-mayhem-dual-input-difficulty/T03-rhythm-target-engine.md)

## Status

- T02 구역·장애물 패턴과 클라이언트/서버 v4 parity 완료
- Validation: `npm.cmd test -- test/game-systems.test.js test/score-validation.test.js test/security-regression.test.js`

## Next Step (IMPORTANT)

T03 청사진을 읽고 `public/js/game/rhythm-targets.js`, `public/js/game/state.js`, `public/js/game/scoring.js`, `src/services/run-validation-service.js`에 osu 스타일 타겟 상태·판정·보너스 점수 계약을 구현한다.
