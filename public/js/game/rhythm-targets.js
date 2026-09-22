const RHYTHM_CONFIG = Object.freeze({
  targetLifetimeMs: 750,
  baseSpawnIntervalMs: 750,
  baseRadius: 34,
  minRadius: 18,
  bonusChance: 0.2,
  bonusPoints: 5,
  accuracyMin: 0,
  accuracyMax: 1,
  scoreMultiplierMin: 0.8,
  scoreMultiplierMax: 1.2,
  zones: Object.freeze({
    home_day: Object.freeze({ activeCount: 1, difficultyScale: 1, spawnIntervalMs: 750 }),
    outside: Object.freeze({ activeCount: 2, difficultyScale: 1.5, spawnIntervalMs: 500 }),
    home_night: Object.freeze({ activeCount: 3, difficultyScale: 2, spawnIntervalMs: 375 }),
  }),
});

function zoneConfig(zoneId) {
  return RHYTHM_CONFIG.zones[zoneId] || RHYTHM_CONFIG.zones.home_day;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function createRhythmState({ randomSource = Math.random } = {}) {
  const state = {
    targets: [],
    hitCount: 0,
    missCount: 0,
    bonusHitCount: 0,
    bonusPoints: 0,
    nextTargetId: 1,
    lastSpawnAtMs: null,
  };
  Object.defineProperty(state, "randomSource", {
    value: randomSource,
    writable: true,
    configurable: true,
    enumerable: false,
  });
  return state;
}

function expireTargets(state, nowMs) {
  for (const target of state.targets) {
    if (target.status === "active" && nowMs >= target.expiresAtMs) {
      target.status = "miss";
      state.missCount += 1;
    }
  }
}

function targetRadius(config) {
  return clamp(
    RHYTHM_CONFIG.baseRadius / config.difficultyScale,
    RHYTHM_CONFIG.minRadius,
    RHYTHM_CONFIG.baseRadius,
  );
}

function spawnTarget(state, { nowMs, config, canvasWidth, canvasHeight }) {
  const radius = targetRadius(config);
  const random = typeof state.randomSource === "function" ? state.randomSource : Math.random;
  const width = Math.max(radius * 2, Number(canvasWidth) || 0);
  const height = Math.max(radius * 2, Number(canvasHeight) || 0);
  const isBonus = random() < RHYTHM_CONFIG.bonusChance;
  const target = {
    id: `rhythm-${state.nextTargetId++}`,
    x: radius + random() * Math.max(0, width - radius * 2),
    y: radius + random() * Math.max(0, height - radius * 2),
    radius,
    button: isBonus ? "secondary" : "primary",
    spawnedAtMs: nowMs,
    expiresAtMs: nowMs + RHYTHM_CONFIG.targetLifetimeMs,
    status: "active",
  };
  state.targets.push(target);
  state.lastSpawnAtMs = nowMs;
  return target;
}

function updateRhythmTargets(
  state,
  { nowMs = 0, zoneId = "home_day", canvasWidth = 960, canvasHeight = 720 } = {},
) {
  const config = zoneConfig(zoneId);
  expireTargets(state, nowMs);
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
  if (target.button === "secondary") {
    state.bonusHitCount += 1;
    state.bonusPoints += RHYTHM_CONFIG.bonusPoints;
  }
  return target;
}

function getRhythmSummary(state = createRhythmState()) {
  const attempts = state.hitCount + state.missCount;
  const accuracy = attempts === 0
    ? 1
    : clamp(state.hitCount / attempts, RHYTHM_CONFIG.accuracyMin, RHYTHM_CONFIG.accuracyMax);
  const scoreMultiplier = clamp(
    0.8 + accuracy * 0.4,
    RHYTHM_CONFIG.scoreMultiplierMin,
    RHYTHM_CONFIG.scoreMultiplierMax,
  );
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
  createRhythmState,
  getRhythmSummary,
  resolveRhythmTarget,
  updateRhythmTargets,
};
