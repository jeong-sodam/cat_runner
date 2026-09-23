import { CAT_DEFINITIONS, EFFECT_TYPES } from "./constants.js";

const POSITIVE_EFFECTS = new Set([
  EFFECT_TYPES.MAGNET,
  EFFECT_TYPES.INVINCIBLE,
  EFFECT_TYPES.DOUBLE_SCORE,
]);

function rollGrassEffect(randomSource) {
  const value =
    typeof randomSource === "function" ? randomSource() : Number(randomSource);
  const normalized = Number.isFinite(value)
    ? Math.min(0.999999, Math.max(0, value))
    : 0;
  const effects = [
    EFFECT_TYPES.MAGNET,
    EFFECT_TYPES.INVINCIBLE,
    EFFECT_TYPES.DOUBLE_SCORE,
    EFFECT_TYPES.SLOW_MISS,
  ];
  return effects[Math.floor(normalized * effects.length)];
}

function applyEffect(state, effectType, now = state.elapsedMs) {
  const cat = CAT_DEFINITIONS[state.catId];
  const isPositive = POSITIVE_EFFECTS.has(effectType);
  const duration = isPositive
    ? 5000 * cat.itemDurationMultiplier
    : 5000;
  state.activeEffect = {
    type: effectType,
    expiresAtMs: now + duration,
  };
  return state.activeEffect;
}

function updateActiveEffect(state, now = state.elapsedMs, entities = []) {
  const cat = CAT_DEFINITIONS[state.catId];
  if (
    state.activeEffect &&
    now >= state.activeEffect.expiresAtMs
  ) {
    state.activeEffect = null;
  }

  if (state.activeEffect?.type === EFFECT_TYPES.MAGNET) {
    const targetX = state.worldOffset + state.player.x;
    for (const entity of entities) {
      if (entity.type !== "mouse" || entity.collected) {
        continue;
      }
      const screenDistance = entity.x - state.worldOffset - state.player.x;
      if (Math.abs(screenDistance) <= 260 * cat.magnetRangeMultiplier) {
        entity.x += (targetX - entity.x) * 0.2;
      }
    }
  }

  return state.activeEffect;
}

function getEffectSpeedMultiplier(state) {
  return state.activeEffect?.type === EFFECT_TYPES.SLOW_MISS ? 0.8 : 1;
}

export {
  applyEffect,
  getEffectSpeedMultiplier,
  rollGrassEffect,
  updateActiveEffect,
};
