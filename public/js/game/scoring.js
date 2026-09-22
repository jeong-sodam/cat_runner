import { CAT_DEFINITIONS, EFFECT_TYPES } from "./constants.js";
import { selectZoneForScore } from "./world.js";
import { ZONE_DEFINITIONS } from "./patterns.js";

function calculateScore({
  mouseCount = 0,
  distanceM = 0,
  activeEffect = null,
  scoreMultiplier = 1,
}) {
  const mouseMultiplier =
    activeEffect?.type === EFFECT_TYPES.DOUBLE_SCORE ? 2 : 1;
  const baseScore = mouseCount * 10 * mouseMultiplier + Math.floor(distanceM);
  return Math.floor(baseScore * scoreMultiplier);
}

function updateScore(state) {
  state.score = calculateScore({
    mouseCount: state.mouseCount,
    distanceM: state.distanceM,
    activeEffect: state.activeEffect,
    scoreMultiplier: CAT_DEFINITIONS[state.catId]?.scoreMultiplier || 1,
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
