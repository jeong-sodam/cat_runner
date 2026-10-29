const GAME_CONFIG = Object.freeze({
  canvasWidth: 1600,
  canvasHeight: 900,
  initialPatternX: 1420,
  groundY: 700,
  baseWorldSpeed: 360,
  gravity: 2400,
  jumpVelocity: -900,
  jumpMultiplier: 1.0,
  maxJumps: 2,
  playerWidth: 90,
  playerHeight: 110,
  slideHeight: 60,
  maxHealth: 5,
  collisionDamage: 1,
  fallDamage: 1,
  fallRecoveryMs: 1000,
  gapMinWidth: 140,
  gapMaxWidth: 220,
  gapSafeMargin: 200,
  gapChanceOutside: 0.2,
  gapChanceHomeNight: 0.3,
  gapWidthOutsideMin: 140,
  gapWidthOutsideMax: 180,
  gapWidthHomeNightMin: 160,
  gapWidthHomeNightMax: 220,
  mouseRouteSpacingMin: 48,
  mouseRouteSpacingMax: 58,
  mouseRouteCount: 7,
  mouseRouteGapLead: 135,
  pixelsPerMeter: 100,
  fixedStepMs: 1000 / 120,
  maxFrameDeltaMs: 50,
});

const CAT_STAT_KEYS = Object.freeze([
  "speed",
  "health",
  "itemDuration",
]);

const SPEED_MULTIPLIERS = Object.freeze({
  1: 0.75,
  2: 0.875,
  3: 1,
  4: 1.15,
  5: 1.3,
});

const ITEM_DURATION_MS_BY_RATING = Object.freeze({
  1: 3000,
  2: 4000,
  3: 5000,
  4: 6500,
  5: 8000,
});

function normalizeRating(rating) {
  return Math.max(1, Math.min(5, Math.round(Number(rating) || 1)));
}

function getSpeedMultiplier(rating) {
  return SPEED_MULTIPLIERS[normalizeRating(rating)];
}

function getItemDurationMs(rating) {
  return ITEM_DURATION_MS_BY_RATING[normalizeRating(rating)];
}

function getMaxHealthForRating(rating) {
  return normalizeRating(rating);
}

const CAT_DEFINITIONS = Object.freeze({
  black: Object.freeze({
    id: "black",
    label: "검정",
    speedMultiplier: getSpeedMultiplier(5),
    itemDurationMs: getItemDurationMs(1),
    statRatings: Object.freeze({ speed: 5, health: 3, itemDuration: 1 }),
    advantage: "이동 속도",
    weakness: "아이템 지속 시간",
  }),
  white: Object.freeze({
    id: "white",
    label: "하양",
    speedMultiplier: getSpeedMultiplier(2),
    itemDurationMs: getItemDurationMs(4),
    statRatings: Object.freeze({ speed: 2, health: 3, itemDuration: 4 }),
    advantage: "아이템 지속 시간",
    weakness: "이동 속도",
  }),
  calico: Object.freeze({
    id: "calico",
    label: "삼색",
    speedMultiplier: getSpeedMultiplier(1),
    itemDurationMs: getItemDurationMs(3),
    statRatings: Object.freeze({ speed: 1, health: 5, itemDuration: 3 }),
    advantage: "체력",
    weakness: "이동 속도",
  }),
  cheese: Object.freeze({
    id: "cheese",
    label: "치즈",
    speedMultiplier: getSpeedMultiplier(3),
    itemDurationMs: getItemDurationMs(3),
    statRatings: Object.freeze({ speed: 3, health: 3, itemDuration: 3 }),
    advantage: "균형 잡힌 능력",
    weakness: "뚜렷한 약점 없음",
  }),
  mackerel: Object.freeze({
    id: "mackerel",
    label: "고등어",
    speedMultiplier: getSpeedMultiplier(4),
    itemDurationMs: getItemDurationMs(2),
    statRatings: Object.freeze({ speed: 4, health: 3, itemDuration: 2 }),
    advantage: "이동 속도",
    weakness: "아이템 지속 시간",
  }),
  chaos: Object.freeze({
    id: "chaos",
    label: "카오스",
    englishName: "Mayhem",
    speedMultiplier: getSpeedMultiplier(5),
    itemDurationMs: getItemDurationMs(3),
    statRatings: Object.freeze({ speed: 5, health: 1, itemDuration: 3 }),
    advantage: "이동 속도",
    weakness: "체력",
  }),
});

const EFFECT_TYPES = Object.freeze({
  MAGNET: "magnet",
  INVINCIBLE: "invincible",
  DOUBLE_SCORE: "double_score",
  SLOW_MISS: "slow_miss",
});

const GAME_STATUSES = Object.freeze({
  READY: "ready",
  RUNNING: "running",
  PAUSED: "paused",
  GAMEOVER: "gameover",
});

export {
  CAT_DEFINITIONS,
  CAT_STAT_KEYS,
  EFFECT_TYPES,
  GAME_CONFIG,
  GAME_STATUSES,
  SPEED_MULTIPLIERS,
  ITEM_DURATION_MS_BY_RATING,
  getItemDurationMs,
  getMaxHealthForRating,
  getSpeedMultiplier,
};
