const { createServerManifest, PATTERN_VERSION } = require("../game/server-pattern-manifest");
const { contractError, validateEventBatch } = require("../game/event-contract");

const BASE_HEALTH = 5;
const COLLISION_DAMAGE = 1;
const FALL_DAMAGE = 1;
const POSITIVE_EFFECTS = new Set(["magnet", "invincible", "double_score"]);
const EFFECT_ORDER = ["magnet", "invincible", "double_score", "slow_miss"];
const RHYTHM_FIELDS = Object.freeze([
  "rhythmAccuracy",
  "rhythmHitCount",
  "rhythmMissCount",
  "rhythmBonusHits",
  "rhythmBonusPoints",
]);
const CAT_STATS = Object.freeze({
  black: {
    healthRating: 1,
    itemDurationMultiplier: 1,
    magnetRangeMultiplier: 1.2,
    scoreMultiplier: 1,
    fallResistanceMultiplier: 0.9,
    invincibleDurationMultiplier: 1,
  },
  white: {
    healthRating: 3,
    itemDurationMultiplier: 1,
    magnetRangeMultiplier: 1,
    scoreMultiplier: 1,
    fallResistanceMultiplier: 1,
    invincibleDurationMultiplier: 1.2,
  },
  calico: {
    healthRating: 5,
    itemDurationMultiplier: 1,
    magnetRangeMultiplier: 1,
    scoreMultiplier: 1,
    fallResistanceMultiplier: 1.2,
    invincibleDurationMultiplier: 1,
  },
  cheese: {
    healthRating: 3,
    itemDurationMultiplier: 1.2,
    magnetRangeMultiplier: 1,
    scoreMultiplier: 1.2,
    fallResistanceMultiplier: 1,
    invincibleDurationMultiplier: 1,
  },
  mackerel: {
    healthRating: 3,
    itemDurationMultiplier: 0.8,
    magnetRangeMultiplier: 1,
    scoreMultiplier: 1,
    fallResistanceMultiplier: 1.2,
    invincibleDurationMultiplier: 1,
  },
  chaos: {
    healthRating: 3,
    itemDurationMultiplier: 1,
    magnetRangeMultiplier: 1,
    scoreMultiplier: 1.2,
    fallResistanceMultiplier: 1,
    invincibleDurationMultiplier: 1,
  },
});

function maxHealthFor(stats) {
  return BASE_HEALTH + Math.round((stats.healthRating - 3) / 2);
}

function validationError(reason, message) {
  return contractError(reason, message);
}

function effectFromRoll(value) {
  const normalized = Math.min(0.999999, Math.max(0, Number(value) || 0));
  return EFFECT_ORDER[Math.floor(normalized * EFFECT_ORDER.length)];
}

function rhythmSummaryFromEvent(event) {
  const payload = event.payload || {};
  const provided = RHYTHM_FIELDS.some((field) =>
    Object.prototype.hasOwnProperty.call(payload, field),
  );
  if (!provided) {
    return {
      provided: false,
      accuracy: 1,
      multiplier: 1,
      bonusPoints: 0,
    };
  }

  const hitCount = payload.rhythmHitCount ?? 0;
  const missCount = payload.rhythmMissCount ?? 0;
  const bonusHits = payload.rhythmBonusHits ?? 0;
  const attempts = hitCount + missCount;
  const maxAttempts = Math.max(1, Math.ceil(Math.max(0, event.occurredAtMs) / 500) * 3);
  if (attempts > maxAttempts) {
    throw validationError("RHYTHM_COUNT_EXCESSIVE", "Rhythm counts exceed the run duration.");
  }
  const accuracy = payload.rhythmAccuracy ?? 1;
  const multiplier = Math.min(1.2, Math.max(0.8, 0.8 + accuracy * 0.4));
  return {
    provided: true,
    accuracy,
    multiplier,
    bonusHits,
    bonusPoints: payload.rhythmBonusPoints ?? bonusHits * 5,
  };
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
  let health = maxHealthFor(catStats);
  let mouseCount = 0;
  let distanceM = 0;
  let lastDistanceM = 0;
  let score = 0;
  let gameoverSeen = false;
  let depletedAt = null;
  let rhythmSummary = null;

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
      if (activeEffect?.type !== "invincible" && catStats.fallResistanceMultiplier < 1.2) {
        health -= FALL_DAMAGE;
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
          ? 5000 * catStats.itemDurationMultiplier *
            (effectType === "invincible" ? catStats.invincibleDurationMultiplier : 1)
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
      rhythmSummary = rhythmSummaryFromEvent(event);
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
  const baseScore = Math.floor((score + Math.floor(distanceM)) * catStats.scoreMultiplier);
  score = Math.floor(baseScore * rhythmSummary.multiplier) + rhythmSummary.bonusPoints;
  const result = {
    score,
    distanceM,
    mouseCount,
    health,
    manifestVersion: manifest.version,
  };
  if (rhythmSummary.provided) {
    result.rhythmAccuracy = rhythmSummary.accuracy;
    result.rhythmMultiplier = rhythmSummary.multiplier;
    result.rhythmBonusPoints = rhythmSummary.bonusPoints;
  }
  return result;
}

function calculateVerifiedResult(run, events, options = {}) {
  return validateEventStream(run, events, options);
}

module.exports = { calculateVerifiedResult, validateEventStream };
