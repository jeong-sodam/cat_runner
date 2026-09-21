# Task: T04 결과 화면과 상위 10명 리더보드

## Status: done

## Goal

게임 오버 결과를 서버에 제출하고 점수·거리·개인 순위를 보여주며, 전체 최고 점수 기준 상위 10명을 닉네임과 전체 이메일로 표시하는 대시보드를 완성한다.

## Decision Summary

- 리더보드는 전체 기간 기준 상위 10명만 보여준다.
- 사용자별 최고 점수만 표시한다.
- 닉네임 중복을 허용하므로 이메일도 함께 표시한다.

## Implementation

### I01. Leaderboard API

- Related Files:
  - src/routes/leaderboard-routes.js :: registerLeaderboardRoutes(app, deps); new
  - src/db/repositories/leaderboard-repository.js :: getTopScores(), getRankForUser(); modify

#### Details

- GET /api/leaderboard requiresAuth and returns:
  - { entries: [{ rank, nickname, email, score, distanceM, achievedAt }] }
- Always query limit 10 on the server; ignore larger client limit.
- Join best_scores with users. Use COALESCE(nickname, '이름 없음') only for absent nickname, but normal flow should block game start until nickname exists.
- Order by score DESC, distanceM DESC, achievedAt ASC.
- Email is intentionally full per confirmed decision; never include Entra access token or raw claims.

### I02. Result screen and dashboard UI

- Related Files:
  - public/js/ui/result-screen.js :: createResultScreen(result, callbacks); new
  - public/js/ui/leaderboard.js :: createLeaderboardPanel(apiClient); new
  - public/js/app/main.js :: gameover and dashboard transitions; modify
  - public/styles.css :: result and leaderboard layouts; modify

#### Details

- On run_gameover, flush final events, call complete endpoint, and render score, distance, mouseCount, personal-best message, rank, Restart, and Leaderboard buttons.
- Leaderboard renders top 10 rows with rank, nickname, full email, score, and distance. Use textContent for every server-provided value.
- If completion or leaderboard fetch fails, show retry and local result without claiming a saved rank.
- Restart begins character selection again; it does not reuse the previous cat automatically.

### I03. Integration tests

- Related Files:
  - test/leaderboard.test.js :: top 10 ordering and route response tests; new
  - test/app-flow.test.js :: result and dashboard DOM flow; modify

#### Details

- Seed 12 users and best scores, verify exactly 10 entries and tie order.
- Verify duplicate nicknames render as separate rows distinguished by email.
- Verify a non-top-10 user's result still displays personal rank after completion.
- Verify XSS-like nickname/email strings are rendered as text.

## Acceptance Criteria

- [ ] Game over submits the verified event stream once and shows the returned result.
- [ ] Leaderboard returns exactly up to 10 all-time personal-best entries.
- [ ] Same-score entries are ordered by distance and then earliest achievement.
- [ ] Full email and duplicate nicknames display safely.
- [ ] Restart returns to character selection and leaderboard retry works.

## Validation

- node --test test/leaderboard.test.js test/app-flow.test.js
- npm test

## Commit Message

~~~text
feat(leaderboard): add results screen and top ten dashboard

Plan: 2026-09-21-cat-runner
Phase: P03-run-leaderboard-resume
Task: T04-results-leaderboard-integration

- expose authenticated top ten leaderboard
- submit verified results and show personal rank
- add safe result and leaderboard screens
~~~

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: committed
