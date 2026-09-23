import { EFFECT_TYPES } from "./constants.js";
import { selectZoneForScore } from "./world.js";
import { ZONE_DEFINITIONS } from "./patterns.js";
import { getRhythmSummary } from "./rhythm-targets.js";

function calculateScore({
  mouseCount = 0,
  distanceM = 0,
  activeEffect = null,
  scoreMultiplier = 1,
  rhythmBonusPoints = 0,
  rhythmScoreMultiplier = 1,
}) {
  const mouseMultiplier =
    activeEffect?.type === EFFECT_TYPES.DOUBLE_SCORE ? 2 : 1;
  const baseScore = mouseCount * 10 * mouseMultiplier +
    Math.floor(distanceM) + rhythmBonusPoints;
  return Math.floor(baseScore * scoreMultiplier * rhythmScoreMultiplier);
}

function updateScore(state) {
  const rhythm = getRhythmSummary(state.rhythm);
  state.score = calculateScore({
    mouseCount: state.mouseCount,
    distanceM: state.distanceM,
    activeEffect: state.activeEffect,
    rhythmBonusPoints: rhythm.bonusPoints,
    rhythmScoreMultiplier: rhythm.scoreMultiplier,
  });
  state.zoneId = selectZoneForScore(state.score);
  return state.score;
}

function calculateDifficulty(distanceM, zoneId = "home_day") {
  const distanceMultiplier =
    1.1 + Math.min(2000, Math.max(0, distanceM)) / 2000 * 0.55;
  const zoneMultiplier = ZONE_DEFINITIONS[zoneId]?.difficulty || 1;
  return Math.min(1.65, distanceMultiplier) * zoneMultiplier;
}

export { calculateDifficulty, calculateScore, updateScore };
