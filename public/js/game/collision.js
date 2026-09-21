import { EFFECT_TYPES, GAME_CONFIG } from "./constants.js";
import {
  applyEffect,
  getEffectSpeedMultiplier,
  rollGrassEffect,
  updateActiveEffect,
} from "./effects.js";
import { updateScore } from "./scoring.js";

function getPlayerHitbox(state) {
  return {
    x: state.player.x,
    y: state.player.y,
    width: state.player.width,
    height: state.player.height,
  };
}

function getEntityHitbox(entity, state) {
  return {
    x: entity.x - state.worldOffset,
    y: entity.y,
    width: entity.width,
    height: entity.height,
  };
}

function intersects(first, second) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

function emit(onEvent, type, payload) {
  onEvent({ type, payload });
}

function resolveEntityCollisions(
  state,
  entities = state.worldEntities,
  { onEvent = () => {}, now = state.elapsedMs } = {},
) {
  updateActiveEffect(state, now, entities);
  const playerHitbox = getPlayerHitbox(state);
  const effectSpeed = getEffectSpeedMultiplier(state);
  state.effectSpeedMultiplier = effectSpeed;

  for (const entity of entities) {
    if (entity.collected || entity.hitByPlayer) {
      continue;
    }

    if (!intersects(playerHitbox, getEntityHitbox(entity, state))) {
      continue;
    }

    if (entity.type === "obstacle") {
      entity.hitByPlayer = true;
      const invincible = state.activeEffect?.type === EFFECT_TYPES.INVINCIBLE;
      const damage = invincible ? 0 : GAME_CONFIG.collisionDamage;
      state.health = Math.max(0, state.health - damage);
      emit(onEvent, "obstacle_collision", {
        entityId: entity.id,
        prevented: invincible,
        damage,
      });
      continue;
    }

    if (entity.type === "mouse") {
      entity.collected = true;
      state.mouseCount += 1;
      emit(onEvent, "mouse_collected", { entityId: entity.id });
      updateScore(state);
      continue;
    }

    if (entity.type === "grass") {
      entity.collected = true;
      const effectType = rollGrassEffect(entity.effectRoll);
      applyEffect(state, effectType, now);
      emit(onEvent, "grass_collected", {
        entityId: entity.id,
        effectType,
      });
      emit(onEvent, effectType + "_activated", {
        effectType,
        expiresAtMs: state.activeEffect.expiresAtMs,
      });
    }
  }

  updateScore(state);
  return state;
}

export {
  getEntityHitbox,
  getPlayerHitbox,
  intersects,
  resolveEntityCollisions,
};
