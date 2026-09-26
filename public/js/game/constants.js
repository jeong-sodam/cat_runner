const GAME_CONFIG = Object.freeze({
  canvasWidth: 1600,
  canvasHeight: 900,
  initialPatternX: 1420,
  groundY: 700,
  baseWorldSpeed: 360,
  gravity: 2400,
  jumpVelocity: -900,
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
  mouseRouteSpacingMin: 34,
  mouseRouteSpacingMax: 42,
  mouseRouteCount: 7,
  mouseRouteGapLead: 135,
  pixelsPerMeter: 100,
  fixedStepMs: 1000 / 120,
  maxFrameDeltaMs: 50,
});

const CAT_STAT_KEYS = Object.freeze([
  "jump",
  "speed",
  "health",
  "itemDuration",
  "magnetRange",
]);

const STAT_RATING_MULTIPLIERS = Object.freeze({
  1: 0.8,
  2: 0.9,
  3: 1,
  4: 1.1,
  5: 1.2,
});

function getStatMultiplier(rating) {
  return STAT_RATING_MULTIPLIERS[Math.max(1, Math.min(5, Math.round(rating)))] || 1;
}

function getMaxHealthForRating(rating) {
  return Math.max(1, Math.min(5, Math.round(Number(rating) || 1)));
}

const CAT_DEFINITIONS = Object.freeze({
  black: Object.freeze({
    id: "black",
    label: "검정",
    jumpMultiplier: getStatMultiplier(3),
    speedMultiplier: getStatMultiplier(5),
    itemDurationMultiplier: getStatMultiplier(1),
    magnetRangeMultiplier: getStatMultiplier(4),
    statRatings: Object.freeze({ jump: 3, speed: 5, health: 2, itemDuration: 1, magnetRange: 4 }),
    advantage: "이동 속도·자석 범위",
    weakness: "체력",
  }),
  white: Object.freeze({
    id: "white",
    label: "하양",
    jumpMultiplier: getStatMultiplier(5),
    speedMultiplier: getStatMultiplier(2),
    itemDurationMultiplier: getStatMultiplier(4),
    magnetRangeMultiplier: getStatMultiplier(1),
    statRatings: Object.freeze({ jump: 5, speed: 2, health: 3, itemDuration: 4, magnetRange: 1 }),
    advantage: "점프력·아이템 지속",
    weakness: "자석 범위",
  }),
  calico: Object.freeze({
    id: "calico",
    label: "삼색",
    jumpMultiplier: getStatMultiplier(3),
    speedMultiplier: getStatMultiplier(1),
    itemDurationMultiplier: getStatMultiplier(3),
    magnetRangeMultiplier: getStatMultiplier(3),
    statRatings: Object.freeze({ jump: 3, speed: 1, health: 5, itemDuration: 3, magnetRange: 3 }),
    advantage: "체력",
    weakness: "이동 속도",
  }),
  cheese: Object.freeze({
    id: "cheese",
    label: "치즈",
    jumpMultiplier: getStatMultiplier(1),
    speedMultiplier: getStatMultiplier(2),
    itemDurationMultiplier: getStatMultiplier(5),
    magnetRangeMultiplier: getStatMultiplier(4),
    statRatings: Object.freeze({ jump: 1, speed: 2, health: 3, itemDuration: 5, magnetRange: 4 }),
    advantage: "아이템 지속·자석 범위",
    weakness: "점프력",
  }),
  mackerel: Object.freeze({
    id: "mackerel",
    label: "고등어",
    jumpMultiplier: getStatMultiplier(5),
    speedMultiplier: getStatMultiplier(4),
    itemDurationMultiplier: getStatMultiplier(1),
    magnetRangeMultiplier: getStatMultiplier(3),
    statRatings: Object.freeze({ jump: 5, speed: 4, health: 2, itemDuration: 1, magnetRange: 3 }),
    advantage: "점프력·이동 속도",
    weakness: "아이템 지속",
  }),
  chaos: Object.freeze({
    id: "chaos",
    label: "카오스",
    englishName: "Mayhem",
    jumpMultiplier: getStatMultiplier(1),
    speedMultiplier: getStatMultiplier(5),
    itemDurationMultiplier: getStatMultiplier(4),
    magnetRangeMultiplier: getStatMultiplier(4),
    statRatings: Object.freeze({ jump: 1, speed: 5, health: 1, itemDuration: 4, magnetRange: 4 }),
    advantage: "이동 속도·아이템 지속",
    weakness: "점프력",
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
  STAT_RATING_MULTIPLIERS,
  getMaxHealthForRating,
  getStatMultiplier,
};
