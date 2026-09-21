# Task: T04 일시정지·Web Audio·설정

## Status: done

## Goal

P 키와 화면 버튼으로 게임을 멈추고 재개하며, 배경음악·효과음·음소거·개별 음량 조절을 Web Audio API로 제공한다. 브라우저 autoplay 정책을 지키고 설정을 로컬에 유지한다.

## Decision Summary

- 음악과 효과음 모두 제공한다.
- 초기 사운드는 Web Audio API 생성음이며 추후 파일 provider로 교체 가능하다.
- 배경음악과 효과음 볼륨을 각각 조절한다.

## Implementation

### I01. Audio manager

- Related Files:
  - public/js/audio/audio-manager.js :: createAudioManager(storage); new
  - public/js/audio/sound-provider.js :: createWebAudioProvider(audioContext); new
  - public/js/audio/music-sequencer.js :: createMusicSequencer(provider); new

#### Details

- createAudioManager() exposes unlock(), playSfx(name), startMusic(), stopMusic(), setMusicVolume(value), setSfxVolume(value), setMuted(value), getSettings(), destroy().
- Settings schema: { muted: boolean, musicVolume: number 0..1, sfxVolume: number 0..1 } stored under cat-runner:audio-settings.
- AudioContext is created or resumed only after a user gesture. If unavailable, manager becomes a no-op and does not break the game.
- SFX names: jump, mouse, grass, effect, collision, gameover, pause, resume.
- WebAudio provider uses short oscillator/noise envelopes; music sequencer uses a repeating low-volume melody and does not block the game loop.
- A future file provider can implement the same play(name) and music controls.

### I02. Pause overlay and settings controls

- Related Files:
  - public/js/ui/pause-controller.js :: createPauseController(gameLoop, audioManager); new
  - public/js/ui/settings-panel.js :: createSettingsPanel(audioManager); new
  - public/styles.css :: pause and settings visual states; modify

#### Details

- P and pause button call one idempotent togglePause() function.
- Paused state freezes simulation, suppresses repeated audio ticks, and shows Resume, Restart, Mute, music slider, and SFX slider.
- Restart requires explicit click and resets only the current run state; it does not submit an incomplete score.
- Range inputs have 0..1 step 0.01 and update the audio manager immediately.

### I03. Audio and pause tests

- Related Files:
  - test/audio-pause.test.js :: fake AudioContext, settings, toggle tests; new

#### Details

- Fake provider records calls and confirms paused simulation emits no movement.
- Verify settings round-trip through injected storage.
- Verify audio unlock failure is swallowed and game remains usable.

## Acceptance Criteria

- [x] P and pause button both pause/resume the same game state.
- [x] Music and SFX volumes are independently persisted.
- [x] Mute silences both channels without losing slider values.
- [x] First user interaction unlocks audio; autoplay errors do not crash the app.

## Validation

- node --test test/audio-pause.test.js
- npm test
- Manual: use P and button, reload, verify audio settings persist.

## Commit Message

~~~text
feat(audio): add pause overlay and web audio controls

Plan: 2026-09-21-cat-runner
Phase: P02-game-engine
Task: T04-pause-audio-settings

- add keyboard and button pause controls
- synthesize music and gameplay effects with Web Audio
- persist mute and independent volume settings
~~~

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
