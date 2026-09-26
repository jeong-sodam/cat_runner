import {
  CAT_DEFINITIONS,
  GAME_CONFIG,
  GAME_STATUSES,
  getMaxHealthForRating,
} from "./constants.js";
import { createRhythmState } from "./rhythm-targets.js";

function createGameState({ catId, seed, randomSource } = {}) {
  if (!CAT_DEFINITIONS[catId]) {
    throw new Error("Unknown cat id: " + catId);
  }

  const cat = CAT_DEFINITIONS[catId];
  const playerHeight = GAME_CONFIG.playerHeight;
  const maxHealth = getMaxHealthForRating(cat.statRatings.health);
  return {
    status: GAME_STATUSES.READY,
    catId,
    seed: String(seed),
    elapsedMs: 0,
    distanceM: 0,
    score: 0,
    mouseCount: 0,
    maxHealth,
    health: maxHealth,
    player: {
      x: 240,
      y: GAME_CONFIG.groundY - playerHeight,
      vy: 0,
      width: GAME_CONFIG.playerWidth,
      height: playerHeight,
      isGrounded: true,
      jumpsUsed: 0,
      airSlideUsed: false,
      isSliding: false,
      isFalling: false,
      fallGapId: null,
      fallVy: 0,
      fallRecoveryUntilMs: 0,
    },
    worldOffset: 0,
    worldSpeed: GAME_CONFIG.baseWorldSpeed * cat.speedMultiplier * 1.1,
    zoneId: "home_day",
    worldEntities: [],
    worldGaps: [],
    formationEvent: null,
    nextPatternX: GAME_CONFIG.canvasWidth + 300,
    lastPatternId: null,
    patternIndex: 0,
    activeEffect: null,
    rhythm: createRhythmState({ randomSource }),
    input: {
      leftUnused: false,
      jumpPressed: false,
      slideHeld: false,
    },
  };
}

function resetRunState(state, { catId, seed }) {
  const next = createGameState({ catId, seed });
  Object.keys(state).forEach((key) => {
    delete state[key];
  });
  Object.assign(state, next);
  return state;
}

function transitionGameState(state, nextStatus) {
  const allowed = {
    [GAME_STATUSES.READY]: [GAME_STATUSES.RUNNING],
    [GAME_STATUSES.RUNNING]: [GAME_STATUSES.PAUSED, GAME_STATUSES.GAMEOVER],
    [GAME_STATUSES.PAUSED]: [GAME_STATUSES.RUNNING, GAME_STATUSES.READY],
    [GAME_STATUSES.GAMEOVER]: [],
  };

  if (!allowed[state.status]?.includes(nextStatus)) {
    throw new Error(
      "Invalid game state transition: " + state.status + " -> " + nextStatus,
    );
  }
  state.status = nextStatus;
  return state;
}

export { createGameState, resetRunState, transitionGameState };
