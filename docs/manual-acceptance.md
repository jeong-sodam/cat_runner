# Cat Runner manual acceptance checklist

Run the app locally with `npm.cmd install` and `npm.cmd start`, open `http://localhost:3000`, and use a fresh browser session when a case says “fresh session”. Record the result of each case before moving to the next one.

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

- [ ] With valid local Entra configuration, select Sign in and confirm the callback returns to the game shell.
- [ ] Select sign out, then confirm `/api/me` reports an unauthenticated session and the shell shows Sign in again.
- [ ] With Entra variables absent, start the server and confirm the setup guidance appears without a client secret, token, or stack trace.
- [ ] On first sign-in, enter a nickname and confirm the character-selection screen opens.
- [ ] Sign in as a second user and enter the same nickname; confirm duplicate nicknames are accepted and accounts remain distinguishable by email.

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

- [ ] Start a run, disable network access, and verify the game pauses with a reconnect message while local events/snapshot state are retained.
- [ ] Restore network access and verify synchronization completes and the game resumes.
- [ ] Reload during an active run within 24 hours, sign in as the same user, and verify a resume prompt restores the saved cat, seed, snapshot, and event position.
- [ ] Choose a new run from the resume prompt and verify the previous active run is abandoned.
- [ ] Advance the test clock or wait until the 24-hour expiry, reload, and verify an expired run is not offered for resume.

## Results and leaderboard

- [ ] Finish a valid run and verify the result screen shows score, distance, mouse count, personal-best status, and rank.
- [ ] Finish a better run and verify the personal best is replaced; finish a lower run and verify it does not replace the best.
- [ ] Add at least 12 users with best scores and verify the dashboard shows no more than 10 entries.
- [ ] Create equal-score entries and verify ordering is score descending, distance descending, then earliest achievement time.
- [ ] Confirm duplicate nicknames remain separate because the full email is visible.
- [ ] Enter nickname/email-like strings such as `<img src=x onerror=alert(1)>` and verify they appear as text, never executable HTML.
- [ ] Force a completion failure and verify the local result shows a retry action without claiming a saved rank.
- [ ] Choose Restart from the result screen and verify character selection opens so a new cat can be chosen.

## Responsive and error boundaries

- [ ] Resize to a narrow viewport and verify the 16:9 shell, cat cards, result screen, and leaderboard remain usable without clipped controls.
- [ ] Submit malformed JSON, an oversized request, an invalid cat ID, and an invalid event type; verify stable error codes/messages and no stack or filesystem path leakage.
- [ ] Attempt to access another user’s run events, snapshot, completion, and abandon endpoints; verify each request is rejected.
- [ ] Visit an unknown `/api/*` route and verify JSON `{ error: { code, message, retryable } }` is returned.
