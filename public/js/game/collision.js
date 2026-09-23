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

function rectanglePolygon(width, height, inset = 0) {
  return [
    { x: inset, y: inset },
    { x: width - inset, y: inset },
    { x: width - inset, y: height - inset },
    { x: inset, y: height - inset },
  ];
}

function getObstaclePolygons(entity) {
  const width = Math.max(1, entity.width);
  const height = Math.max(1, entity.height);
  if (entity.variant === "pot") {
    return [
      [
        { x: width * 0.16, y: height * 0.2 },
        { x: width * 0.84, y: height * 0.2 },
        { x: width * 0.72, y: height },
        { x: width * 0.28, y: height },
      ],
      [
        { x: width * 0.08, y: height * 0.08 },
        { x: width * 0.92, y: height * 0.08 },
        { x: width * 0.84, y: height * 0.24 },
        { x: width * 0.16, y: height * 0.24 },
      ],
    ];
  }
  if (entity.variant === "fence") {
    const postWidth = Math.min(18, width * 0.18);
    const railHeight = Math.min(14, height * 0.35);
    return [
      rectanglePolygon(postWidth, height),
      rectanglePolygon(postWidth, height).map((point) => ({
        ...point,
        x: point.x + width - postWidth,
      })),
      rectanglePolygon(width, railHeight).map((point) => ({
        ...point,
        y: point.y + height - railHeight,
      })),
    ];
  }
  if (entity.variant === "yarn") {
    const radius = Math.min(width, height) * 0.46;
    const centerX = width / 2;
    const centerY = height / 2;
    return [
      Array.from({ length: 8 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 8 - Math.PI / 8;
        return {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        };
      }),
    ];
  }
  return [rectanglePolygon(width, height, Math.min(6, width * 0.06))];
}

function getPolygonAxes(polygon) {
  const axes = [];
  for (let index = 0; index < polygon.length; index += 1) {
    const first = polygon[index];
    const second = polygon[(index + 1) % polygon.length];
    const edgeX = second.x - first.x;
    const edgeY = second.y - first.y;
    const length = Math.hypot(edgeX, edgeY);
    if (length > 0) {
      axes.push({ x: -edgeY / length, y: edgeX / length });
    }
  }
  return axes;
}

function projectPolygon(polygon, axis) {
  const values = polygon.map((point) => point.x * axis.x + point.y * axis.y);
  return { min: Math.min(...values), max: Math.max(...values) };
}

function polygonsIntersect(first, second) {
  const axes = [...getPolygonAxes(first), ...getPolygonAxes(second)];
  return axes.every((axis) => {
    const firstProjection = projectPolygon(first, axis);
    const secondProjection = projectPolygon(second, axis);
    return (
      firstProjection.min <= secondProjection.max &&
      secondProjection.min <= firstProjection.max
    );
  });
}

function obstacleIntersectsPlayer(entity, state) {
  const entityHitbox = getEntityHitbox(entity, state);
  const playerPolygon = rectanglePolygon(
    state.player.width,
    state.player.height,
  ).map((point) => ({
    x: point.x + state.player.x,
    y: point.y + state.player.y,
  }));
  return getObstaclePolygons(entity).some((polygon) =>
    polygonsIntersect(
      polygon.map((point) => ({
        x: point.x + entityHitbox.x,
        y: point.y + entityHitbox.y,
      })),
      playerPolygon,
    ),
  );
}

function findOverlappingGap(state) {
  if (!state.player.isGrounded || state.player.isFalling) {
    return null;
  }
  const playerLeft = state.player.x;
  const playerRight = playerLeft + state.player.width;
  return (state.worldGaps || []).find((gap) => {
    const gapLeft = gap.x - state.worldOffset;
    const gapRight = gapLeft + gap.width;
    return playerLeft < gapRight && playerRight > gapLeft;
  }) || null;
}

function startPlayerFall(state, gap, now, onEvent) {
  state.player.isFalling = true;
  state.player.fallGapId = gap.id;
  state.player.fallVy = 0;
  state.player.vy = 0;
  state.player.isGrounded = false;
  state.player.isSliding = false;
  state.player.jumpsUsed = 0;
  state.player.height = GAME_CONFIG.playerHeight;
  state.player.y = GAME_CONFIG.groundY - state.player.height;

  const invulnerable =
    state.activeEffect?.type === EFFECT_TYPES.INVINCIBLE ||
    state.player.fallRecoveryUntilMs > now;
  const damage = invulnerable ? 0 : GAME_CONFIG.fallDamage;
  state.health = Math.max(0, state.health - damage);
  emit(onEvent, "fall_damage", { gapId: gap.id });
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
  const gap = findOverlappingGap(state);
  if (gap) {
    startPlayerFall(state, gap, now, onEvent);
  }
  if (state.player.isFalling) {
    updateScore(state);
    return state;
  }
  const playerHitbox = getPlayerHitbox(state);
  const effectSpeed = getEffectSpeedMultiplier(state);
  state.effectSpeedMultiplier = effectSpeed;

  for (const entity of entities) {
    if (entity.collected || entity.hitByPlayer) {
      continue;
    }

    const hit =
      entity.type === "obstacle"
        ? obstacleIntersectsPlayer(entity, state)
        : intersects(playerHitbox, getEntityHitbox(entity, state));
    if (!hit) {
      continue;
    }

    if (entity.type === "obstacle") {
      entity.hitByPlayer = true;
      const invincible =
        state.activeEffect?.type === EFFECT_TYPES.INVINCIBLE ||
        state.player.fallRecoveryUntilMs > now;
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
      const payload = { entityId: entity.id };
      if (entity.formationKind) {
        payload.formationKind = entity.formationKind;
        payload.formationCell = entity.formationCell;
        if (entity.formationLetter) {
          payload.formationLetter = entity.formationLetter;
        }
      }
      emit(onEvent, "mouse_collected", payload);
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
  getObstaclePolygons,
  getPlayerHitbox,
  startPlayerFall,
  intersects,
  obstacleIntersectsPlayer,
  polygonsIntersect,
  resolveEntityCollisions,
};
