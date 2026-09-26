import { GAME_CONFIG } from "./constants.js";
import {
  FORMATION_CELL_SIZE,
  FORMATION_CELL_STEP,
  FORMATION_HEIGHT,
  FORMATION_WIDTH,
  DEX_CHANCE,
  DEX_COOLDOWN_PATTERNS,
  createFormation,
} from "./mouse-formations.js";

const ZONE_DEFINITIONS = Object.freeze({
  home_day: Object.freeze({ id: "home_day", minScore: 0, background: "living-room", difficulty: 1 }),
  outside: Object.freeze({ id: "outside", minScore: 400, background: "alley-park", difficulty: 1.2 }),
  home_night: Object.freeze({ id: "home_night", minScore: 1800, background: "dark-home", difficulty: 1.5 }),
});

const PATTERN_VERSION = "cat-runner-patterns-v9";
const COMPOSITE_SAFE_MARGIN = 120;
const PATTERN_INTERNAL_SCALE = 1.15;

const ZONE_ORDER = Object.freeze({ home_day: 0, outside: 1, home_night: 2 });

function scalePatternX(value, scale) {
  return Number.isFinite(value) ? Math.round(value * scale) : value;
}

function expandPatternHorizontally(pattern, scale = PATTERN_INTERNAL_SCALE) {
  return {
    ...pattern,
    width: scalePatternX(pattern.width, scale),
    gapAnchor: pattern.gapAnchor
      ? { ...pattern.gapAnchor, x: scalePatternX(pattern.gapAnchor.x, scale) }
      : pattern.gapAnchor,
    formationAnchor: pattern.formationAnchor
      ? { ...pattern.formationAnchor, x: scalePatternX(pattern.formationAnchor.x, scale) }
      : pattern.formationAnchor,
    gaps: Array.isArray(pattern.gaps)
      ? pattern.gaps.map((gap) => ({ ...gap, x: scalePatternX(gap.x, scale) }))
      : pattern.gaps,
    entities: (pattern.entities || []).map((entity) => ({
      ...entity,
      x: scalePatternX(entity.x, scale),
    })),
  };
}

function freezeEntity(entity) {
  return Object.freeze({ ...entity });
}

function freezePattern(pattern) {
  const expanded = expandPatternHorizontally(pattern);
  return Object.freeze({
    ...expanded,
    gapAnchor: Object.freeze({ ...expanded.gapAnchor }),
    formationAnchor: Object.freeze({
      x: expanded.formationAnchor?.x ?? expanded.gapAnchor.x,
      y: expanded.formationAnchor?.y ?? 470,
    }),
    gaps: Array.isArray(expanded.gaps)
      ? Object.freeze(expanded.gaps.map((gap) => Object.freeze({ ...gap })))
      : expanded.gaps,
    requiredActions: Object.freeze([...(expanded.requiredActions || [])]),
    actionCandidates: Object.freeze(
      (expanded.actionCandidates || []).map((actions) => Object.freeze([...actions])),
    ),
    entities: Object.freeze(expanded.entities.map(freezeEntity)),
  });
}

const GROUND_ACTIONS = Object.freeze(["jump"]);
const LOW_ACTIONS = Object.freeze(["jump", "slide"]);
const DOUBLE_JUMP_ACTIONS = Object.freeze(["double_jump"]);
const GUIDED_MOUSE_MAX_COUNT = GAME_CONFIG.mouseRouteCount;
const GUIDED_MOUSE_OFFSETS = Object.freeze([-102, -68, -34, 0, 34, 68, 102]);

const PATTERN_LIBRARY = Object.freeze([
  freezePattern({
    id: "jump-basic",
    width: 1200,
    minGap: 240,
    safePath: "jump",
    gapAnchor: { x: 742 },
    entities: [
      { type: "obstacle", x: 420, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "mouse", x: 300, y: 610, width: 42, height: 42, variant: "toy", collectible: true },
      { type: "mouse", x: 500, y: 490, width: 42, height: 42, variant: "toy", collectible: true },
      { type: "obstacle", x: 60, y: 620, width: 90, height: 80, variant: "pot", collectible: false, minZone: "outside" },
      { type: "obstacle", x: 180, y: 620, width: 90, height: 80, variant: "pot", collectible: false, minZone: "outside" },
    ],
  }),
  freezePattern({
    id: "slide-basic",
    width: 1400,
    minGap: 240,
    safePath: "slide",
    gapAnchor: { x: 858 },
    entities: [
      { type: "obstacle", x: 420, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "mouse", x: 280, y: 640, width: 42, height: 42, variant: "toy", collectible: true },
      { type: "grass", x: 610, y: 585, width: 48, height: 72, variant: "cat-grass", collectible: true },
      { type: "obstacle", x: 20, y: 620, width: 90, height: 80, variant: "box", collectible: false, minZone: "outside" },
      { type: "obstacle", x: 140, y: 620, width: 90, height: 80, variant: "box", collectible: false, minZone: "outside" },
    ],
  }),
  freezePattern({
    id: "mixed-safe",
    width: 1400,
    minGap: 260,
    safePath: "mixed",
    gapAnchor: { x: 940 },
    entities: [
      { type: "obstacle", x: 390, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
      { type: "obstacle", x: 610, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
      { type: "mouse", x: 250, y: 600, width: 42, height: 42, variant: "toy", collectible: true },
      { type: "grass", x: 520, y: 600, width: 48, height: 72, variant: "cat-grass", collectible: true },
      { type: "obstacle", x: 20, y: 620, width: 90, height: 80, variant: "box", collectible: false, minZone: "outside" },
      { type: "obstacle", x: 120, y: 620, width: 90, height: 80, variant: "box", collectible: false, minZone: "outside" },
    ],
  }),
  freezePattern({
    id: "double-jump-basic",
    width: 1500,
    minGap: 260,
    family: "double-jump",
    safePath: "jump",
    advancedSafeMargin: 80,
    gapAnchor: { x: 1050 },
    actionCandidates: [GROUND_ACTIONS, DOUBLE_JUMP_ACTIONS],
    entities: [
      { type: "obstacle", x: 300, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 470, y: 600, width: 90, height: 100, variant: "box", collectible: false },
    ],
  }),
  freezePattern({
    id: "double-jump-slide",
    width: 1800,
    minGap: 260,
    family: "double-jump",
    safePath: "mixed",
    advancedSafeMargin: 80,
    gapAnchor: { x: 1250 },
    actionCandidates: [GROUND_ACTIONS, DOUBLE_JUMP_ACTIONS, LOW_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 440, y: 600, width: 90, height: 100, variant: "box", collectible: false },
      { type: "obstacle", x: 700, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
    ],
  }),
  freezePattern({
    id: "slide-double-jump",
    width: 1800,
    minGap: 260,
    family: "double-jump",
    safePath: "mixed",
    advancedSafeMargin: 80,
    gapAnchor: { x: 1250 },
    actionCandidates: [LOW_ACTIONS, GROUND_ACTIONS, DOUBLE_JUMP_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 510, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 690, y: 600, width: 90, height: 100, variant: "box", collectible: false },
    ],
  }),
  freezePattern({
    id: "combo-jump-slide-jump",
    width: 2200,
    minGap: 300,
    minZone: "outside",
    safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN,
    gapAnchor: { x: 1500 },
    actionCandidates: [GROUND_ACTIONS, LOW_ACTIONS, GROUND_ACTIONS, LOW_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 470, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 730, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
      { type: "obstacle", x: 940, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
    ],
  }),
  freezePattern({
    id: "combo-slide-jump-slide",
    width: 2200,
    minGap: 300,
    minZone: "outside",
    safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN,
    gapAnchor: { x: 1500 },
    actionCandidates: [LOW_ACTIONS, GROUND_ACTIONS, LOW_ACTIONS, GROUND_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 520, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 730, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
      { type: "obstacle", x: 980, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
    ],
  }),
  freezePattern({
    id: "combo-jump-jump-slide",
    width: 2200,
    minGap: 300,
    minZone: "outside",
    safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN,
    gapAnchor: { x: 1500 },
    actionCandidates: [GROUND_ACTIONS, GROUND_ACTIONS, LOW_ACTIONS, GROUND_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
      { type: "obstacle", x: 470, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 680, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 940, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
    ],
  }),
  freezePattern({
    id: "combo-slide-slide-jump",
    width: 2200,
    minGap: 300,
    minZone: "outside",
    safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN,
    gapAnchor: { x: 1500 },
    actionCandidates: [LOW_ACTIONS, LOW_ACTIONS, GROUND_ACTIONS, GROUND_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 520, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
      { type: "obstacle", x: 780, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 990, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
    ],
  }),
  freezePattern({
    id: "combo-jump-slide-slide",
    width: 2200,
    minGap: 300,
    minZone: "outside",
    safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN,
    gapAnchor: { x: 1500 },
    actionCandidates: [GROUND_ACTIONS, LOW_ACTIONS, LOW_ACTIONS, GROUND_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
      { type: "obstacle", x: 470, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 730, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
      { type: "obstacle", x: 980, y: 620, width: 90, height: 80, variant: "box", collectible: false },
    ],
  }),
  freezePattern({
    id: "combo-slide-jump-jump",
    width: 2200,
    minGap: 300,
    minZone: "outside",
    safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN,
    gapAnchor: { x: 1500 },
    actionCandidates: [LOW_ACTIONS, GROUND_ACTIONS, GROUND_ACTIONS, LOW_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
      { type: "obstacle", x: 510, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 720, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
      { type: "obstacle", x: 930, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
    ],
  }),
]);

function hashSeed(seed) {
  let hash = 2166136261;
  for (const character of String(seed)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed) {
  let value = hashSeed(seed);
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function zoneRank(zoneId) {
  return ZONE_ORDER[zoneId] ?? ZONE_ORDER.home_day;
}

function isZoneEnabled(minZone, zoneId) {
  return zoneRank(zoneId) >= zoneRank(minZone || "home_day");
}

function isActionSequenceValid(pattern) {
  const obstacles = pattern.entities.filter((entity) => entity.type === "obstacle");
  const actions = pattern.requiredActions || [];
  const candidates = pattern.actionCandidates || [];
  if (!actions.length) {
    return true;
  }
  if (actions.length !== obstacles.length || candidates.length !== obstacles.length) {
    return false;
  }
  if (candidates.some((candidateActions) => !Array.isArray(candidateActions))) {
    return false;
  }
  const safeMargin = pattern.advancedSafeMargin ?? GAME_CONFIG.gapSafeMargin;
  return actions.every((action, index) => candidates[index].includes(action)) &&
    obstacles.every((entity, index) => {
      const next = obstacles[index + 1];
      return !next || next.x - (entity.x + entity.width) >= safeMargin;
    });
}

function adjustJumpSlideSpacing(pattern) {
  const entities = Array.isArray(pattern?.entities) ? pattern.entities : [];
  const obstacles = entities.filter((entity) => entity.type === "obstacle");
  const candidates = pattern?.actionCandidates || [];
  const clonePattern = () => ({
    ...pattern,
    requiredActions: Array.isArray(pattern?.requiredActions)
      ? [...pattern.requiredActions]
      : pattern?.requiredActions,
    actionCandidates: candidates.map((actions) =>
      Array.isArray(actions) ? [...actions] : actions,
    ),
    entities: entities.map((entity) => ({ ...entity })),
  });
  if (obstacles.length < 2 || candidates.length !== obstacles.length) {
    return clonePattern();
  }
  if (candidates.some((actions) => !Array.isArray(actions))) {
    return clonePattern();
  }

  const requiredActions = Array.isArray(pattern.requiredActions)
    ? pattern.requiredActions
    : [];
  const hasRequiredActions = requiredActions.length === obstacles.length;
  const hasJumpSlidePair = (index) => {
    const current = hasRequiredActions
      ? requiredActions[index] === "jump"
      : candidates[index].includes("jump");
    const next = hasRequiredActions
      ? requiredActions[index + 1] === "slide"
      : candidates[index + 1].includes("slide");
    return current && next;
  };
  const jumpSlideIndex = obstacles.findIndex((_, index) =>
    index < obstacles.length - 1 && hasJumpSlidePair(index),
  );
  if (jumpSlideIndex < 0) {
    return clonePattern();
  }
  const firstShiftIndex = jumpSlideIndex + 1;

  let obstacleIndex = 0;
  return {
    ...pattern,
    requiredActions: [...requiredActions],
    actionCandidates: candidates.map((actions) => [...actions]),
    entities: entities.map((entity) => {
      if (entity.type !== "obstacle") {
        return { ...entity };
      }
      const shouldShift = obstacleIndex >= firstShiftIndex;
      obstacleIndex += 1;
      return shouldShift ? { ...entity, x: entity.x + 30 } : { ...entity };
    }),
  };
}

function isValidPattern(pattern) {
  const gapAnchor = pattern.gapAnchor;
  const safeMargin = pattern.advancedSafeMargin ?? GAME_CONFIG.gapSafeMargin;
  const maxGapEnd = (gapAnchor?.x || 0) + GAME_CONFIG.gapMaxWidth;
  const gapSafe = gapAnchor &&
    gapAnchor.x >= safeMargin &&
    maxGapEnd <= pattern.width - safeMargin &&
    pattern.entities.every((entity) =>
      entity.x + entity.width <= gapAnchor.x - safeMargin ||
      entity.x >= maxGapEnd + safeMargin,
    );
  const obstacles = pattern.entities.filter((entity) => entity.type === "obstacle");
  const obstacleSpacing = pattern.advancedSafeMargin == null || obstacles.every((entity, index) => {
    const next = obstacles[index + 1];
    return !next || next.x - (entity.x + entity.width) >= safeMargin;
  });
  return pattern.minGap >= GAME_CONFIG.playerWidth * 1.5 &&
    ["jump", "slide", "mixed"].includes(pattern.safePath) &&
    gapSafe &&
    obstacleSpacing &&
    pattern.entities.every((entity) =>
      Number.isFinite(entity.x) && Number.isFinite(entity.y) &&
      entity.width > 0 && entity.height > 0,
    ) &&
    isActionSequenceValid(pattern);
}

function isFormationAnchorSafe(pattern) {
  const anchor = pattern.formationAnchor;
  if (!anchor || anchor.x < GAME_CONFIG.gapSafeMargin ||
      anchor.x + FORMATION_WIDTH > pattern.width - GAME_CONFIG.gapSafeMargin) {
    return false;
  }
  return pattern.entities.every((entity) =>
    entity.x + entity.width <= anchor.x ||
    entity.x >= anchor.x + FORMATION_WIDTH,
  );
}

function selectPatternCandidate(candidates, random) {
  const doubleJumpPatterns = candidates.filter((pattern) =>
    pattern.family === "double-jump",
  );
  const legacyPatterns = candidates.filter((pattern) =>
    pattern.family !== "double-jump",
  );
  const roll = random();
  if (doubleJumpPatterns.length && (!legacyPatterns.length || roll < 0.2)) {
    const normalized = legacyPatterns.length ? roll / 0.2 : roll;
    return doubleJumpPatterns[Math.min(
      doubleJumpPatterns.length - 1,
      Math.floor(normalized * doubleJumpPatterns.length),
    )];
  }
  const normalized = doubleJumpPatterns.length
    ? (roll - 0.2) / 0.8
    : roll;
  const preferred = legacyPatterns.length ? legacyPatterns : doubleJumpPatterns;
  return preferred[Math.min(
    preferred.length - 1,
    Math.floor(normalized * preferred.length),
  )];
}

function isEntityClearOfGaps(entity, gaps, { allowAirborne = false } = {}) {
  return gaps.every((gap) =>
    entity.x + entity.width <= gap.x - GAME_CONFIG.gapSafeMargin ||
    entity.x >= gap.x + gap.width + GAME_CONFIG.gapSafeMargin ||
    (allowAirborne && entity.y + entity.height <= GAME_CONFIG.groundY - 12),
  );
}

function intersects(first, second) {
  return first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y;
}

function isMouseClearOfObstacles(mouse, obstacles) {
  return obstacles.every((obstacle) => !intersects(mouse, obstacle));
}

function selectRouteObstacle(mouse, obstacles) {
  return obstacles.reduce((closest, obstacle) => {
    if (!closest) {
      return obstacle;
    }
    const closestDistance = Math.abs(mouse.x - (closest.x + closest.width / 2));
    const obstacleDistance = Math.abs(mouse.x - (obstacle.x + obstacle.width / 2));
    return obstacleDistance < closestDistance ? obstacle : closest;
  }, null);
}

function routeYForAction(action, obstacle, progress, mouseHeight) {
  const groundY = GAME_CONFIG.groundY - 90;
  if (action === "slide") {
    return groundY + 30;
  }
  const heightBonus = action === "double_jump" ? 36 : 12;
  const peakY = obstacle
    ? obstacle.y - GAME_CONFIG.playerHeight - mouseHeight - heightBonus
    : groundY - GAME_CONFIG.playerHeight;
  const arc = Math.sin(Math.PI * progress);
  return Math.round(groundY + (peakY - groundY) * arc);
}

function routeActionForPoint(pattern, x, obstacles, gaps) {
  const gap = gaps.find((candidate) =>
    x + 42 > candidate.x - GAME_CONFIG.mouseRouteGapLead &&
    x < candidate.x + candidate.width + GAME_CONFIG.mouseRouteGapLead,
  );
  if (gap) {
    return pattern.gapAction || "jump";
  }
  const obstacle = selectRouteObstacle({ x }, obstacles);
  if (!obstacle) {
    return "ground";
  }
  const distance = Math.abs(x - (obstacle.x + obstacle.width / 2));
  return distance <= GAME_CONFIG.mouseRouteGapLead
    ? resolveGuidedActions(pattern, pattern.requiredActions || [], obstacles)[obstacles.indexOf(obstacle)] || "jump"
    : "ground";
}

function routeYForPoint(pattern, x, obstacles, gaps, mouseHeight) {
  const gap = gaps.find((candidate) =>
    x + mouseHeight > candidate.x - GAME_CONFIG.mouseRouteGapLead &&
    x < candidate.x + candidate.width + GAME_CONFIG.mouseRouteGapLead,
  );
  if (gap) {
    const routeStart = gap.x - GAME_CONFIG.mouseRouteGapLead;
    const routeEnd = gap.x + gap.width + GAME_CONFIG.mouseRouteGapLead;
    const progress = Math.max(0, Math.min(1, (x - routeStart) / (routeEnd - routeStart)));
    return routeYForAction(pattern.gapAction || "jump", null, progress, mouseHeight);
  }
  const obstacle = selectRouteObstacle({ x }, obstacles);
  if (!obstacle || Math.abs(x - (obstacle.x + obstacle.width / 2)) > GAME_CONFIG.mouseRouteGapLead) {
    return GAME_CONFIG.groundY - 90;
  }
  const routeStart = obstacle.x - GAME_CONFIG.mouseRouteGapLead;
  const routeEnd = obstacle.x + obstacle.width + GAME_CONFIG.mouseRouteGapLead;
  const progress = Math.max(0, Math.min(1, (x - routeStart) / (routeEnd - routeStart)));
  const action = routeActionForPoint(pattern, x, obstacles, gaps);
  return routeYForAction(action === "ground" ? "jump" : action, obstacle, progress, mouseHeight);
}

function mouseIdentity(mouse) {
  return `${Math.round(mouse.x)}:${Math.round(mouse.y)}:${mouse.width}:${mouse.height}`;
}

function mouseRectanglesOverlap(first, second) {
  return first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y;
}

function mergeMouseEntities(entities, additions) {
  const preferredAdditions = additions.filter((entity) =>
    entity.type === "mouse" && entity.routeKind === "continuous",
  );
  const retainedEntities = entities.filter((entity) => {
    if (entity.type !== "mouse" || entity.formationId) {
      return true;
    }
    return preferredAdditions.every((addition) =>
      !mouseRectanglesOverlap(entity, addition),
    );
  });
  const identities = new Set(
    retainedEntities.filter((entity) => entity.type === "mouse").map(mouseIdentity),
  );
  return retainedEntities.concat(additions.filter((entity) => {
    const identity = mouseIdentity(entity);
    if (identities.has(identity)) {
      return false;
    }
    identities.add(identity);
    return true;
  }));
}

function createContinuousMouseRoute(pattern, gaps = [], spacing = 38) {
  const entities = Array.isArray(pattern?.entities) ? pattern.entities : [];
  const obstacles = entities.filter((entity) => entity.type === "obstacle");
  const formationCells = entities.filter((entity) => entity.type === "mouse" && entity.formationId);
  const blockers = obstacles.concat(formationCells);
  const additions = [];
  const mouseWidth = 42;
  const mouseHeight = 42;
  const safeSpacing = Math.max(
    GAME_CONFIG.mouseRouteSpacingMin,
    Math.min(GAME_CONFIG.mouseRouteSpacingMax, Math.round(spacing)),
  );
  let routeIndex = 0;
  for (let x = 0; x <= Math.max(0, pattern.width - mouseWidth); x += safeSpacing) {
    const candidate = {
      type: "mouse",
      x,
      y: routeYForPoint(pattern, x, obstacles, gaps, mouseHeight),
      width: mouseWidth,
      height: mouseHeight,
      variant: "toy",
      collectible: true,
      routeKind: "continuous",
      routeAction: routeActionForPoint(pattern, x, obstacles, gaps),
      routeIndex,
    };
    routeIndex += 1;
    if (isMouseClearOfObstacles(candidate, blockers) &&
        isEntityClearOfGaps(candidate, gaps, { allowAirborne: true })) {
      additions.push(candidate);
    }
  }
  return additions;
}

function createBridgeMouseRoute(fromX, toX, { spacing = 38, patternIndex = 0 } = {}) {
  const additions = [];
  const safeSpacing = Math.max(
    GAME_CONFIG.mouseRouteSpacingMin,
    Math.min(GAME_CONFIG.mouseRouteSpacingMax, Math.round(spacing)),
  );
  let routeIndex = 0;
  for (let x = fromX + safeSpacing; x + 42 < toX; x += safeSpacing) {
    additions.push({
      id: `bridge-${patternIndex}-${routeIndex}`,
      type: "mouse",
      x,
      y: GAME_CONFIG.groundY - 90,
      width: 42,
      height: 42,
      variant: "toy",
      collectible: true,
      routeKind: "connector",
      routeAction: "ground",
      routeIndex,
      patternIndex,
    });
    routeIndex += 1;
  }
  return additions;
}

function resolveGuidedActions(pattern, requiredActions, obstacles) {
  if (requiredActions.length === obstacles.length) {
    return requiredActions;
  }
  return obstacles.map((obstacle) => {
    if (pattern.safePath === "slide") {
      return "slide";
    }
    if (pattern.safePath === "mixed") {
      return obstacle.y <= 580 ? "slide" : "jump";
    }
    return "jump";
  });
}

function createGuidedMouseRoute(pattern, requiredActions = [], gaps = []) {
  const entities = Array.isArray(pattern?.entities) ? pattern.entities : [];
  const obstacles = entities.filter((entity) => entity.type === "obstacle");
  const mouseEntities = entities.filter((entity) => entity.type === "mouse");
  if (!obstacles.length) {
    return mergeMouseEntities(
      entities.map((entity) => ({ ...entity })),
      createContinuousMouseRoute(pattern, gaps, pattern.routeSpacing),
    );
  }
  const guidedActions = resolveGuidedActions(pattern, requiredActions, obstacles);

  const seeds = mouseEntities.length > 0
    ? mouseEntities
    : obstacles.map((obstacle) => ({
        type: "mouse",
        x: Math.max(0, obstacle.x - 68),
        y: GAME_CONFIG.groundY - 90,
        width: 42,
        height: 42,
        variant: "toy",
        collectible: true,
      }));
  const nonMice = entities.filter((entity) => entity.type !== "mouse");
  const guidedMice = seeds.flatMap((seed, seedIndex) => {
    const obstacle = selectRouteObstacle(seed, obstacles);
    const obstacleIndex = obstacles.indexOf(obstacle);
    const action = guidedActions[obstacleIndex] || "jump";
    return GUIDED_MOUSE_OFFSETS.map((offset, routeIndex) => {
      const candidate = {
        ...seed,
        x: Math.max(0, seed.x + offset),
        y: routeYForAction(action, obstacle, routeIndex / (GUIDED_MOUSE_MAX_COUNT - 1), seed.height),
        routeAction: action,
        routeIndex,
        routeSeedIndex: seedIndex,
      };
      return isEntityClearOfGaps(candidate, gaps) &&
        isMouseClearOfObstacles(candidate, obstacles)
        ? candidate
        : null;
    }).filter(Boolean);
  });
  const routedEntities = nonMice.concat(guidedMice);
  return mergeMouseEntities(
    routedEntities,
    createContinuousMouseRoute({ ...pattern, entities: routedEntities }, gaps, pattern.routeSpacing),
  );
}

function addDenseMice(entities, gaps = [], pattern = null, requiredActions = []) {
  if (pattern) {
    return createGuidedMouseRoute({ ...pattern, entities }, requiredActions, gaps);
  }
  return entities.flatMap((entity) => {
    if (entity.type !== "mouse") {
      return [entity];
    }
    return GUIDED_MOUSE_OFFSETS.map((offset, routeIndex) => ({
      ...entity,
      x: Math.max(0, entity.x + offset),
      routeIndex,
    }));
  });
}

function createFormationEntities(formation, pattern) {
  const anchor = pattern.formationAnchor;
  return formation.cells.map((cell) => ({
    type: "mouse",
    x: anchor.x + cell.column * FORMATION_CELL_STEP,
    y: anchor.y + cell.row * FORMATION_CELL_STEP,
    width: FORMATION_CELL_SIZE,
    height: FORMATION_CELL_SIZE,
    variant: "toy",
    collectible: true,
    formationId: formation.label,
    formationKind: formation.kind,
    formationCell: { ...cell },
  }));
}

function createPatternStream(seed) {
  const random = createSeededRandom(seed);
  let previousPatternId = null;
  let sequence = 0;
  let previousPatternHadGap = false;
  let dexCooldownRemaining = 0;

  return {
    next(zoneId = "home_day") {
      const candidates = PATTERN_LIBRARY.filter((pattern) =>
        pattern.id !== previousPatternId &&
        isValidPattern(pattern) &&
        isZoneEnabled(pattern.minZone, zoneId),
      );
      if (!candidates.length) {
        throw new Error("No valid pattern candidate available.");
      }

      const sourcePattern = selectPatternCandidate(candidates, random);
      const patternIndex = sequence;
      sequence += 1;
      previousPatternId = sourcePattern.id;
      const gapRoll = random();
      const gapWidthMin = zoneId === "home_night"
        ? GAME_CONFIG.gapWidthHomeNightMin
        : GAME_CONFIG.gapWidthOutsideMin;
      const gapWidthMax = zoneId === "home_night"
        ? GAME_CONFIG.gapWidthHomeNightMax
        : GAME_CONFIG.gapWidthOutsideMax;
      const gapWidth = gapWidthMin +
        Math.floor(random() * (gapWidthMax - gapWidthMin + 1));
      const routeSpacing = Math.floor(
        (GAME_CONFIG.mouseRouteSpacingMin + GAME_CONFIG.mouseRouteSpacingMax) / 2,
      );
      const requiredActions = (sourcePattern.actionCandidates || []).map((actions) =>
        actions[Math.floor(random() * actions.length)],
      );
      const pattern = adjustJumpSlideSpacing({
        ...sourcePattern,
        requiredActions,
      });
      if (!isValidPattern(pattern)) {
        throw new Error("Adjusted pattern failed validation: " + pattern.id);
      }
      const gapChance = zoneId === "outside"
        ? GAME_CONFIG.gapChanceOutside
        : zoneId === "home_night" ? GAME_CONFIG.gapChanceHomeNight : 0;
      const gaps = gapRoll < gapChance && !previousPatternHadGap ? [{
        id: `${pattern.id}-gap-${patternIndex}`,
        x: pattern.gapAnchor.x,
        width: gapWidth,
        minZone: "outside",
      }] : [];
      previousPatternHadGap = gaps.length > 0;
      const gapAction = zoneId === "home_night" && pattern.family === "double-jump"
        ? "double_jump"
        : "jump";
      const formationRoll = random();
      const canUseFormation = gaps.length === 0 && isFormationAnchorSafe(pattern);
      const formation = formationRoll < 0.3 && canUseFormation
        ? {
            ...createFormation(random, { allowDex: dexCooldownRemaining === 0 }),
            anchor: { ...pattern.formationAnchor },
          }
        : null;
      if (formation?.isDex) {
        dexCooldownRemaining = DEX_COOLDOWN_PATTERNS;
      } else if (dexCooldownRemaining > 0) {
        dexCooldownRemaining -= 1;
      }
      const configuredPattern = { ...pattern, gapAction, routeSpacing };
      const baseEntities = formation
        ? pattern.entities
            .filter((entity) => entity.type !== "mouse")
            .concat(createFormationEntities(formation, pattern))
        : addDenseMice(configuredPattern.entities, gaps, configuredPattern, requiredActions);
      const sourceEntities = formation
        ? mergeMouseEntities(
            baseEntities,
            createContinuousMouseRoute(
              { ...pattern, formation, gapAction, routeSpacing, entities: baseEntities },
              gaps,
              routeSpacing,
            ),
          )
        : baseEntities;
      const entities = sourceEntities.map((entity, entityIndex) => ({
        ...entity,
        id: `${pattern.id}-${patternIndex}-${entityIndex}`,
        effectRoll: entity.type === "grass" ? random() : undefined,
        collected: false,
        hitByPlayer: false,
      })).filter((entity) => isZoneEnabled(entity.minZone, zoneId));

      return {
        id: pattern.id,
        width: pattern.width,
        minGap: pattern.minGap,
        safePath: pattern.safePath,
        family: pattern.family,
        minZone: pattern.minZone,
        advancedSafeMargin: pattern.advancedSafeMargin,
        actionCandidates: (pattern.actionCandidates || []).map((actions) => [...actions]),
        requiredActions,
        formation,
        gapAction,
        routeSpacing,
        patternIndex,
        gaps,
        entities,
      };
    },
  };
}

export {
  COMPOSITE_SAFE_MARGIN,
  DEX_CHANCE,
  DEX_COOLDOWN_PATTERNS,
  GUIDED_MOUSE_MAX_COUNT,
  addDenseMice,
  createBridgeMouseRoute,
  createContinuousMouseRoute,
  createGuidedMouseRoute,
  expandPatternHorizontally,
  PATTERN_LIBRARY,
  PATTERN_INTERNAL_SCALE,
  PATTERN_VERSION,
  ZONE_DEFINITIONS,
  createPatternStream,
  adjustJumpSlideSpacing,
  isFormationAnchorSafe,
  isActionSequenceValid,
  isValidPattern,
  selectPatternCandidate,
};
