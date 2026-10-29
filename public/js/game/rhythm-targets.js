const RHYTHM_CONFIG = Object.freeze({
  targetLifetimeMs: 1000,
  baseSpawnIntervalMs: 1000,
  baseRadius: 34,
  minRadius: 18,
  targetScale: 1.5625,
  bonusChance: 0.2,
  bonusPoints: 5,
  accuracyMin: 0,
  accuracyMax: 1,
  scoreMultiplierMin: 0.5,
  scoreMultiplierMax: 1.5,
  feedbackDurationMs: 400,
  placement: Object.freeze({
    left: 120,
    right: 120,
    top: 140,
    bottom: 120,
    minimumDistance: 100,
    maxAttempts: 24,
  }),
  zones: Object.freeze({
    home_day: Object.freeze({
      activeCount: 1,
      difficultyScale: 1,
      spawnIntervalMs: 1000,
      targetLifetimeMs: 1000,
    }),
    outside: Object.freeze({
      activeCount: 1,
      difficultyScale: 1.25,
      spawnIntervalMs: 800,
      targetLifetimeMs: 800,
    }),
    home_night: Object.freeze({
      activeCount: 1,
      difficultyScale: 1.5,
      spawnIntervalMs: 600,
      targetLifetimeMs: 600,
    }),
  }),
});

function zoneConfig(zoneId) {
  return RHYTHM_CONFIG.zones[zoneId] || RHYTHM_CONFIG.zones.home_day;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function calculateRhythmScoreMultiplier(accuracy) {
  return clamp(
    0.5 + clamp(Number(accuracy) || 0, 0, 1),
    RHYTHM_CONFIG.scoreMultiplierMin,
    RHYTHM_CONFIG.scoreMultiplierMax,
  );
}

function createRhythmState({ randomSource = Math.random } = {}) {
  const state = {
    targets: [],
    feedbackEvents: [],
    hitCount: 0,
    missCount: 0,
    bonusHitCount: 0,
    bonusPoints: 0,
    nextTargetId: 1,
    lastSpawnAtMs: null,
    lastSpawnPosition: null,
  };
  Object.defineProperty(state, "randomSource", {
    value: randomSource,
    writable: true,
    configurable: true,
    enumerable: false,
  });
  return state;
}

function addFeedbackEvent(state, type, x, y, nowMs) {
  if (!Array.isArray(state.feedbackEvents)) {
    state.feedbackEvents = [];
  }
  const createdAtMs = Number.isFinite(Number(nowMs)) ? Number(nowMs) : 0;
  const event = {
    type,
    x,
    y,
    createdAtMs,
    expiresAtMs: createdAtMs + RHYTHM_CONFIG.feedbackDurationMs,
  };
  state.feedbackEvents.push(event);
  return event;
}

function expireTargets(state, nowMs) {
  for (const target of state.targets) {
    if (target.status === "active" && nowMs >= target.expiresAtMs) {
      target.status = "miss";
      state.missCount += 1;
      addFeedbackEvent(state, "miss", target.x, target.y, nowMs);
    }
  }
}

function targetRadius(config) {
  const scaledBaseRadius = RHYTHM_CONFIG.baseRadius * RHYTHM_CONFIG.targetScale;
  const scaledMinRadius = RHYTHM_CONFIG.minRadius * RHYTHM_CONFIG.targetScale;
  return clamp(
    scaledBaseRadius / config.difficultyScale,
    scaledMinRadius,
    scaledBaseRadius,
  );
}

function placementBounds(radius, canvasWidth, canvasHeight) {
  const width = Math.max(radius * 2, Number(canvasWidth) || 0);
  const height = Math.max(radius * 2, Number(canvasHeight) || 0);
  const preferredMinX = RHYTHM_CONFIG.placement.left;
  const preferredMaxX = width - RHYTHM_CONFIG.placement.right;
  const preferredMinY = RHYTHM_CONFIG.placement.top;
  const preferredMaxY = height - RHYTHM_CONFIG.placement.bottom;
  const drawableMinX = radius;
  const drawableMaxX = width - radius;
  const drawableMinY = radius;
  const drawableMaxY = height - radius;

  return {
    minX: preferredMinX <= preferredMaxX ? preferredMinX : drawableMinX,
    maxX: preferredMinX <= preferredMaxX ? preferredMaxX : drawableMaxX,
    minY: preferredMinY <= preferredMaxY ? preferredMinY : drawableMinY,
    maxY: preferredMinY <= preferredMaxY ? preferredMaxY : drawableMaxY,
  };
}

function spawnTarget(state, { nowMs, config, canvasWidth, canvasHeight }) {
  const radius = targetRadius(config);
  const random = typeof state.randomSource === "function" ? state.randomSource : Math.random;
  const isBonus = random() < RHYTHM_CONFIG.bonusChance;
  const bounds = placementBounds(radius, canvasWidth, canvasHeight);
  const randomCoordinate = (minimum, maximum) => minimum + random() * (maximum - minimum);
  let candidate = null;
  for (let attempt = 0; attempt < RHYTHM_CONFIG.placement.maxAttempts; attempt += 1) {
    const next = {
      x: randomCoordinate(bounds.minX, bounds.maxX),
      y: randomCoordinate(bounds.minY, bounds.maxY),
    };
    candidate = next;
    if (
      !state.lastSpawnPosition ||
      Math.hypot(
        next.x - state.lastSpawnPosition.x,
        next.y - state.lastSpawnPosition.y,
      ) >= RHYTHM_CONFIG.placement.minimumDistance
    ) {
      break;
    }
  }
  const target = {
    id: `rhythm-${state.nextTargetId++}`,
    x: candidate.x,
    y: candidate.y,
    radius,
    button: isBonus ? "secondary" : "primary",
    spawnedAtMs: nowMs,
    expiresAtMs: nowMs + config.targetLifetimeMs,
    status: "active",
  };
  state.targets.push(target);
  state.lastSpawnPosition = { x: target.x, y: target.y };
  state.lastSpawnAtMs = nowMs;
  return target;
}

function updateRhythmTargets(
  state,
  { nowMs = 0, zoneId = "home_day", canvasWidth = 960, canvasHeight = 720 } = {},
) {
  const config = zoneConfig(zoneId);
  expireTargets(state, nowMs);
  if (!Array.isArray(state.feedbackEvents)) {
    state.feedbackEvents = [];
  } else {
    state.feedbackEvents = state.feedbackEvents.filter(
      (event) => Number.isFinite(event?.expiresAtMs) && event.expiresAtMs > nowMs,
    );
  }
  const activeTargets = () => state.targets.filter((target) => target.status === "active").length;
  const initialFill = state.lastSpawnAtMs === null;
  const intervalReady = state.lastSpawnAtMs === null ||
    nowMs - state.lastSpawnAtMs >= config.spawnIntervalMs;
  if ((initialFill || intervalReady) && activeTargets() < config.activeCount) {
    while (activeTargets() < config.activeCount) {
      spawnTarget(state, { nowMs, config, canvasWidth, canvasHeight });
    }
  }
  return state;
}

function resolveRhythmTarget(state, { x, y, button, nowMs = 0 } = {}) {
  expireTargets(state, nowMs);
  const target = state.targets.find((candidate) => {
    if (candidate.status !== "active" || candidate.button !== button) {
      return false;
    }
    return Math.hypot(Number(x) - candidate.x, Number(y) - candidate.y) <= candidate.radius;
  });
  if (!target) {
    return null;
  }
  target.status = "hit";
  state.hitCount += 1;
  addFeedbackEvent(state, "hit", target.x, target.y, nowMs);
  if (target.button === "secondary") {
    state.bonusHitCount += 1;
    state.bonusPoints += RHYTHM_CONFIG.bonusPoints;
  }
  return target;
}

function recordRhythmMisclick(state, { x, y, nowMs = 0 } = {}) {
  state.missCount += 1;
  return addFeedbackEvent(state, "miss", x, y, nowMs);
}

function getRhythmSummary(state = createRhythmState()) {
  const attempts = state.hitCount + state.missCount;
  const accuracy = attempts === 0
    ? 0
    : clamp(state.hitCount / attempts, RHYTHM_CONFIG.accuracyMin, RHYTHM_CONFIG.accuracyMax);
  const scoreMultiplier = calculateRhythmScoreMultiplier(accuracy);
  return {
    accuracy,
    hitCount: state.hitCount,
    missCount: state.missCount,
    bonusHitCount: state.bonusHitCount,
    bonusPoints: state.bonusPoints,
    scoreMultiplier,
  };
}

export {
  RHYTHM_CONFIG,
  calculateRhythmScoreMultiplier,
  createRhythmState,
  getRhythmSummary,
  recordRhythmMisclick,
  resolveRhythmTarget,
  updateRhythmTargets,
};
