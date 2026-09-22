const { createServerManifest, PATTERN_VERSION } = require("../game/server-pattern-manifest");
const { contractError, validateEventBatch } = require("../game/event-contract");

const MAX_HEALTH = 30;
const COLLISION_DAMAGE = 10;
const POSITIVE_EFFECTS = new Set(["magnet", "invincible", "double_score"]);
const EFFECT_ORDER = ["magnet", "invincible", "double_score", "slow_miss"];
const CAT_STATS = Object.freeze({
  black: { itemDurationMultiplier: 1 },
  white: { itemDurationMultiplier: 1 },
  calico: { itemDurationMultiplier: 1.1 },
  cheese: { itemDurationMultiplier: 1.1 },
  mackerel: { itemDurationMultiplier: 0.9 },
  chaos: { itemDurationMultiplier: 1 },
});

function validationError(reason, message) {
  return contractError(reason, message);
}

function effectFromRoll(value) {
  const normalized = Math.min(0.999999, Math.max(0, Number(value) || 0));
  return EFFECT_ORDER[Math.floor(normalized * EFFECT_ORDER.length)];
}

function validateEventStream(run, events, { clientFinishedAt } = {}) {
  if (!Number.isFinite(clientFinishedAt) || clientFinishedAt < run.startedAt) {
    throw validationError("FINISH_TIME_INVALID", "Client finish time is invalid.");
  }
  const maxOccurredAtMs = clientFinishedAt - run.startedAt + 1000;
  validateEventBatch(events, {
    startingSeq: 0,
    maxOccurredAtMs,
  });
  if (!events.length || events[0].type !== "run_started") {
    throw validationError("RUN_START_MISSING", "The event stream must begin with run_started.");
  }
  const manifest = createServerManifest(run.seed);
  const catStats = CAT_STATS[run.catId] || CAT_STATS.black;
  const collected = new Set();
  const usedGaps = new Set();
  let activeEffect = null;
  let health = MAX_HEALTH;
  let mouseCount = 0;
  let distanceM = 0;
  let lastDistanceM = 0;
  let score = 0;
  let gameoverSeen = false;
  let depletedAt = null;

  function expireEffect(eventTime) {
    if (activeEffect && eventTime >= activeEffect.expiresAtMs) {
      activeEffect = null;
    }
  }

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const payload = event.payload;
    expireEffect(event.occurredAtMs);

    if (health <= 0 && event.type !== "run_gameover") {
      throw validationError("EVENT_AFTER_DEATH", "No event may follow lethal collision before gameover.");
    }
    if (gameoverSeen) {
      throw validationError("EVENT_AFTER_GAMEOVER", "No event may follow run_gameover.");
    }

    if (event.type === "run_started") {
      if (index !== 0 || payload.seed !== run.seed || (payload.catId && payload.catId !== run.catId)) {
        throw validationError("RUN_START_MISMATCH", "run_started does not match the server run.");
      }
      if (payload.patternVersion && payload.patternVersion !== PATTERN_VERSION) {
        throw validationError("PATTERN_VERSION_INVALID", "The client pattern version is not supported.");
      }
      continue;
    }

    if (event.type === "fall_damage") {
      if (
        typeof payload.gapId !== "string" ||
        payload.gapId.length === 0
      ) {
        throw validationError("GAP_INVALID", "fall_damage requires only a gapId.");
      }
      const gap = manifest.getGap(payload.gapId);
      if (!gap) {
        throw validationError("GAP_UNKNOWN", "Fall gap does not exist in the server manifest.");
      }
      if (usedGaps.has(gap.id)) {
        throw validationError("GAP_REPEATED", "A fall gap cannot be used more than once.");
      }
      usedGaps.add(gap.id);
      if (activeEffect?.type !== "invincible") {
        health -= COLLISION_DAMAGE;
        if (health <= 0) {
          health = 0;
          depletedAt = event.occurredAtMs;
        }
      }
      continue;
    }

    if (event.type === "mouse_collected" || event.type === "grass_collected" || event.type === "obstacle_collision") {
      const entityId = payload.entityId;
      const entity = manifest.getEntity(entityId);
      if (!entity) {
        throw validationError("ENTITY_UNKNOWN", "Event entity does not exist in the server manifest.");
      }
      if (collected.has(entityId)) {
        throw validationError("ENTITY_REPEATED", "An entity cannot be used more than once.");
      }
      const expectedType = event.type === "mouse_collected"
        ? "mouse"
        : event.type === "grass_collected" ? "grass" : "obstacle";
      if (entity.type !== expectedType) {
        throw validationError("ENTITY_TYPE_MISMATCH", "Event entity type does not match the event.");
      }
      collected.add(entityId);

      if (event.type === "mouse_collected") {
        mouseCount += 1;
        score += activeEffect?.type === "double_score" ? 20 : 10;
      } else if (event.type === "grass_collected") {
        const effectType = effectFromRoll(entity.effectRoll);
        if (payload.effectType !== effectType) {
          throw validationError("EFFECT_MISMATCH", "Grass effect does not match the server roll.");
        }
        const duration = POSITIVE_EFFECTS.has(effectType)
          ? 5000 * catStats.itemDurationMultiplier
          : 5000;
        activeEffect = {
          type: effectType,
          expiresAtMs: event.occurredAtMs + duration,
        };
      } else {
        const invincible = activeEffect?.type === "invincible";
        if (!invincible) {
          health -= COLLISION_DAMAGE;
          if (health <= 0) {
            health = 0;
            depletedAt = event.occurredAtMs;
          }
        }
      }
      continue;
    }

    if (event.type === "distance_checkpoint") {
      if (!Number.isFinite(payload.distanceM) || payload.distanceM < lastDistanceM) {
        throw validationError("DISTANCE_INVALID", "Distance checkpoints cannot decrease.");
      }
      lastDistanceM = payload.distanceM;
      distanceM = payload.distanceM;
      continue;
    }

    if (event.type === "run_gameover") {
      if (health > 0 || depletedAt === null) {
        throw validationError("GAMEOVER_HEALTH_INVALID", "run_gameover requires a lethal collision.");
      }
      gameoverSeen = true;
      if (index !== events.length - 1) {
        throw validationError("GAMEOVER_NOT_FINAL", "run_gameover must be the final event.");
      }
      continue;
    }
  }

  if (!gameoverSeen) {
    throw validationError("GAMEOVER_MISSING", "A completed run must include run_gameover.");
  }
  score += Math.floor(distanceM);
  return {
    score,
    distanceM,
    mouseCount,
    health,
    manifestVersion: manifest.version,
  };
}

function calculateVerifiedResult(run, events, options = {}) {
  return validateEventStream(run, events, options);
}

module.exports = { calculateVerifiedResult, validateEventStream };
