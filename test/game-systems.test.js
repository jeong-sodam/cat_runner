const assert = require("node:assert/strict");
const { test } = require("node:test");

async function loadSystems() {
  const [
    constants,
    stateModule,
    patterns,
    formations,
    world,
    collision,
    effects,
    scoring,
    rhythm,
  ] = await Promise.all([
    import("../public/js/game/constants.js"),
    import("../public/js/game/state.js"),
    import("../public/js/game/patterns.js"),
    import("../public/js/game/mouse-formations.js"),
    import("../public/js/game/world.js"),
    import("../public/js/game/collision.js"),
    import("../public/js/game/effects.js"),
    import("../public/js/game/scoring.js"),
    import("../public/js/game/rhythm-targets.js"),
  ]);
  return {
    ...constants,
    ...stateModule,
    ...patterns,
    ...formations,
    ...world,
    ...collision,
    ...effects,
    ...scoring,
    ...rhythm,
  };
}

test("five-by-five formation masks cover the named shapes and alphabet", async () => {
  const modules = await loadSystems();
  for (const kind of ["heart", "star", "clover", "thumbsUp"]) {
    const formation = modules.createFormation(() => 0.5, { kind });
    assert.equal(formation.cells.length > 0, true);
    assert.ok(formation.cells.every((cell) =>
      cell.column >= 0 && cell.column < 5 && cell.row >= 0 && cell.row < 5,
    ));
    assert.deepEqual(
      { width: formation.width, height: formation.height },
      { width: 178, height: 178 },
    );
  }

  assert.equal(Object.keys(modules.ALPHABET_MASKS).length, 26);
  for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    const formation = modules.createFormation(() => 0.5, {
      kind: "alphabet",
      label: letter,
      forceDex: false,
    });
    assert.equal(formation.label, letter);
    assert.equal(formation.isDex, false);
    assert.ok(formation.cells.length > 0);
  }
});

test("pattern stream doubles base mice and replaces them with safe formations", async () => {
  const modules = await loadSystems();
  const baseCounts = { "jump-basic": 2, "slide-basic": 1, "mixed-safe": 1 };
  const stream = modules.createPatternStream("formation-density-seed");
  const patterns = Array.from({ length: 240 }, () => stream.next("home_day"));
  const basePatterns = patterns.filter((pattern) => baseCounts[pattern.id]);
  assert.ok(basePatterns.length > 20);
  assert.ok(basePatterns.some((pattern) => pattern.formation));
  assert.ok(basePatterns.some((pattern) => !pattern.formation));
  const formationRatio = basePatterns.filter((pattern) => pattern.formation).length /
    basePatterns.length;
  assert.ok(formationRatio >= 0.2 && formationRatio <= 0.4);

  for (const pattern of basePatterns) {
    const mice = pattern.entities.filter((entity) => entity.type === "mouse");
    if (pattern.formation) {
      assert.equal(
        pattern.formation.obstacleSuppressed,
        pattern.formation.isDex,
      );
      assert.equal(
        mice.filter((mouse) => mouse.formationId === pattern.formation.label).length,
        pattern.formation.cells.length,
      );
      assert.ok(mice.length >= pattern.formation.cells.length);
      assert.ok(pattern.entities.every((entity) =>
        entity.type !== "obstacle" ||
        entity.x + entity.width <= pattern.formation.anchor.x ||
        entity.x >= pattern.formation.anchor.x + pattern.formation.width,
      ));
    } else {
      assert.ok(mice.length >= baseCounts[pattern.id]);
      assert.ok(mice.length <= Math.ceil(pattern.width / modules.GAME_CONFIG.mouseRouteSpacingMin) +
        baseCounts[pattern.id] * modules.GUIDED_MOUSE_MAX_COUNT);
      const guidedMice = mice.filter((mouse) => mouse.routeSeedIndex !== undefined);
      const continuousMice = mice.filter((mouse) => mouse.routeKind === "continuous");
      assert.ok(continuousMice.length > 0);
      const routeGroups = new Map();
      for (const mouse of guidedMice) {
        const group = routeGroups.get(mouse.routeSeedIndex) || [];
        group.push(mouse);
        routeGroups.set(mouse.routeSeedIndex, group);
      }
      assert.ok(routeGroups.size <= baseCounts[pattern.id]);
      assert.ok([...routeGroups.values()].every((group) =>
        group.length >= 1 && group.length <= modules.GUIDED_MOUSE_MAX_COUNT,
      ));
      assert.ok(guidedMice.every((guided) => continuousMice.every((continuous) =>
        guided.x >= continuous.x + continuous.width ||
        guided.x + guided.width <= continuous.x ||
        guided.y >= continuous.y + continuous.height ||
        guided.y + guided.height <= continuous.y,
      )));
    }
  }
});

test("ordinary patterns guide mice along required actions without obstacle overlap", async () => {
  const modules = await loadSystems();
  const stream = modules.createPatternStream("guided-route-seed");
  const patterns = Array.from({ length: 240 }, () => stream.next("outside"));
  const intersects = (first, second) =>
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y;

  for (const pattern of patterns) {
    if (pattern.formation) {
      continue;
    }
    const mice = pattern.entities.filter((entity) => entity.type === "mouse");
    const obstacles = pattern.entities.filter((entity) => entity.type === "obstacle");
    assert.ok(mice.length > 0);
    assert.ok(mice.every((mouse) =>
      ["ground", "jump", "slide", "double_jump"].includes(mouse.routeAction),
    ));
    assert.ok(mice.filter((mouse) => mouse.routeKind !== "continuous").every((mouse) =>
      mouse.routeIndex >= 0 && mouse.routeIndex < modules.GUIDED_MOUSE_MAX_COUNT,
    ));
    assert.ok(mice.every((mouse) => obstacles.every((obstacle) =>
      !intersects(mouse, obstacle),
    )));
    const jumpMice = mice.filter((mouse) =>
      mouse.routeAction === "jump" || mouse.routeAction === "double_jump",
    );
    const slideMice = mice.filter((mouse) => mouse.routeAction === "slide");
    if (jumpMice.length) {
      assert.ok(Math.min(...jumpMice.map((mouse) => mouse.y)) < 610);
    }
    if (slideMice.length) {
      assert.ok(slideMice.every((mouse) => mouse.y >= 640));
    }
  }
});

test("formation selection is deterministic and alphabet DEX uses the fifteen-percent branch", async () => {
  const modules = await loadSystems();
  assert.equal(modules.DEX_CHANCE, 0.15);
  const firstStream = modules.createPatternStream("formation-determinism");
  const secondStream = modules.createPatternStream("formation-determinism");
  const first = Array.from({ length: 120 }, () => firstStream.next("outside"));
  const second = Array.from({ length: 120 }, () => secondStream.next("outside"));
  assert.deepEqual(first, second);

  const dex = modules.createFormation(() => 0.01, {
    kind: "alphabet",
    label: "A",
  });
  assert.equal(dex.isDex, true);
  assert.deepEqual(dex.sequence, ["D", "E", "X"]);
  assert.equal(dex.obstacleSuppressed, true);
  assert.equal(dex.label, "DEX");
  const ordinary = modules.createFormation(() => 0.99, {
    kind: "alphabet",
    label: "A",
  });
  assert.equal(ordinary.isDex, false);
  assert.equal(ordinary.label, "A");
});

function createState(modules, catId = "black") {
  return modules.createGameState({ catId, seed: "systems-seed" });
}

test("same seed yields stable patterns, grass rolls, and no adjacent repeat", async () => {
  const modules = await loadSystems();
  const firstStream = modules.createPatternStream("same-seed");
  const secondStream = modules.createPatternStream("same-seed");
  const first = [];
  const second = [];

  for (let index = 0; index < 12; index += 1) {
    first.push(firstStream.next());
    second.push(secondStream.next());
    assert.notEqual(first[index].id, first[index - 1]?.id);
    assert.ok(
      first[index].minGap >= modules.GAME_CONFIG.playerWidth * 1.5,
    );
    assert.ok(["jump", "slide", "mixed"].includes(first[index].safePath));
    assert.ok(first[index].entities.every((entity) => entity.id));
  }

  assert.deepEqual(first, second);
});

test("pattern geometry expands horizontally without mutating the source", async () => {
  const modules = await loadSystems();
  const source = {
    width: 1000,
    gapAnchor: { x: 600, y: 1 },
    formationAnchor: { x: 700, y: 470 },
    gaps: [{ id: "sample-gap", x: 800, width: 150 }],
    entities: [
      { type: "obstacle", x: 200, y: 620, width: 90, height: 80 },
      { type: "mouse", x: 350, y: 610, width: 42, height: 42 },
    ],
  };
  const expanded = modules.expandPatternHorizontally(source);

  assert.equal(modules.PATTERN_INTERNAL_SCALE, 1.15);
  assert.equal(expanded.width, 1150);
  assert.equal(expanded.gapAnchor.x, 690);
  assert.equal(expanded.formationAnchor.x, 805);
  assert.equal(expanded.gaps[0].x, 920);
  assert.deepEqual(expanded.entities.map((entity) => entity.x), [230, 402]);
  assert.equal(source.width, 1000);
  assert.equal(source.gapAnchor.x, 600);
  assert.equal(source.entities[0].x, 200);

  for (const definition of modules.PATTERN_LIBRARY) {
    assert.equal(modules.isValidPattern(definition), true);
    assert.ok(definition.gapAnchor.x >= modules.GAME_CONFIG.gapSafeMargin);
    assert.ok(
      definition.gapAnchor.x + modules.GAME_CONFIG.gapMaxWidth <=
      definition.width - modules.GAME_CONFIG.gapSafeMargin,
    );
    const obstacles = definition.entities.filter((entity) => entity.type === "obstacle");
    if (definition.advancedSafeMargin != null) {
      assert.ok(obstacles.slice(1).every((entity, index) =>
        entity.x - (obstacles[index].x + obstacles[index].width) >= definition.advancedSafeMargin,
      ));
    }
  }
});

test("zone gates composite patterns and increases only outside obstacle density", async () => {
  const modules = await loadSystems();
  const collect = (zoneId, seed = "density-seed") => {
    const stream = modules.createPatternStream(seed);
    return Array.from({ length: 240 }, () => stream.next(zoneId));
  };
  const homeDay = collect("home_day");
  const outside = collect("outside");
  const night = collect("home_night");
  const compositeDefinitions = modules.PATTERN_LIBRARY.filter((pattern) =>
    pattern.id.startsWith("combo-"),
  );

  assert.equal(compositeDefinitions.length, 6);
  assert.equal(homeDay.every((pattern) => !pattern.id.startsWith("combo-")), true);
  assert.equal(
    new Set(outside.filter((pattern) => pattern.id.startsWith("combo-")).map((pattern) => pattern.id)).size,
    6,
  );
  assert.equal(
    new Set(night.filter((pattern) => pattern.id.startsWith("combo-")).map((pattern) => pattern.id)).size,
    6,
  );

  const baseCounts = { "jump-basic": 1, "slide-basic": 1, "mixed-safe": 2 };
  for (const pattern of homeDay) {
    if (baseCounts[pattern.id]) {
      assert.equal(
        pattern.entities.filter((entity) => entity.type === "obstacle").length,
        baseCounts[pattern.id],
      );
    }
  }
  for (const pattern of outside) {
    if (baseCounts[pattern.id]) {
      assert.equal(
        pattern.entities.filter((entity) => entity.type === "obstacle").length,
        baseCounts[pattern.id] + 2,
      );
    }
    if (pattern.id.startsWith("combo-")) {
      assert.equal(pattern.entities.filter((entity) => entity.type === "obstacle").length, 4);
      assert.equal(pattern.requiredActions.length, 4);
      assert.ok(pattern.requiredActions.every((action, index) =>
        pattern.actionCandidates[index].includes(action),
      ));
      const obstacles = pattern.entities.filter((entity) => entity.type === "obstacle");
      assert.ok(obstacles.slice(1).every((entity, index) =>
        entity.x - (obstacles[index].x + obstacles[index].width) >= 120,
      ));
    }
  }
});

test("double-jump patterns start in home day at a low weighted rate", async () => {
  const modules = await loadSystems();
  const doubleJumpDefinitions = modules.PATTERN_LIBRARY.filter((pattern) =>
    pattern.family === "double-jump",
  );
  assert.equal(doubleJumpDefinitions.length, 3);

  const stream = modules.createPatternStream("double-jump-frequency-seed");
  const patterns = Array.from({ length: 600 }, () => stream.next("home_day"));
  const doubleJumpPatterns = patterns.filter((pattern) =>
    pattern.family === "double-jump",
  );
  const ratio = doubleJumpPatterns.length / patterns.length;
  assert.ok(ratio >= 0.15 && ratio <= 0.25);
  assert.deepEqual(
    new Set(doubleJumpPatterns.map((pattern) => pattern.id)),
    new Set(doubleJumpDefinitions.map((pattern) => pattern.id)),
  );

  for (const pattern of doubleJumpPatterns) {
    const definition = doubleJumpDefinitions.find((candidate) =>
      candidate.id === pattern.id,
    );
    assert.equal(modules.isValidPattern(definition), true);
    assert.ok(pattern.requiredActions.includes("double_jump"));
    assert.ok(pattern.requiredActions.every((action, index) =>
      pattern.actionCandidates[index].includes(action),
    ));
    const obstacles = definition.entities.filter((entity) => entity.type === "obstacle");
    assert.ok(obstacles.slice(1).every((entity, index) =>
      entity.x - (obstacles[index].x + obstacles[index].width) >= 80,
    ));
  }

  const outsideStream = modules.createPatternStream("double-jump-frequency-seed");
  const outsidePatterns = Array.from({ length: 120 }, () => outsideStream.next("outside"));
  assert.ok(outsidePatterns.some((pattern) => pattern.family === "double-jump"));
});

test("jump-slide patterns shift the slide obstacle tail by 30 pixels", async () => {
  const modules = await loadSystems();
  const cases = [
    ["combo-jump-slide-jump", ["jump", "slide", "jump", "slide"], 1],
    ["combo-slide-jump-slide", ["slide", "jump", "slide", "jump"], 2],
    ["combo-jump-slide-slide", ["jump", "slide", "slide", "jump"], 1],
    ["combo-jump-jump-slide", ["jump", "jump", "slide", "jump"], 2],
    ["combo-slide-jump-jump", ["slide", "jump", "jump", "slide"], 3],
  ];

  for (const [id, requiredActions, firstShiftIndex] of cases) {
    const source = modules.PATTERN_LIBRARY.find((pattern) => pattern.id === id);
    const originalObstacles = source.entities.filter((entity) => entity.type === "obstacle");
    const adjusted = modules.adjustJumpSlideSpacing({ ...source, requiredActions });
    const adjustedObstacles = adjusted.entities.filter((entity) => entity.type === "obstacle");

    assert.deepEqual(
      adjustedObstacles.map((entity) => entity.x),
      originalObstacles.map((entity, index) =>
        entity.x + (index >= firstShiftIndex ? 30 : 0),
      ),
    );
    assert.deepEqual(adjustedObstacles.map((entity) => entity.variant), originalObstacles.map((entity) => entity.variant));
    assert.equal(originalObstacles[1]?.x, source.entities.filter((entity) => entity.type === "obstacle")[1]?.x);
    assert.equal(modules.isValidPattern(adjusted), true);
  }

  const unchangedSource = modules.PATTERN_LIBRARY.find((pattern) => pattern.id === "combo-slide-slide-jump");
  const unchanged = modules.adjustJumpSlideSpacing({
    ...unchangedSource,
    requiredActions: ["slide", "slide", "jump", "jump"],
  });
  assert.deepEqual(
    unchanged.entities.map((entity) => entity.x),
    unchangedSource.entities.map((entity) => entity.x),
  );
});

test("gaps are deterministic, zone-gated, bounded, and safely separated", async () => {
  const modules = await loadSystems();
  const outsideFirst = modules.createPatternStream("gap-seed");
  const outsideSecond = modules.createPatternStream("gap-seed");
  const outside = Array.from({ length: 500 }, () => outsideFirst.next("outside"));
  const outsideAgain = Array.from({ length: 500 }, () => outsideSecond.next("outside"));
  const nightStream = modules.createPatternStream("gap-seed");
  const night = Array.from({ length: 500 }, () => nightStream.next("home_night"));
  const homeDayStream = modules.createPatternStream("gap-seed");
  const homeDay = Array.from({ length: 50 }, () => homeDayStream.next("home_day"));

  assert.deepEqual(outside, outsideAgain);
  assert.ok(outside.some((pattern) => pattern.gaps.length > 0));
  assert.equal(homeDay.every((pattern) => pattern.gaps.length === 0), true);
  const widths = outside
    .flatMap((pattern) => pattern.gaps)
    .map((gap) => gap.width);
  assert.ok(widths.every((width) =>
    width >= modules.GAME_CONFIG.gapWidthOutsideMin &&
    width <= modules.GAME_CONFIG.gapWidthOutsideMax,
  ));
  assert.ok(widths.length > 40 && widths.length < 130);
  assert.ok(night.some((pattern) => pattern.gaps.length > 0));
  assert.ok(outside.filter((pattern) => pattern.gaps.length > 0).every((pattern) =>
    pattern.gapAction === "jump",
  ));
  for (let index = 1; index < outside.length; index += 1) {
    assert.equal(outside[index - 1].gaps.length > 0 && outside[index].gaps.length > 0, false);
  }
  assert.ok(night.flatMap((pattern) => pattern.gaps).every((gap) =>
    gap.width >= modules.GAME_CONFIG.gapWidthHomeNightMin &&
    gap.width <= modules.GAME_CONFIG.gapWidthHomeNightMax,
  ));

  for (const pattern of outside) {
    for (const gap of pattern.gaps) {
      assert.ok(gap.x >= modules.GAME_CONFIG.gapSafeMargin);
      assert.ok(
        pattern.width - (gap.x + gap.width) >= modules.GAME_CONFIG.gapSafeMargin,
      );
      for (const entity of pattern.entities) {
        const overlapsGap = entity.x < gap.x + gap.width &&
          entity.x + entity.width > gap.x;
        if (overlapsGap) {
          assert.equal(entity.routeKind, "continuous");
          assert.ok(entity.y + entity.height <= modules.GAME_CONFIG.groundY - 12);
          continue;
        }
        if (entity.routeKind === "continuous") {
          continue;
        }
        const separated =
          entity.x + entity.width <= gap.x - modules.GAME_CONFIG.gapSafeMargin ||
          entity.x >= gap.x + gap.width + modules.GAME_CONFIG.gapSafeMargin;
        assert.equal(separated, true);
      }
    }
  }
});

test("continuous routes reach the first viewport and guide each staged gap", async () => {
  const modules = await loadSystems();
  for (const zoneId of ["home_day", "outside", "home_night"]) {
    const stream = modules.createPatternStream(`route-invariants-${zoneId}`);
    const patterns = Array.from({ length: 96 }, () => stream.next(zoneId));
    const first = patterns[0];
    const firstVisibleRoute = first.entities.filter((entity) =>
      entity.type === "mouse" && !entity.formationId,
    );
    assert.ok(firstVisibleRoute.length > 0);
    assert.ok(firstVisibleRoute.some((entity) =>
      entity.x <= modules.GAME_CONFIG.canvasWidth - modules.GAME_CONFIG.initialPatternX,
    ));

    for (const pattern of patterns) {
      assert.equal(pattern.routeSpacing, 38);
      const continuousRoute = pattern.entities
        .filter((entity) => entity.type === "mouse" && entity.routeKind === "continuous")
        .sort((left, right) => left.x - right.x)
        .filter((entity, index, entities) => index === 0 || entity.x !== entities[index - 1].x);
      for (let index = 1; index < continuousRoute.length; index += 1) {
        const previous = continuousRoute[index - 1];
        const current = continuousRoute[index];
        const intentionalBreak = pattern.entities.some((entity) =>
          (entity.formationId || entity.type === "obstacle" ||
            (entity.type === "mouse" && entity.routeKind !== "continuous")) &&
          entity.x < current.x && entity.x + entity.width > previous.x,
        );
        if (!intentionalBreak) {
          assert.ok(current.x - previous.x >= modules.GAME_CONFIG.mouseRouteSpacingMin);
          assert.ok(
            current.x - previous.x <=
            modules.GAME_CONFIG.mouseRouteGapLead + modules.GAME_CONFIG.mouseRouteSpacingMax,
          );
        }
      }

      const route = pattern.entities
        .filter((entity) => entity.type === "mouse" && !entity.formationId)
        .sort((left, right) => left.x - right.x);
      for (const gap of pattern.gaps) {
        const gapRoute = route.filter((entity) =>
          entity.x + entity.width > gap.x - modules.GAME_CONFIG.mouseRouteGapLead &&
          entity.x < gap.x + gap.width + modules.GAME_CONFIG.mouseRouteGapLead,
        );
        assert.ok(gapRoute.length > 0);
        assert.ok(gapRoute.some((entity) => entity.routeAction === pattern.gapAction));
        assert.ok(gapRoute.some((entity) => entity.x <= gap.x - modules.GAME_CONFIG.playerWidth));
        assert.ok(gapRoute.some((entity) =>
          entity.x + entity.width >= gap.x + gap.width + modules.GAME_CONFIG.playerWidth,
        ));
      }
    }
  }
});

test("world spawns safe logical entities and removes entities behind the player", async () => {
  const modules = await loadSystems();
  const state = createState(modules);
  const stream = modules.createPatternStream(state.seed);
  const entities = modules.updateWorldEntities(state, stream);

  assert.ok(entities.length > 0);
  assert.ok(entities.every((entity) => entity.x > state.worldOffset));
  assert.ok(state.patternIndex > 0);

  state.worldOffset = 10000;
  modules.updateWorldEntities(state, stream);
  assert.equal(
    state.worldEntities.some(
      (entity) => entity.x - state.worldOffset <= state.player.x - 200,
    ),
    false,
  );
});

test("world connects consecutive patterns with continuous ground mice", async () => {
  const modules = await loadSystems();
  const state = createState(modules);
  state.nextPatternX = 0;
  const patterns = [
    {
      id: "bridge-first",
      width: 400,
      minGap: 240,
      patternIndex: 0,
      entities: [{
        type: "mouse",
        x: 120,
        y: modules.GAME_CONFIG.groundY - 90,
        width: 42,
        height: 42,
        collectible: true,
      }],
      gaps: [],
    },
    {
      id: "bridge-second",
      width: 400,
      minGap: 240,
      patternIndex: 1,
      entities: [{
        type: "mouse",
        x: 120,
        y: modules.GAME_CONFIG.groundY - 90,
        width: 42,
        height: 42,
        collectible: true,
      }],
      gaps: [],
    },
  ];
  let index = 0;
  const stream = { next: () => patterns[index++] };
  modules.spawnNextPattern(state, stream);
  modules.spawnNextPattern(state, stream);
  const connectors = state.worldEntities
    .filter((entity) => entity.routeKind === "connector")
    .sort((left, right) => left.x - right.x);
  assert.ok(connectors.length > 0);
  assert.ok(connectors.every((entity, index) => {
    if (index === 0) {
      return true;
    }
    return entity.x - connectors[index - 1].x >= modules.GAME_CONFIG.mouseRouteSpacingMin &&
      entity.x - connectors[index - 1].x <= modules.GAME_CONFIG.mouseRouteSpacingMax;
  }));
  assert.ok(state.worldEntities.every((entity) => entity.x > state.worldOffset));
});

test("world maps normal formation cells into the reserved corridor", async () => {
  const modules = await loadSystems();
  const state = createState(modules);
  state.nextPatternX = 0;
  const formation = modules.createFormation(() => 0.5, {
    kind: "heart",
    forceDex: false,
  });
  const pattern = {
    id: "normal-formation",
    width: 1400,
    minGap: 240,
    patternIndex: 4,
    formation: { ...formation, anchor: { x: 600, y: 470 } },
    entities: [
      {
        type: "obstacle",
        x: 260,
        y: 620,
        width: 90,
        height: 80,
        variant: "box",
        collectible: false,
      },
      ...formation.cells.map((cell) => ({
        type: "mouse",
        x: 600 + cell.column * modules.FORMATION_CELL_STEP,
        y: 470 + cell.row * modules.FORMATION_CELL_STEP,
        width: modules.FORMATION_CELL_SIZE,
        height: modules.FORMATION_CELL_SIZE,
        variant: "toy",
        collectible: true,
        formationId: formation.label,
        formationKind: formation.kind,
        formationCell: { ...cell },
      })),
    ],
    gaps: [],
  };

  const spawned = modules.spawnNextPattern(state, { next: () => pattern });
  const mice = spawned.entities.filter((entity) => entity.formationId === "heart");
  assert.equal(mice.length, formation.cells.length);
  assert.ok(mice.every((entity) => entity.patternId === pattern.id));
  const firstCell = mice.find((entity) =>
    entity.formationCell.column === 1 && entity.formationCell.row === 0,
  );
  assert.equal(firstCell.x, spawned.startX + 600 + modules.FORMATION_CELL_STEP);
  assert.equal(firstCell.y, 470);
  assert.equal(state.formationEvent, null);
  assert.equal(
    spawned.entities.some((entity) =>
      entity.type === "obstacle" &&
      entity.x >= spawned.startX + 600 &&
      entity.x < spawned.startX + 600 + formation.width,
    ),
    false,
  );
});

test("DEX formation pauses new obstacle spawns until letters leave the world", async () => {
  const modules = await loadSystems();
  const state = createState(modules);
  state.nextPatternX = 0;
  const dex = modules.createFormation(() => 0.01, {
    kind: "alphabet",
    label: "A",
  });
  const dexPattern = {
    id: "dex-formation",
    width: 1400,
    minGap: 240,
    patternIndex: 8,
    formation: { ...dex, anchor: { x: 600, y: 470 } },
    entities: [
      {
        type: "obstacle",
        x: 260,
        y: 620,
        width: 90,
        height: 80,
        variant: "box",
        collectible: false,
      },
      {
        type: "mouse",
        x: 600,
        y: 470,
        width: modules.FORMATION_CELL_SIZE,
        height: modules.FORMATION_CELL_SIZE,
        variant: "toy",
        collectible: true,
        formationId: dex.label,
        formationKind: dex.kind,
      },
    ],
    gaps: [],
  };
  const normalPattern = {
    id: "after-dex",
    width: 1400,
    minGap: 240,
    patternIndex: 9,
    entities: [{
      type: "mouse",
      x: 100,
      y: 610,
      width: modules.FORMATION_CELL_SIZE,
      height: modules.FORMATION_CELL_SIZE,
      variant: "toy",
      collectible: true,
    }],
    gaps: [],
  };
  let calls = 0;
  const stream = {
    next: () => {
      calls += 1;
      return calls === 1 ? dexPattern : normalPattern;
    },
  };

  const spawned = modules.spawnNextPattern(state, stream);
  const dexEntities = spawned.entities.filter((entity) => entity.formationId === "DEX");
  assert.deepEqual(
    [...new Set(dexEntities.map((entity) => entity.formationLetter))],
    ["D", "E", "X"],
  );
  assert.ok(dexEntities.every((entity) => entity.id.startsWith("dex-formation-8-")));
  assert.ok(
    spawned.entities.some((entity) =>
      entity.type === "obstacle" && entity.x < state.formationEvent.endsAtX,
    ),
  );
  assert.equal(state.formationEvent.type, "dex");

  state.nextPatternX = 0;
  modules.updateWorldEntities(state, stream);
  assert.equal(calls, 1);
  assert.equal(state.formationEvent.type, "dex");

  for (const entity of dexEntities) {
    entity.collected = true;
  }
  state.worldOffset = state.formationEvent.endsAtX - 1;
  modules.updateWorldEntities(state, stream);
  assert.equal(state.formationEvent.type, "dex");
  assert.equal(calls, 1);

  state.worldOffset = state.formationEvent.endsAtX;
  state.nextPatternX = 0;
  modules.updateWorldEntities(state, stream);
  assert.equal(state.formationEvent, null);
  assert.equal(calls, 2);
  assert.ok(state.worldEntities.some((entity) => entity.patternId === "after-dex"));
});

test("jump and slide paths are both valid ways to avoid their obstacle shape", async () => {
  const modules = await loadSystems();
  const state = createState(modules);
  const jumpObstacle = {
    x: state.worldOffset + state.player.x,
    y: 620,
    width: 90,
    height: 80,
  };
  state.player.y = 480;
  state.player.isGrounded = false;
  assert.equal(
    modules.intersects(
      modules.getPlayerHitbox(state),
      modules.getEntityHitbox(jumpObstacle, state),
    ),
    false,
  );

  state.player.y = modules.GAME_CONFIG.groundY - modules.GAME_CONFIG.slideHeight;
  state.player.height = modules.GAME_CONFIG.slideHeight;
  state.player.isGrounded = true;
  const slideObstacle = {
    x: state.worldOffset + state.player.x,
    y: 560,
    width: 140,
    height: 40,
  };
  assert.equal(
    modules.intersects(
      modules.getPlayerHitbox(state),
      modules.getEntityHitbox(slideObstacle, state),
    ),
    false,
  );
});

test("obstacle polygons follow each silhouette while collection entities keep AABB checks", async () => {
  const modules = await loadSystems();
  const state = createState(modules);
  const variants = ["box", "pot", "fence", "yarn"];

  for (const variant of variants) {
    const obstacle = {
      id: "polygon-" + variant,
      type: "obstacle",
      variant,
      x: state.worldOffset + state.player.x,
      y: variant === "fence" ? 560 : 620,
      width: variant === "fence" ? 140 : 90,
      height: variant === "fence" ? 40 : 80,
    };
    assert.ok(modules.getObstaclePolygons(obstacle).length > 0);
    assert.equal(modules.obstacleIntersectsPlayer(obstacle, state), true);
    const outside = {
      ...obstacle,
      x: obstacle.x - state.player.width - obstacle.width - 20,
    };
    assert.equal(modules.obstacleIntersectsPlayer(outside, state), false);
  }

  const mouse = {
    id: "aabb-mouse",
    type: "mouse",
    x: state.player.x,
    y: 610,
    width: 42,
    height: 42,
  };
  assert.equal(
    modules.intersects(modules.getPlayerHitbox(state), modules.getEntityHitbox(mouse, state)),
    true,
  );
});

test("obstacle hitbox uses an inset while pickup hitbox stays full size", async () => {
  const modules = await loadSystems();
  const state = createState(modules);
  const fullHitbox = modules.getPlayerHitbox(state);
  const obstacleHitbox = modules.getObstaclePlayerHitbox(state);

  assert.deepEqual(fullHitbox, {
    x: state.player.x,
    y: state.player.y,
    width: state.player.width,
    height: state.player.height,
  });
  assert.deepEqual(obstacleHitbox, {
    x: state.player.x + 10,
    y: state.player.y + 4,
    width: state.player.width - 20,
    height: state.player.height - 8,
  });

  const edgeObstacle = {
    id: "edge-obstacle",
    type: "obstacle",
    variant: "box",
    x: state.player.x + state.player.width - 10,
    y: 620,
    width: 90,
    height: 80,
  };
  assert.equal(modules.obstacleIntersectsPlayer(edgeObstacle, state), false);

  const innerObstacle = {
    ...edgeObstacle,
    id: "inner-obstacle",
    x: state.player.x + state.player.width - 30,
  };
  assert.equal(modules.obstacleIntersectsPlayer(innerObstacle, state), true);

  const mouse = {
    id: "edge-mouse",
    type: "mouse",
    x: state.player.x + state.player.width - 5,
    y: 610,
    width: 42,
    height: 42,
    collected: false,
    hitByPlayer: false,
  };
  const grass = {
    id: "edge-grass",
    type: "grass",
    x: state.player.x + state.player.width - 5,
    y: 610,
    width: 48,
    height: 72,
    collected: false,
    hitByPlayer: false,
    effectRoll: 0,
  };
  modules.resolveEntityCollisions(state, [mouse, grass]);
  assert.equal(mouse.collected, true);
  assert.equal(grass.collected, true);
});

test("obstacle collision damages once and invincibility prevents damage", async () => {
  const modules = await loadSystems();
  const state = createState(modules, "white");
  const events = [];
  const obstacle = {
    id: "obstacle-1",
    type: "obstacle",
    x: state.player.x,
    y: 620,
    width: 90,
    height: 80,
    hitByPlayer: false,
    collected: false,
  };

  modules.resolveEntityCollisions(state, [obstacle], {
    onEvent: (event) => events.push(event),
  });
  assert.equal(state.health, 2);
  assert.equal(events[0].type, "obstacle_collision");

  modules.resolveEntityCollisions(state, [obstacle], {
    onEvent: (event) => events.push(event),
  });
  assert.equal(state.health, 2);

  const protectedObstacle = {
    ...obstacle,
    id: "obstacle-2",
    hitByPlayer: false,
  };
  modules.applyEffect(state, modules.EFFECT_TYPES.INVINCIBLE, 100);
  modules.resolveEntityCollisions(state, [protectedObstacle], {
    now: 100,
    onEvent: (event) => events.push(event),
  });
  assert.equal(state.health, 2);
  assert.equal(events.at(-1).payload.prevented, true);
});

test("fall damage still emits while invincibility prevents the health loss", async () => {
  const modules = await loadSystems();
  const state = createState(modules);
  const events = [];
  state.worldGaps = [{ id: "invincible-gap", x: state.player.x, width: 160 }];
  const healthBefore = state.health;
  modules.applyEffect(state, modules.EFFECT_TYPES.INVINCIBLE, 0);

  modules.resolveEntityCollisions(state, [], {
    now: 100,
    onEvent: (event) => events.push(event),
  });

  assert.equal(state.player.isFalling, true);
  assert.equal(state.health, healthBefore);
  assert.deepEqual(events, [{ type: "fall_damage", payload: { gapId: "invincible-gap" } }]);
});

test("mouse, grass effects, magnet, slow miss, and replacement emit distinct outcomes", async () => {
  const modules = await loadSystems();
  const effectTypes = [
    modules.EFFECT_TYPES.MAGNET,
    modules.EFFECT_TYPES.INVINCIBLE,
    modules.EFFECT_TYPES.DOUBLE_SCORE,
    modules.EFFECT_TYPES.SLOW_MISS,
  ];
  for (let index = 0; index < effectTypes.length; index += 1) {
    const state = createState(modules, "cheese");
    const events = [];
    const mouse = {
      id: "mouse-" + index,
      type: "mouse",
      x: state.player.x,
      y: 610,
      width: 42,
      height: 42,
      collected: false,
      hitByPlayer: false,
    };
    const grass = {
      id: "grass-" + index,
      type: "grass",
      x: state.player.x,
      y: 585,
      width: 48,
      height: 72,
      effectRoll: index / 4 + 0.01,
      collected: false,
      hitByPlayer: false,
    };

    modules.resolveEntityCollisions(state, [mouse, grass], {
      now: 1000,
      onEvent: (event) => events.push(event),
    });
    assert.equal(state.mouseCount, 1);
    assert.ok(events.some((event) => event.type === "mouse_collected"));
    assert.ok(events.some((event) => event.type === "grass_collected"));
    assert.equal(state.activeEffect.type, effectTypes[index]);

    if (index === 0) {
      const pulledMouse = {
        id: "pulled",
        type: "mouse",
        x: state.player.x + state.worldOffset + 200,
        y: 610,
        width: 42,
        height: 42,
        collected: false,
      };
      const before = pulledMouse.x;
      modules.updateActiveEffect(state, 1000, [pulledMouse]);
      assert.ok(pulledMouse.x < before);
    }
    if (index === 3) {
      assert.equal(modules.getEffectSpeedMultiplier(state), 0.8);
    }

    modules.applyEffect(state, modules.EFFECT_TYPES.INVINCIBLE, 2000);
    assert.equal(state.activeEffect.type, modules.EFFECT_TYPES.INVINCIBLE);
  }
});

test("formation mice collect individually and use the full magnet range", async () => {
  const modules = await loadSystems();
  const state = createState(modules, "white");
  const events = [];
  const formationMouse = {
    id: "formation-mouse",
    type: "mouse",
    x: state.player.x,
    y: 610,
    width: 42,
    height: 42,
    formationKind: "heart",
    formationCell: { column: 1, row: 0 },
    collected: false,
    hitByPlayer: false,
  };

  modules.resolveEntityCollisions(state, [formationMouse], {
    now: 1000,
    onEvent: (event) => events.push(event),
  });
  assert.equal(state.mouseCount, 1);
  assert.equal(state.score, 5);
  assert.deepEqual(events[0], {
    type: "mouse_collected",
    payload: {
      entityId: "formation-mouse",
      formationKind: "heart",
      formationCell: { column: 1, row: 0 },
    },
  });

  assert.equal(
    modules.getMagnetRangePixels(modules.getStatMultiplier(1)),
    208,
  );
  assert.equal(
    modules.getMagnetRangePixels(modules.getStatMultiplier(5)),
    312,
  );
  state.activeEffect = { type: modules.EFFECT_TYPES.MAGNET, expiresAtMs: 5000 };
  const inside = {
    id: "formation-inside",
    type: "mouse",
    x: state.player.x + 207,
    y: 610,
    width: 42,
    height: 42,
    formationKind: "heart",
    formationCell: { column: 0, row: 1 },
    collected: false,
  };
  const outside = {
    ...inside,
    id: "formation-outside",
    x: state.player.x + 209,
    formationCell: { column: 2, row: 1 },
  };
  const beforeOutside = outside.x;
  modules.updateActiveEffect(state, 1000, [inside, outside]);
  assert.ok(inside.x < state.player.x + 207);
  assert.equal(outside.x, beforeOutside);
});

test("effect duration applies to positive effects only", async () => {
  const modules = await loadSystems();
  const cheese = createState(modules, "cheese");
  const black = createState(modules, "black");

  modules.applyEffect(cheese, modules.EFFECT_TYPES.MAGNET, 100);
  modules.applyEffect(black, modules.EFFECT_TYPES.MAGNET, 100);
  assert.equal(cheese.activeEffect.expiresAtMs, 6100);
  assert.equal(black.activeEffect.expiresAtMs, 4100);

  modules.applyEffect(cheese, modules.EFFECT_TYPES.SLOW_MISS, 100);
  assert.equal(cheese.activeEffect.expiresAtMs, 5100);
});

test("score doubles mouse points but never distance and zones switch at thresholds", async () => {
  const modules = await loadSystems();
  assert.equal(
    modules.calculateScore({
      mouseCount: 2,
      distanceM: 25.8,
      activeEffect: null,
    }),
    45,
  );
  assert.equal(
    modules.calculateScore({
      mouseCount: 2,
      distanceM: 25.8,
      activeEffect: { type: modules.EFFECT_TYPES.DOUBLE_SCORE },
    }),
    65,
  );

  const cheese = createState(modules, "cheese");
  const chaos = createState(modules, "chaos");
  for (const state of [cheese, chaos]) {
    state.mouseCount = 2;
    state.distanceM = 25.8;
    modules.updateScore(state);
  }
  assert.equal(cheese.score, chaos.score);

  const state = createState(modules);
  state.rhythm.hitCount = 1;
  state.distanceM = 1000;
  modules.updateScore(state);
  assert.equal(state.zoneId, "outside");
  state.distanceM = 2500;
  modules.updateScore(state);
  assert.equal(state.zoneId, "home_night");
  assert.equal(modules.calculateDifficulty(0, "home_day"), 1.1);
  assert.ok(Math.abs(modules.calculateDifficulty(2000, "home_day") - 1.65) < 1e-9);
  assert.ok(Math.abs(modules.calculateDifficulty(2000, "outside") - 1.98) < 1e-9);
  assert.ok(Math.abs(modules.calculateDifficulty(5000, "home_night") - 2.475) < 1e-9);
});

test("zone thresholds advance background transitions without changing difficulty multipliers", async () => {
  const modules = await loadSystems();
  assert.equal(modules.selectZoneForScore(399), "home_day");
  assert.equal(modules.selectZoneForScore(400), "outside");
  assert.equal(modules.selectZoneForScore(1799), "outside");
  assert.equal(modules.selectZoneForScore(1800), "home_night");
  assert.deepEqual(
    Object.fromEntries(Object.entries(modules.ZONE_DEFINITIONS).map(([id, zone]) => [id, zone.difficulty])),
    { home_day: 1, outside: 1.2, home_night: 1.5 },
  );
});

test("pattern spacing increases obstacle frequency while preserving the safe minimum", async () => {
  const modules = await loadSystems();
  assert.equal(modules.PATTERN_SPACING_FACTOR, 0.733);
  assert.equal(modules.resolvePatternSpacing({ minGap: 240 }), 175.92);
  assert.equal(
    modules.resolvePatternSpacing({ minGap: 150 }),
    modules.GAME_CONFIG.playerWidth * 1.5,
  );

  for (const zoneId of ["home_day", "outside", "home_night"]) {
    const state = createState(modules);
    state.zoneId = zoneId;
    state.nextPatternX = 0;
    const patternStream = {
      next: () => ({
        id: "spacing-test",
        width: 400,
        minGap: 240,
        entities: [],
        gaps: [],
      }),
    };
    modules.spawnNextPattern(state, patternStream);
    assert.equal(state.nextPatternX, modules.GAME_CONFIG.initialPatternX + 400 + 175.92);
  }

  const floorState = createState(modules);
  floorState.nextPatternX = 0;
  modules.spawnNextPattern(floorState, {
    next: () => ({
      id: "spacing-floor-test",
      width: 400,
      minGap: 150,
      entities: [],
      gaps: [],
    }),
  });
  assert.equal(floorState.nextPatternX, modules.GAME_CONFIG.initialPatternX + 400 + 135);
});

test("rhythm targets use single-target zone tempo, button matching, and bonus points", async () => {
  const modules = await loadSystems();
  assert.equal(modules.RHYTHM_CONFIG.targetLifetimeMs, 1000);
  assert.equal(modules.RHYTHM_CONFIG.baseSpawnIntervalMs, 1000);
  assert.equal(modules.RHYTHM_CONFIG.targetScale, 1.5625);
  assert.equal(modules.RHYTHM_CONFIG.placement.minimumDistance, 100);
  assert.deepEqual(
    Object.fromEntries(Object.entries(modules.RHYTHM_CONFIG.zones).map(([zoneId, config]) => [zoneId, {
      activeCount: config.activeCount,
      spawnIntervalMs: config.spawnIntervalMs,
      targetLifetimeMs: config.targetLifetimeMs,
    }])),
    {
      home_day: { activeCount: 1, spawnIntervalMs: 1000, targetLifetimeMs: 1000 },
      outside: { activeCount: 1, spawnIntervalMs: 800, targetLifetimeMs: 800 },
      home_night: { activeCount: 1, spawnIntervalMs: 600, targetLifetimeMs: 600 },
    },
  );

  const home = modules.createRhythmState({ randomSource: () => 0.9 });
  modules.updateRhythmTargets(home, {
    nowMs: 0,
    zoneId: "home_day",
    canvasWidth: 200,
    canvasHeight: 120,
  });
  assert.equal(home.targets.filter((target) => target.status === "active").length, 1);
  assert.equal(home.targets[0].button, "primary");
  assert.equal(home.targets[0].radius, 53.125);
  assert.equal(home.targets[0].expiresAtMs, 1000);
  modules.updateRhythmTargets(home, {
    nowMs: 999,
    zoneId: "home_day",
    canvasWidth: 200,
    canvasHeight: 120,
  });
  assert.equal(home.targets[0].status, "active");
  assert.ok(home.targets[0].x >= home.targets[0].radius && home.targets[0].x <= 200 - home.targets[0].radius);
  assert.ok(home.targets[0].y >= home.targets[0].radius && home.targets[0].y <= 120 - home.targets[0].radius);
  modules.updateRhythmTargets(home, {
    nowMs: 1000,
    zoneId: "home_day",
    canvasWidth: 200,
    canvasHeight: 120,
  });
  assert.equal(home.targets[0].status, "miss");

  const outside = modules.createRhythmState({ randomSource: () => 0.9 });
  modules.updateRhythmTargets(outside, { nowMs: 0, zoneId: "outside", canvasWidth: 800, canvasHeight: 600 });
  assert.equal(outside.targets.filter((target) => target.status === "active").length, 1);
  assert.equal(outside.targets[0].expiresAtMs, 800);
  assert.ok(outside.targets[0].radius < home.targets[0].radius);
  modules.updateRhythmTargets(outside, { nowMs: 799, zoneId: "outside", canvasWidth: 800, canvasHeight: 600 });
  assert.equal(outside.targets.length, 1);
  assert.equal(outside.targets[0].status, "active");
  modules.updateRhythmTargets(outside, { nowMs: 800, zoneId: "outside", canvasWidth: 800, canvasHeight: 600 });
  assert.equal(outside.targets[0].status, "miss");
  assert.equal(outside.targets.filter((target) => target.status === "active").length, 1);
  assert.equal(outside.targets[1].spawnedAtMs, 800);
  assert.equal(outside.targets[1].expiresAtMs, 1600);
  const wrongButton = modules.resolveRhythmTarget(outside, {
    x: outside.targets[1].x,
    y: outside.targets[1].y,
    button: "secondary",
    nowMs: 100,
  });
  assert.equal(wrongButton, null);
  assert.equal(outside.hitCount, 0);
  modules.resolveRhythmTarget(outside, {
    x: outside.targets[1].x,
    y: outside.targets[1].y,
    button: outside.targets[1].button,
    nowMs: 900,
  });
  assert.equal(outside.hitCount, 1);

  const night = modules.createRhythmState({ randomSource: () => 0.9 });
  modules.updateRhythmTargets(night, { nowMs: 0, zoneId: "home_night", canvasWidth: 800, canvasHeight: 600 });
  assert.equal(night.targets.filter((target) => target.status === "active").length, 1);
  assert.equal(night.targets[0].radius, 28.125);
  assert.equal(night.targets[0].expiresAtMs, 600);
  modules.updateRhythmTargets(night, { nowMs: 599, zoneId: "home_night", canvasWidth: 800, canvasHeight: 600 });
  assert.equal(night.targets.length, 1);
  modules.updateRhythmTargets(night, { nowMs: 600, zoneId: "home_night", canvasWidth: 800, canvasHeight: 600 });
  assert.equal(night.targets[0].status, "miss");
  assert.equal(night.targets.filter((target) => target.status === "active").length, 1);

  const hitArea = modules.createRhythmState({ randomSource: () => 0.9 });
  modules.updateRhythmTargets(hitArea, {
    nowMs: 0,
    zoneId: "home_day",
    canvasWidth: 1600,
    canvasHeight: 900,
  });
  const accepted = modules.resolveRhythmTarget(hitArea, {
    x: hitArea.targets[0].x + 40,
    y: hitArea.targets[0].y,
    button: "primary",
    nowMs: 100,
  });
  assert.ok(accepted);
  assert.equal(hitArea.hitCount, 1);

  const rejectedArea = modules.createRhythmState({ randomSource: () => 0.9 });
  modules.updateRhythmTargets(rejectedArea, {
    nowMs: 0,
    zoneId: "home_day",
    canvasWidth: 1600,
    canvasHeight: 900,
  });
  const rejected = modules.resolveRhythmTarget(rejectedArea, {
    x: rejectedArea.targets[0].x + 54,
    y: rejectedArea.targets[0].y,
    button: "primary",
    nowMs: 100,
  });
  assert.equal(rejected, null);

  const bonus = modules.createRhythmState({ randomSource: () => 0.1 });
  modules.updateRhythmTargets(bonus, { nowMs: 0, zoneId: "home_day", canvasWidth: 200, canvasHeight: 120 });
  assert.equal(bonus.targets[0].button, "secondary");
  assert.equal(bonus.targets[0].expiresAtMs, 1000);
  modules.resolveRhythmTarget(bonus, {
    x: bonus.targets[0].x,
    y: bonus.targets[0].y,
    button: "secondary",
    nowMs: 100,
  });
  const summary = modules.getRhythmSummary(bonus);
  assert.equal(summary.bonusHitCount, 1);
  assert.equal(summary.bonusPoints, 5);
  assert.equal(summary.accuracy, 1);
  assert.equal(summary.scoreMultiplier, 1.5);
});

test("rhythm targets stay in the HUD-safe area and space consecutive candidates", async () => {
  const modules = await loadSystems();
  const values = [0.1, 0.1, 0.1, 0.9, 0.9, 0.9];
  const spaced = modules.createRhythmState({
    randomSource: () => values.shift() ?? 0.5,
  });
  modules.updateRhythmTargets(spaced, {
    nowMs: 0,
    zoneId: "outside",
    canvasWidth: 1600,
    canvasHeight: 900,
  });
  assert.equal(spaced.targets.filter((target) => target.status === "active").length, 1);
  modules.updateRhythmTargets(spaced, {
    nowMs: 800,
    zoneId: "outside",
    canvasWidth: 1600,
    canvasHeight: 900,
  });
  assert.equal(spaced.targets.filter((target) => target.status === "active").length, 1);
  for (const target of spaced.targets) {
    assert.ok(target.x >= 120 && target.x <= 1480);
    assert.ok(target.y >= 140 && target.y <= 780);
  }
  assert.ok(
    Math.hypot(
      spaced.targets[0].x - spaced.targets[1].x,
      spaced.targets[0].y - spaced.targets[1].y,
    ) >= 100,
  );

  const fallback = modules.createRhythmState({ randomSource: () => 0.5 });
  modules.updateRhythmTargets(fallback, {
    nowMs: 0,
    zoneId: "home_day",
    canvasWidth: 1600,
    canvasHeight: 900,
  });
  modules.updateRhythmTargets(fallback, {
    nowMs: 1000,
    zoneId: "outside",
    canvasWidth: 1600,
    canvasHeight: 900,
  });
  assert.equal(fallback.targets.filter((target) => target.status === "active").length, 1);
  assert.ok(fallback.targets.every((target) => target.x >= 120 && target.x <= 1480));
  assert.ok(fallback.targets.every((target) => target.y >= 140 && target.y <= 780));
});

test("rhythm accuracy maps to the extreme score multiplier range", async () => {
  const modules = await loadSystems();
  assert.equal(modules.calculateRhythmScoreMultiplier(0), 0.5);
  assert.equal(modules.calculateRhythmScoreMultiplier(0.5), 1);
  assert.equal(modules.calculateRhythmScoreMultiplier(1), 1.5);
  assert.equal(modules.calculateRhythmScoreMultiplier(-1), 0.5);
  assert.equal(modules.calculateRhythmScoreMultiplier(2), 1.5);

  const untouched = modules.getRhythmSummary(modules.createRhythmState());
  assert.equal(untouched.accuracy, 0);
  assert.equal(untouched.scoreMultiplier, 0.5);
});
