const assert = require("node:assert/strict");
const { test } = require("node:test");

async function loadSystems() {
  const [
    constants,
    stateModule,
    patterns,
    world,
    collision,
    effects,
    scoring,
  ] = await Promise.all([
    import("../public/js/game/constants.js"),
    import("../public/js/game/state.js"),
    import("../public/js/game/patterns.js"),
    import("../public/js/game/world.js"),
    import("../public/js/game/collision.js"),
    import("../public/js/game/effects.js"),
    import("../public/js/game/scoring.js"),
  ]);
  return {
    ...constants,
    ...stateModule,
    ...patterns,
    ...world,
    ...collision,
    ...effects,
    ...scoring,
  };
}

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
        baseCounts[pattern.id] + 1,
      );
    }
    if (pattern.id.startsWith("combo-")) {
      assert.equal(pattern.entities.filter((entity) => entity.type === "obstacle").length, 3);
      assert.deepEqual(pattern.requiredActions, modules.PATTERN_LIBRARY.find(
        (definition) => definition.id === pattern.id,
      ).requiredActions);
      const obstacles = pattern.entities.filter((entity) => entity.type === "obstacle");
      assert.deepEqual(obstacles.slice(1).map((entity, index) => entity.x - obstacles[index].x), [130, 130]);
    }
  }
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
    width >= modules.GAME_CONFIG.gapMinWidth &&
    width <= modules.GAME_CONFIG.gapMaxWidth,
  ));
  assert.ok(widths.length > 40 && widths.length < 110);
  assert.ok(night.some((pattern) => pattern.gaps.length > 0));

  for (const pattern of outside) {
    for (const gap of pattern.gaps) {
      assert.ok(gap.x >= modules.GAME_CONFIG.gapSafeMargin);
      assert.ok(
        pattern.width - (gap.x + gap.width) >= modules.GAME_CONFIG.gapSafeMargin,
      );
      for (const entity of pattern.entities) {
        const separated =
          entity.x + entity.width <= gap.x - modules.GAME_CONFIG.gapSafeMargin ||
          entity.x >= gap.x + gap.width + modules.GAME_CONFIG.gapSafeMargin;
        assert.equal(separated, true);
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

test("obstacle collision damages once and invincibility prevents damage", async () => {
  const modules = await loadSystems();
  const state = createState(modules);
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
  assert.equal(state.health, 3);
  assert.equal(events[0].type, "obstacle_collision");

  modules.resolveEntityCollisions(state, [obstacle], {
    onEvent: (event) => events.push(event),
  });
  assert.equal(state.health, 3);

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
  assert.equal(state.health, 3);
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

test("effect duration applies to positive effects only", async () => {
  const modules = await loadSystems();
  const cheese = createState(modules, "cheese");
  const black = createState(modules, "black");

  modules.applyEffect(cheese, modules.EFFECT_TYPES.MAGNET, 100);
  modules.applyEffect(black, modules.EFFECT_TYPES.MAGNET, 100);
  assert.equal(cheese.activeEffect.expiresAtMs, 6100);
  assert.equal(black.activeEffect.expiresAtMs, 5100);

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

  const state = createState(modules);
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
