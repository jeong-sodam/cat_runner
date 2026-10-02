# Cat Runner manual acceptance checklist

Run `npm.cmd install` and `npm.cmd start` without creating or editing `.env`, then open `http://localhost:3000`. Use a fresh browser session when a case says “fresh session”. Record the result of each case before moving to the next one.

## Visual refresh smoke test

- [ ] On a fresh load, no pause modal is visible before the first pause action.
- [ ] Press `P`, confirm the Korean pause panel appears, then press `P` again and confirm the run resumes.
- [ ] Click the on-screen pause button and confirm it has the same behavior as `P`.
- [ ] Confirm auth, nickname, character selection, pause, result, and leaderboard copy is Korean.
- [ ] Confirm all six character cards show distinct preview images and the black card is selected by default.
- [ ] In DevTools Network request blocking, block one `/assets/cat-runner/` image; reload and confirm the affected card or scene remains usable through its fallback.
- [ ] Press `W` during a run and confirm the jump pose; hold `S` on the ground and confirm the slide pose.
- [ ] Inspect the daytime home, outside, and nighttime home zones and confirm their backgrounds differ.
- [ ] Resize to about 500px wide and confirm buttons remain reachable, cards remain selectable, and wide panels/tables scroll instead of clipping actions.

## Authentication and onboarding

- [ ] With no `.env` and no Entra variables configured, start the server and confirm the game shell loads without an ID/configuration error.
- [ ] Choose **로컬로 플레이** and confirm cat selection opens without signing in or creating an account.
- [ ] Choose **로그인** and confirm a development notice says login is planned and local play is available; it must not navigate to a broken login flow.
- [ ] Confirm browser-local play does not call `/auth/guest` or require `ENABLE_GUEST_MODE`.
- [ ] Optional backend-only check: with valid local Entra configuration, exercise the auth endpoints and confirm the callback returns to the game shell.

## Character selection and movement

- [ ] Confirm all six choices are available: black, white, calico, cheese, mackerel, and chaos.
- [ ] Select each cat and confirm its visible speed, jump, slide, item-duration, and health modifiers change as documented on the card.
- [ ] Start a run, press `W`, and verify a jump. Press `W` again while airborne and verify the second jump; holding `W` must not create unlimited jumps.
- [ ] Hold `S` on the ground and verify the cat slides with a shorter hitbox. Release `S` and verify the normal hitbox returns.
- [ ] Hit an obstacle and verify health decreases once. Continue until health reaches zero and verify game over.
- [ ] Pause with `P`, resume with `P`, pause with the on-screen button, and verify simulation time does not advance while paused.

## Collection, effects, scoring, and zones

- [ ] Collect a mouse toy and verify the mouse counter increases and the score gains 10 points.
- [ ] Travel one metre without collecting a mouse and verify distance contributes one point.
- [ ] Collect grass repeatedly and verify each outcome can appear: magnet, invincible, double score, and slow miss/blank effect.
- [ ] While double score is active, collect a mouse and verify its points double while distance points do not.
- [ ] Verify the magnet pulls nearby mouse toys toward the cat.
- [ ] Verify invincibility prevents collision damage and that effects expire.
- [ ] Reach score 1,000 and verify the background changes from the daytime home to the outside area and difficulty increases.
- [ ] Reach score 2,500 and verify the background changes to the nighttime home and difficulty increases again.
- [ ] Adjust music and effects sliders independently, toggle mute, reload, and confirm the settings persist locally.

## Offline and resume behavior

- [ ] Start a browser-local run and confirm a saved snapshot is refreshed during play (about once per second) and on page exit.
- [ ] Reload or reopen the app during an active local run and confirm **이어하기** restores the cat and game state.
- [ ] Choose **새 게임** from the resume prompt and confirm the previous local run is discarded.
- [ ] Confirm a local run remains available without a 24-hour expiry, then finish a run and confirm its active snapshot is cleared.
- [ ] Clear/replace the browser's local storage and confirm browser-local active progress and records are not shared or recoverable from another browser.
- [ ] Optional authenticated-backend check: verify its network/reconnect and server resume behavior independently of browser-local mode.

## Results and leaderboard

- [ ] Finish a browser-local run and confirm its result and personal records appear in that browser without claiming a server rank or shared leaderboard entry.
- [ ] Finish another local run and confirm personal scores persist after reload in the same browser.
- [ ] Confirm the local leaderboard displays only local personal records and does not expose another browser's scores.
- [ ] Optional authenticated-backend check: finish valid server runs and verify server leaderboard behavior below.
- [ ] (Authenticated backend only) Finish a valid server run and verify the result screen shows score, distance, mouse count, personal-best status, and rank.
- [ ] (Authenticated backend only) Finish a better run and verify the personal best is replaced; finish a lower run and verify it does not replace the best.
- [ ] (Authenticated backend only) Add at least 12 users with best scores and verify the dashboard shows no more than 10 entries.
- [ ] (Authenticated backend only) Create equal-score entries and verify ordering is score descending, distance descending, then earliest achievement time.
- [ ] (Authenticated backend only) Confirm duplicate nicknames remain separate because the full email is visible.
- [ ] Enter nickname/email-like strings such as `<img src=x onerror=alert(1)>` and verify they appear as text, never executable HTML.
- [ ] Force a completion failure and verify the local result shows a retry action without claiming a saved rank.
- [ ] Choose Restart from the result screen and verify character selection opens so a new cat can be chosen.

## Responsive and error boundaries

- [ ] Resize to a narrow viewport and verify the 16:9 shell, cat cards, result screen, and leaderboard remain usable without clipped controls.
- [ ] Submit malformed JSON, an oversized request, an invalid cat ID, and an invalid event type; verify stable error codes/messages and no stack or filesystem path leakage.
- [ ] Attempt to access another user’s run events, snapshot, completion, and abandon endpoints; verify each request is rejected.
- [ ] Visit an unknown `/api/*` route and verify JSON `{ error: { code, message, retryable } }` is returned.
