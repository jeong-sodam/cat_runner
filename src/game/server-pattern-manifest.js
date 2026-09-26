const PATTERN_VERSION = "cat-runner-patterns-v7";
const CANVAS_WIDTH = 1600;
const PLAYER_WIDTH = 90;
const PLAYER_HEIGHT = 110;
const GROUND_Y = 700;
const GAP_MIN_WIDTH = 140;
const GAP_MAX_WIDTH = 220;
const GAP_SAFE_MARGIN = 200;
const COMPOSITE_SAFE_MARGIN = 120;
const FORMATION_CELL_SIZE = 42;
const FORMATION_CELL_STEP = 34;
const FORMATION_WIDTH = FORMATION_CELL_SIZE + FORMATION_CELL_STEP * 4;
const FORMATION_HEIGHT = FORMATION_WIDTH;
const FORMATION_SEQUENCE_GAP = 48;
const FORMATION_KINDS = Object.freeze([
  "heart",
  "star",
  "clover",
  "thumbsUp",
  "alphabet",
]);
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const FORMATION_MASK_ROWS = Object.freeze({
  heart: Object.freeze(["01110", "11111", "11111", "01110", "00100"]),
  star: Object.freeze(["00100", "10101", "01110", "11111", "00100"]),
  clover: Object.freeze(["01010", "11111", "01110", "11111", "01010"]),
  thumbsUp: Object.freeze(["00100", "01100", "01111", "11111", "11111"]),
});
const ALPHABET_MASK_ROWS = Object.freeze({
  A: ["01110", "10001", "11111", "10001", "10001"],
  B: ["11110", "10001", "11110", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "11110", "10000", "11111"],
  F: ["11111", "10000", "11110", "10000", "10000"],
  G: ["01111", "10000", "10111", "10001", "01111"],
  H: ["10001", "10001", "11111", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "11100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001"],
  O: ["01110", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "11110", "10000", "10000"],
  Q: ["01110", "10001", "10101", "10011", "01111"],
  R: ["11110", "10001", "11110", "10010", "10001"],
  S: ["01111", "10000", "01110", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10101", "11011", "10001"],
  X: ["10001", "01010", "00100", "01010", "10001"],
  Y: ["10001", "01010", "00100", "00100", "00100"],
  Z: ["11111", "00010", "00100", "01000", "11111"],
});
const GAP_CHANCE = Object.freeze({ home_day: 0, outside: 0.15, home_night: 0.3 });
const ZONE_ORDER = Object.freeze({ home_day: 0, outside: 1, home_night: 2 });
const GROUND_ACTIONS = Object.freeze(["jump"]);
const LOW_ACTIONS = Object.freeze(["jump", "slide"]);
const DOUBLE_JUMP_ACTIONS = Object.freeze(["double_jump"]);
const GUIDED_MOUSE_MAX_COUNT = 7;
const GUIDED_MOUSE_OFFSETS = Object.freeze([-102, -68, -34, 0, 34, 68, 102]);

function maskRowsToCells(rows) {
  return rows.flatMap((row, rowIndex) =>
    [...row].flatMap((cell, columnIndex) =>
      cell === "1" ? [{ column: columnIndex, row: rowIndex }] : [],
    ),
  );
}

function createFormation(random) {
  const kind = FORMATION_KINDS[Math.floor(random() * FORMATION_KINDS.length)];
  if (kind === "alphabet") {
    const letter = ALPHABET[Math.floor(random() * ALPHABET.length)];
    const isDex = random() < 0.05;
    return {
      kind,
      label: isDex ? "DEX" : letter,
      cells: maskRowsToCells(ALPHABET_MASK_ROWS[isDex ? "D" : letter]),
      width: FORMATION_WIDTH,
      height: FORMATION_HEIGHT,
      isDex,
      obstacleSuppressed: isDex,
      sequence: isDex ? ["D", "E", "X"] : null,
    };
  }
  return {
    kind,
    label: kind,
    cells: maskRowsToCells(FORMATION_MASK_ROWS[kind]),
    width: FORMATION_WIDTH,
    height: FORMATION_HEIGHT,
    isDex: false,
    obstacleSuppressed: false,
    sequence: null,
  };
}

function isFormationAnchorSafe(candidate) {
  const anchor = candidate.formationAnchor;
  if (!anchor || anchor.x < GAP_SAFE_MARGIN ||
      anchor.x + FORMATION_WIDTH > candidate.width - GAP_SAFE_MARGIN) {
    return false;
  }
  return candidate.entities.every((entity) =>
    entity.x + entity.width <= anchor.x ||
    entity.x >= anchor.x + FORMATION_WIDTH,
  );
}

function selectPatternCandidate(candidates, random) {
  const doubleJumpPatterns = candidates.filter((candidate) =>
    candidate.family === "double-jump",
  );
  const legacyPatterns = candidates.filter((candidate) =>
    candidate.family !== "double-jump",
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

function isEntityClearOfGaps(entity, gaps) {
  return gaps.every((gap) =>
    entity.x + entity.width <= gap.x - GAP_SAFE_MARGIN ||
    entity.x >= gap.x + gap.width + GAP_SAFE_MARGIN,
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
  const groundY = GROUND_Y - 90;
  if (action === "slide") {
    return groundY + 30;
  }
  const heightBonus = action === "double_jump" ? 36 : 12;
  const peakY = obstacle
    ? obstacle.y - PLAYER_HEIGHT - mouseHeight - heightBonus
    : groundY - PLAYER_HEIGHT;
  const arc = Math.sin(Math.PI * progress);
  return Math.round(groundY + (peakY - groundY) * arc);
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
    return entities.map((entity) => ({ ...entity }));
  }
  const guidedActions = resolveGuidedActions(pattern, requiredActions, obstacles);
  const seeds = mouseEntities.length > 0
    ? mouseEntities
    : obstacles.map((obstacle) => ({
        type: "mouse",
        x: Math.max(0, obstacle.x - 68),
        y: GROUND_Y - 90,
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
  return nonMice.concat(guidedMice);
}

function addDenseMice(entities, gaps, pattern = null, requiredActions = []) {
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

function createFormationEntities(formation, candidate) {
  return formation.cells.map((cell) => ({
    type: "mouse",
    x: candidate.formationAnchor.x + cell.column * FORMATION_CELL_STEP,
    y: candidate.formationAnchor.y + cell.row * FORMATION_CELL_STEP,
    width: FORMATION_CELL_SIZE,
    height: FORMATION_CELL_SIZE,
    variant: "toy",
    collectible: true,
    formationId: formation.label,
    formationKind: formation.kind,
    formationCell: { ...cell },
  }));
}

function expandDexEntities(patternEntities, formation, patternId, patternIndex, startX) {
  const baseEntities = patternEntities.filter((entity) =>
    entity.formationId !== formation.label,
  );
  let sequenceOffset = 0;
  const sequenceEntities = formation.sequence.flatMap((letter, sequenceIndex) => {
    const cells = maskRowsToCells(ALPHABET_MASK_ROWS[letter]);
    const currentOffset = sequenceOffset;
    sequenceOffset += cells.length;
    const segmentX = formation.anchor.x +
      sequenceIndex * (FORMATION_WIDTH + FORMATION_SEQUENCE_GAP);
    return cells.map((cell, cellIndex) => ({
      id: `${patternId}-${patternIndex}-${baseEntities.length + currentOffset + cellIndex}`,
      patternId,
      patternIndex,
      type: "mouse",
      x: startX + segmentX + cell.column * FORMATION_CELL_STEP,
      y: formation.anchor.y + cell.row * FORMATION_CELL_STEP,
      width: FORMATION_CELL_SIZE,
      height: FORMATION_CELL_SIZE,
      variant: "toy",
      collectible: true,
      formationId: formation.label,
      formationKind: formation.kind,
      formationLetter: letter,
      formationSequenceIndex: sequenceIndex,
      formationCell: { ...cell },
    }));
  });
  return baseEntities.map((entity) => ({ ...entity })).concat(sequenceEntities);
}

function pattern(definition) {
  return Object.freeze({
    ...definition,
    gapAnchor: Object.freeze({ ...definition.gapAnchor }),
    formationAnchor: Object.freeze({
      x: definition.formationAnchor?.x ?? definition.gapAnchor.x,
      y: definition.formationAnchor?.y ?? 470,
    }),
    requiredActions: Object.freeze([...(definition.requiredActions || [])]),
    actionCandidates: Object.freeze(
      (definition.actionCandidates || []).map((actions) => Object.freeze([...actions])),
    ),
    entities: Object.freeze(definition.entities.map((entity) => Object.freeze({ ...entity }))),
  });
}

const PATTERNS = Object.freeze([
  pattern({
    id: "jump-basic", width: 1200, minGap: 240, safePath: "jump", gapAnchor: { x: 742 },
    entities: [
      { type: "obstacle", x: 420, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "mouse", x: 300, y: 610, width: 42, height: 42, variant: "toy", collectible: true },
      { type: "mouse", x: 500, y: 490, width: 42, height: 42, variant: "toy", collectible: true },
      { type: "obstacle", x: 60, y: 620, width: 90, height: 80, variant: "pot", collectible: false, minZone: "outside" },
      { type: "obstacle", x: 180, y: 620, width: 90, height: 80, variant: "pot", collectible: false, minZone: "outside" },
    ],
  }),
  pattern({
    id: "slide-basic", width: 1400, minGap: 240, safePath: "slide", gapAnchor: { x: 858 },
    entities: [
      { type: "obstacle", x: 420, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "mouse", x: 280, y: 640, width: 42, height: 42, variant: "toy", collectible: true },
      { type: "grass", x: 610, y: 585, width: 48, height: 72, variant: "cat-grass", collectible: true },
      { type: "obstacle", x: 20, y: 620, width: 90, height: 80, variant: "box", collectible: false, minZone: "outside" },
      { type: "obstacle", x: 140, y: 620, width: 90, height: 80, variant: "box", collectible: false, minZone: "outside" },
    ],
  }),
  pattern({
    id: "mixed-safe", width: 1400, minGap: 260, safePath: "mixed", gapAnchor: { x: 940 },
    entities: [
      { type: "obstacle", x: 390, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
      { type: "obstacle", x: 610, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
      { type: "mouse", x: 250, y: 600, width: 42, height: 42, variant: "toy", collectible: true },
      { type: "grass", x: 520, y: 600, width: 48, height: 72, variant: "cat-grass", collectible: true },
      { type: "obstacle", x: 20, y: 620, width: 90, height: 80, variant: "box", collectible: false, minZone: "outside" },
      { type: "obstacle", x: 120, y: 620, width: 90, height: 80, variant: "box", collectible: false, minZone: "outside" },
    ],
  }),
  pattern({
    id: "double-jump-basic", width: 1500, minGap: 260, family: "double-jump", safePath: "jump",
    advancedSafeMargin: 80, gapAnchor: { x: 1050 },
    actionCandidates: [GROUND_ACTIONS, DOUBLE_JUMP_ACTIONS],
    entities: [
      { type: "obstacle", x: 300, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 470, y: 600, width: 90, height: 100, variant: "box", collectible: false },
    ],
  }),
  pattern({
    id: "double-jump-slide", width: 1800, minGap: 260, family: "double-jump", safePath: "mixed",
    advancedSafeMargin: 80, gapAnchor: { x: 1250 },
    actionCandidates: [GROUND_ACTIONS, DOUBLE_JUMP_ACTIONS, LOW_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 440, y: 600, width: 90, height: 100, variant: "box", collectible: false },
      { type: "obstacle", x: 700, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
    ],
  }),
  pattern({
    id: "slide-double-jump", width: 1800, minGap: 260, family: "double-jump", safePath: "mixed",
    advancedSafeMargin: 80, gapAnchor: { x: 1250 },
    actionCandidates: [LOW_ACTIONS, GROUND_ACTIONS, DOUBLE_JUMP_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 510, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 690, y: 600, width: 90, height: 100, variant: "box", collectible: false },
    ],
  }),
  pattern({
    id: "combo-jump-slide-jump", width: 2200, minGap: 300, minZone: "outside", safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN, gapAnchor: { x: 1500 },
    actionCandidates: [GROUND_ACTIONS, LOW_ACTIONS, GROUND_ACTIONS, LOW_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 470, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 730, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
      { type: "obstacle", x: 940, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
    ],
  }),
  pattern({
    id: "combo-slide-jump-slide", width: 2200, minGap: 300, minZone: "outside", safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN, gapAnchor: { x: 1500 },
    actionCandidates: [LOW_ACTIONS, GROUND_ACTIONS, LOW_ACTIONS, GROUND_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 520, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 730, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
      { type: "obstacle", x: 980, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
    ],
  }),
  pattern({
    id: "combo-jump-jump-slide", width: 2200, minGap: 300, minZone: "outside", safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN, gapAnchor: { x: 1500 },
    actionCandidates: [GROUND_ACTIONS, GROUND_ACTIONS, LOW_ACTIONS, GROUND_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
      { type: "obstacle", x: 470, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 680, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 940, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
    ],
  }),
  pattern({
    id: "combo-slide-slide-jump", width: 2200, minGap: 300, minZone: "outside", safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN, gapAnchor: { x: 1500 },
    actionCandidates: [LOW_ACTIONS, LOW_ACTIONS, GROUND_ACTIONS, GROUND_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 520, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
      { type: "obstacle", x: 780, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 990, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
    ],
  }),
  pattern({
    id: "combo-jump-slide-slide", width: 2200, minGap: 300, minZone: "outside", safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN, gapAnchor: { x: 1500 },
    actionCandidates: [GROUND_ACTIONS, LOW_ACTIONS, LOW_ACTIONS, GROUND_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
      { type: "obstacle", x: 470, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 730, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
      { type: "obstacle", x: 980, y: 620, width: 90, height: 80, variant: "box", collectible: false },
    ],
  }),
  pattern({
    id: "combo-slide-jump-jump", width: 2200, minGap: 300, minZone: "outside", safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN, gapAnchor: { x: 1500 },
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

function createRandom(seed) {
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

function isValidPattern(pattern) {
  const safeMargin = pattern.advancedSafeMargin ?? GAP_SAFE_MARGIN;
  const maxGapEnd = pattern.gapAnchor.x + GAP_MAX_WIDTH;
  const obstacles = pattern.entities.filter((entity) => entity.type === "obstacle");
  return pattern.minGap >= PLAYER_WIDTH * 1.5 &&
    ["jump", "slide", "mixed"].includes(pattern.safePath) &&
    pattern.gapAnchor.x >= safeMargin &&
    maxGapEnd <= pattern.width - safeMargin &&
    pattern.entities.every((entity) =>
      entity.x + entity.width <= pattern.gapAnchor.x - safeMargin ||
      entity.x >= maxGapEnd + safeMargin,
    ) &&
    (pattern.advancedSafeMargin == null || obstacles.every((entity, index) => {
      const next = obstacles[index + 1];
      return !next || next.x - (entity.x + entity.width) >= safeMargin;
    })) &&
    pattern.entities.every((entity) => entity.x >= 0 && entity.width > 0 && entity.height > 0);
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

function createServerManifest(seed, { patternCount = 128, zoneId = "outside" } = {}) {
  const random = createRandom(seed);
  let previousId = null;
  let nextPatternX = CANVAS_WIDTH + 300;
  const entities = [];
  const gaps = [];
  const patterns = [];

  for (let patternIndex = 0; patternIndex < patternCount; patternIndex += 1) {
    const candidates = PATTERNS.filter((candidate) =>
      candidate.id !== previousId &&
      isValidPattern(candidate) &&
      isZoneEnabled(candidate.minZone, zoneId),
    );
    const selected = selectPatternCandidate(candidates, random);
    const startX = nextPatternX;
    const gapRoll = random();
    const gapWidth = GAP_MIN_WIDTH + Math.floor(random() * (GAP_MAX_WIDTH - GAP_MIN_WIDTH + 1));
    const requiredActions = (selected.actionCandidates || []).map((actions) =>
      actions[Math.floor(random() * actions.length)],
    );
    const adjusted = adjustJumpSlideSpacing({
      ...selected,
      requiredActions,
    });
    if (!isValidPattern(adjusted)) {
      throw new Error("Adjusted pattern failed validation: " + adjusted.id);
    }
    const gapChance = GAP_CHANCE[zoneId] ?? GAP_CHANCE.home_day;
    const relativeGaps = gapRoll < gapChance ? [{
      id: `${adjusted.id}-gap-${patternIndex}`,
      patternId: adjusted.id,
      patternIndex,
      x: adjusted.gapAnchor.x,
      width: gapWidth,
      minZone: "outside",
    }] : [];
    const generatedGaps = relativeGaps.map((gap) => ({
      ...gap,
      x: startX + gap.x,
    }));
    const formationRoll = random();
    const canUseFormation = relativeGaps.length === 0 && isFormationAnchorSafe(adjusted);
    const formation = formationRoll < 0.3 && canUseFormation
      ? { ...createFormation(random), anchor: { ...adjusted.formationAnchor } }
      : null;
    const sourceEntities = formation
      ? adjusted.entities
          .filter((entity) => entity.type !== "mouse")
          .concat(createFormationEntities(formation, adjusted))
      : addDenseMice(adjusted.entities, relativeGaps, adjusted, requiredActions);
    const generated = sourceEntities.map((entity, entityIndex) => ({
      id: `${selected.id}-${patternIndex}-${entityIndex}`,
      patternId: selected.id,
      patternIndex,
      type: entity.type,
      x: startX + entity.x,
      y: entity.y,
      width: entity.width,
      height: entity.height,
      variant: entity.variant,
      collectible: entity.collectible,
      minZone: entity.minZone,
      ...(entity.routeAction === undefined ? {} : { routeAction: entity.routeAction }),
      ...(entity.routeIndex === undefined ? {} : { routeIndex: entity.routeIndex }),
      ...(entity.routeSeedIndex === undefined ? {} : { routeSeedIndex: entity.routeSeedIndex }),
      ...(entity.formationId === undefined ? {} : { formationId: entity.formationId }),
      ...(entity.formationKind === undefined ? {} : { formationKind: entity.formationKind }),
      ...(entity.formationLetter === undefined ? {} : { formationLetter: entity.formationLetter }),
      ...(entity.formationSequenceIndex === undefined ? {} : { formationSequenceIndex: entity.formationSequenceIndex }),
      ...(entity.formationCell === undefined ? {} : { formationCell: entity.formationCell }),
      effectRoll: entity.type === "grass" ? random() : undefined,
    })).filter((entity) => isZoneEnabled(entity.minZone, zoneId));
    const worldEntities = formation?.isDex
      ? expandDexEntities(generated, formation, adjusted.id, patternIndex, startX)
      : generated;

    entities.push(...worldEntities);
    gaps.push(...generatedGaps);
    patterns.push({
      id: adjusted.id,
      width: adjusted.width,
      minGap: adjusted.minGap,
      safePath: adjusted.safePath,
      family: adjusted.family,
      minZone: adjusted.minZone,
      advancedSafeMargin: adjusted.advancedSafeMargin,
      actionCandidates: (adjusted.actionCandidates || []).map((actions) => [...actions]),
      requiredActions,
      formation,
      obstacleSuppressed: Boolean(formation?.isDex),
      patternIndex,
      startX,
      entities: generated,
      worldEntities,
      gaps: generatedGaps,
    });
    nextPatternX = startX + adjusted.width +
      Math.max(adjusted.minGap * 0.6375, PLAYER_WIDTH * 1.5);
    previousId = adjusted.id;
  }

  const entityById = new Map(entities.map((entity) => [entity.id, entity]));
  const gapById = new Map(gaps.map((gap) => [gap.id, gap]));
  return {
    version: PATTERN_VERSION,
    seed: String(seed),
    zoneId,
    patterns,
    entities,
    gaps,
    entityById,
    gapById,
    getEntity: (entityId) => entityById.get(entityId) || null,
    getGap: (gapId) => gapById.get(gapId) || null,
  };
}

module.exports = {
  COMPOSITE_SAFE_MARGIN,
  PATTERN_VERSION,
  PATTERNS,
  createServerManifest,
};
