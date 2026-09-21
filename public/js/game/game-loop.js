import {
  CAT_DEFINITIONS,
  GAME_CONFIG,
  GAME_STATUSES,
} from "./constants.js";
import { updateActiveEffect, getEffectSpeedMultiplier } from "./effects.js";
import { calculateDifficulty, updateScore } from "./scoring.js";
import { transitionGameState } from "./state.js";

function defaultClock() {
  return {
    now: () => performance.now(),
    requestFrame: (callback) => requestAnimationFrame(callback),
    cancelFrame: (frameId) => cancelAnimationFrame(frameId),
  };
}

function difficultyMultiplier(distanceM, zoneId = "home_day") {
  return calculateDifficulty(distanceM, zoneId);
}

function createGameLoop({
  state,
  input,
  onStateChange = () => {},
  onEvent = () => {},
  onStep = () => {},
  clock = defaultClock(),
}) {
  let frameId = null;
  let running = false;
  let accumulatorMs = 0;
  let previousTime = null;
  let lastCheckpoint = Math.floor(state.distanceM);

  function emit(type, payload = {}) {
    onEvent({
      type,
      occurredAtMs: Math.round(state.elapsedMs),
      payload,
    });
  }

  function notify() {
    onStateChange(state);
  }

  function simulateStep(stepMs) {
    if (state.status !== GAME_STATUSES.RUNNING) {
      return;
    }

    const dt = stepMs / 1000;
    const cat = CAT_DEFINITIONS[state.catId];
    updateActiveEffect(state, state.elapsedMs, state.worldEntities);
    const speed = difficultyMultiplier(state.distanceM, state.zoneId);
    const isSliding = input.isSliding() && state.player.isGrounded;
    const jumpPressed = input.consumeJumpPress();

    if (jumpPressed && state.player.jumpsUsed < GAME_CONFIG.maxJumps) {
      state.player.height = GAME_CONFIG.playerHeight;
      state.player.y = GAME_CONFIG.groundY - state.player.height;
      state.player.vy = GAME_CONFIG.jumpVelocity * cat.jumpMultiplier;
      state.player.isGrounded = false;
      state.player.isSliding = false;
      state.player.jumpsUsed += 1;
      emit("player_jump", { jumpsUsed: state.player.jumpsUsed });
    }

    if (!state.player.isGrounded) {
      state.player.vy += GAME_CONFIG.gravity * dt;
      state.player.y += state.player.vy * dt;
      state.player.height = GAME_CONFIG.playerHeight;
      state.player.isSliding = false;

      if (state.player.y + state.player.height >= GAME_CONFIG.groundY) {
        state.player.y = GAME_CONFIG.groundY - state.player.height;
        state.player.vy = 0;
        state.player.isGrounded = true;
        state.player.jumpsUsed = 0;
      }
    }

    if (state.player.isGrounded) {
      state.player.isSliding = isSliding;
      state.player.height = isSliding
        ? GAME_CONFIG.slideHeight
        : GAME_CONFIG.playerHeight;
      state.player.y = GAME_CONFIG.groundY - state.player.height;
    }

    const slideMultiplier = state.player.isSliding
      ? cat.slideMultiplier
      : 1;
    state.worldSpeed =
      GAME_CONFIG.baseWorldSpeed *
      cat.speedMultiplier *
      speed *
      slideMultiplier *
      getEffectSpeedMultiplier(state);
    state.worldOffset += state.worldSpeed * dt;
    state.elapsedMs += stepMs;
    state.distanceM = state.worldOffset / GAME_CONFIG.pixelsPerMeter;

    const checkpoint = Math.floor(state.distanceM);
    while (lastCheckpoint < checkpoint) {
      lastCheckpoint += 1;
      emit("distance_checkpoint", { distanceM: lastCheckpoint });
    }

    onStep(state, stepMs);
    updateScore(state);

    if (state.health <= 0) {
      state.health = 0;
      transitionGameState(state, GAME_STATUSES.GAMEOVER);
      emit("run_gameover", { distanceM: state.distanceM });
    }
  }

  function advance(frameDeltaMs) {
    const clampedDelta = Math.min(
      Math.max(0, frameDeltaMs),
      GAME_CONFIG.maxFrameDeltaMs,
    );
    accumulatorMs += clampedDelta;
    while (accumulatorMs >= GAME_CONFIG.fixedStepMs) {
      simulateStep(GAME_CONFIG.fixedStepMs);
      accumulatorMs -= GAME_CONFIG.fixedStepMs;
    }
    notify();
  }

  function frame(now) {
    if (!running) {
      return;
    }
    if (previousTime === null) {
      previousTime = now;
    }
    advance(now - previousTime);
    previousTime = now;
    frameId = clock.requestFrame(frame);
  }

  function start() {
    if (state.status === GAME_STATUSES.READY) {
      transitionGameState(state, GAME_STATUSES.RUNNING);
    }
    if (!running) {
      running = true;
      previousTime = null;
      frameId = clock.requestFrame(frame);
      notify();
    }
  }

  function pause() {
    if (state.status === GAME_STATUSES.RUNNING) {
      transitionGameState(state, GAME_STATUSES.PAUSED);
      notify();
    }
  }

  function resume() {
    if (state.status === GAME_STATUSES.PAUSED) {
      transitionGameState(state, GAME_STATUSES.RUNNING);
      previousTime = null;
      notify();
    }
  }

  function togglePause() {
    if (state.status === GAME_STATUSES.PAUSED) {
      resume();
    } else if (state.status === GAME_STATUSES.RUNNING) {
      pause();
    }
  }

  function stop() {
    running = false;
    if (frameId !== null) {
      clock.cancelFrame(frameId);
      frameId = null;
    }
    previousTime = null;
    accumulatorMs = 0;
    if (state.status === GAME_STATUSES.PAUSED) {
      transitionGameState(state, GAME_STATUSES.READY);
    }
    notify();
  }

  function destroy() {
    stop();
  }

  return {
    start,
    pause,
    resume,
    togglePause,
    stop,
    destroy,
    advance,
    getState: () => state,
  };
}

export { createGameLoop, difficultyMultiplier };
