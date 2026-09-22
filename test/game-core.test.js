const assert = require("node:assert/strict");
const { test } = require("node:test");

async function loadGameModules() {
  const [constants, stateModule, inputModule, loopModule, collision] = await Promise.all([
    import("../public/js/game/constants.js"),
    import("../public/js/game/state.js"),
    import("../public/js/game/input-controller.js"),
    import("../public/js/game/game-loop.js"),
    import("../public/js/game/collision.js"),
  ]);
  return {
    ...constants,
    ...stateModule,
    ...inputModule,
    ...loopModule,
    ...collision,
  };
}

class FakeEventTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type, key, repeat = false) {
    const event = {
      key,
      repeat,
      prevented: false,
      preventDefault() {
        this.prevented = true;
      },
    };
    for (const listener of this.listeners.get(type) || []) {
      listener(event);
    }
    return event;
  }
}

function createHarness(modules, catId = "black", options = {}) {
  const target = new FakeEventTarget();
  const canvas = { ownerDocument: { defaultView: target } };
  const state = modules.createGameState({
    catId,
    seed: "fixed-seed",
    randomSource: () => 0.5,
  });
  let loop;
  const events = [];
  const input = modules.createInputController(canvas, () => loop.togglePause());
  loop = modules.createGameLoop({
    state,
    input,
    onEvent: (event) => events.push(event),
    onStep: options.onStep,
    clock: {
      now: () => 0,
      requestFrame: () => 1,
      cancelFrame: () => {},
    },
  });
  loop.start();

  return {
    state,
    loop,
    input,
    events,
    target,
    destroy() {
      input.destroy();
      loop.destroy();
    },
  };
}

test("game state contains the six cats and valid lifecycle transitions", async () => {
  const modules = await loadGameModules();
  const expectedCats = ["black", "white", "calico", "cheese", "mackerel", "chaos"];
  assert.deepEqual(Object.keys(modules.CAT_DEFINITIONS), expectedCats);
  for (const cat of Object.values(modules.CAT_DEFINITIONS)) {
    assert.deepEqual(Object.keys(cat.statRatings), modules.CAT_STAT_KEYS);
    assert.ok(Object.values(cat.statRatings).every((value) => value >= 1 && value <= 5));
    assert.ok(Object.values(cat.statRatings).every(Number.isInteger));
  }

  assert.equal(modules.CAT_DEFINITIONS.chaos.englishName, "Mayhem");
  assert.equal(modules.getMaxHealthForRating(1), 4);
  assert.equal(modules.getMaxHealthForRating(3), 5);
  assert.equal(modules.getMaxHealthForRating(5), 6);
  const ratingTotals = Object.values(modules.CAT_DEFINITIONS).map((cat) =>
    Object.values(cat.statRatings).reduce((sum, value) => sum + value, 0),
  );
  assert.ok(Math.max(...ratingTotals) - Math.min(...ratingTotals) <= 1);

  const state = modules.createGameState({ catId: "black", seed: 123 });
  assert.equal(state.status, modules.GAME_STATUSES.READY);
  assert.equal(state.maxHealth, 4);
  assert.equal(state.health, 4);
  modules.transitionGameState(state, modules.GAME_STATUSES.RUNNING);
  modules.transitionGameState(state, modules.GAME_STATUSES.PAUSED);
  modules.transitionGameState(state, modules.GAME_STATUSES.RUNNING);
  assert.throws(
    () => modules.transitionGameState(state, modules.GAME_STATUSES.READY),
    /Invalid game state transition/,
  );
});

test("W produces at most two jumps and holding W does not repeat", async () => {
  const modules = await loadGameModules();
  const harness = createHarness(modules);

  harness.target.dispatch("keydown", "w");
  harness.target.dispatch("keydown", "w", true);
  harness.loop.advance(modules.GAME_CONFIG.fixedStepMs);
  assert.equal(harness.state.player.jumpsUsed, 1);
  assert.equal(harness.events.filter((event) => event.type === "player_jump").length, 1);

  harness.target.dispatch("keydown", "w");
  harness.loop.advance(modules.GAME_CONFIG.fixedStepMs);
  assert.equal(harness.state.player.jumpsUsed, 2);

  harness.target.dispatch("keydown", "w");
  harness.loop.advance(modules.GAME_CONFIG.fixedStepMs);
  assert.equal(harness.state.player.jumpsUsed, 2);
  assert.equal(harness.events.filter((event) => event.type === "player_jump").length, 2);
  harness.destroy();
});

test("S changes the hitbox only while grounded", async () => {
  const modules = await loadGameModules();
  const harness = createHarness(modules);

  const down = harness.target.dispatch("keydown", "s");
  harness.loop.advance(modules.GAME_CONFIG.fixedStepMs);
  assert.equal(down.prevented, true);
  assert.equal(harness.state.player.isSliding, true);
  assert.equal(harness.state.player.height, modules.GAME_CONFIG.slideHeight);
  assert.equal(
    harness.state.player.y + harness.state.player.height,
    modules.GAME_CONFIG.groundY,
  );

  harness.target.dispatch("keyup", "s");
  harness.loop.advance(modules.GAME_CONFIG.fixedStepMs);
  assert.equal(harness.state.player.isSliding, false);
  assert.equal(harness.state.player.height, modules.GAME_CONFIG.playerHeight);

  harness.target.dispatch("keydown", "w");
  harness.loop.advance(modules.GAME_CONFIG.fixedStepMs);
  harness.target.dispatch("keydown", "s");
  harness.loop.advance(modules.GAME_CONFIG.fixedStepMs);
  assert.equal(harness.state.player.isSliding, false);
  assert.equal(harness.state.player.height, modules.GAME_CONFIG.playerHeight);
  harness.destroy();
});

test("pointer input converts letterboxed coordinates and maps right click to secondary", async () => {
  const modules = await loadGameModules();
  const view = new FakeEventTarget();
  const listeners = new Map();
  const canvas = {
    width: 1600,
    height: 900,
    ownerDocument: { defaultView: view },
    getBoundingClientRect: () => ({ left: 100, top: 50, width: 800, height: 800 }),
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
  };
  const received = [];
  const input = modules.createInputController(canvas, () => {}, {
    onPointerDown: (pointer) => received.push(pointer),
  });
  const pointerEvent = {
    button: 2,
    clientX: 500,
    clientY: 450,
    prevented: false,
    preventDefault() {
      this.prevented = true;
    },
  };
  listeners.get("pointerdown")(pointerEvent);
  assert.equal(pointerEvent.prevented, true);
  assert.deepEqual(
    { x: received[0].x, y: received[0].y, button: received[0].button },
    { x: 800, y: 450, button: "secondary" },
  );

  const ignored = { button: 1, clientX: 500, clientY: 450, preventDefault() {} };
  listeners.get("pointerdown")(ignored);
  assert.equal(received.length, 1);
  const contextMenu = { prevented: false, preventDefault() { this.prevented = true; } };
  listeners.get("contextmenu")(contextMenu);
  assert.equal(contextMenu.prevented, true);
  input.destroy();
  assert.equal(listeners.size, 0);
});

test("P pauses and resumes without advancing the simulation while paused", async () => {
  const modules = await loadGameModules();
  const harness = createHarness(modules);
  harness.loop.advance(modules.GAME_CONFIG.fixedStepMs * 3);
  const elapsedBeforePause = harness.state.elapsedMs;
  const distanceBeforePause = harness.state.distanceM;

  const pauseEvent = harness.target.dispatch("keydown", "p");
  assert.equal(pauseEvent.prevented, true);
  assert.equal(harness.state.status, modules.GAME_STATUSES.PAUSED);
  harness.loop.advance(1000);
  assert.equal(harness.state.elapsedMs, elapsedBeforePause);
  assert.equal(harness.state.distanceM, distanceBeforePause);

  harness.target.dispatch("keydown", "p");
  assert.equal(harness.state.status, modules.GAME_STATUSES.RUNNING);
  harness.loop.advance(modules.GAME_CONFIG.fixedStepMs);
  assert.ok(harness.state.elapsedMs > elapsedBeforePause);
  harness.destroy();
});

test("health zero transitions to gameover and emits a run event", async () => {
  const modules = await loadGameModules();
  const harness = createHarness(modules);
  harness.state.health = 0;
  harness.loop.advance(modules.GAME_CONFIG.fixedStepMs);

  assert.equal(harness.state.status, modules.GAME_STATUSES.GAMEOVER);
  assert.equal(harness.state.health, 0);
  assert.equal(
    harness.events.filter((event) => event.type === "run_gameover").length,
    1,
  );
  harness.destroy();
});

test("rhythm timers pause and gameover includes the rhythm summary once", async () => {
  const modules = await loadGameModules();
  const harness = createHarness(modules);
  harness.loop.advance(modules.GAME_CONFIG.fixedStepMs);
  const target = harness.state.rhythm.targets[0];
  assert.equal(target.status, "active");

  harness.target.dispatch("keydown", "p");
  harness.loop.advance(1000);
  assert.equal(target.status, "active");
  assert.equal(harness.state.rhythm.missCount, 0);

  harness.target.dispatch("keydown", "p");
  for (let frame = 0; frame < 12; frame += 1) {
    harness.loop.advance(50);
  }
  assert.equal(harness.state.rhythm.missCount, 1);
  harness.state.health = 0;
  harness.loop.advance(modules.GAME_CONFIG.fixedStepMs);

  const gameovers = harness.events.filter((event) => event.type === "run_gameover");
  assert.equal(gameovers.length, 1);
  assert.deepEqual(Object.keys(gameovers[0].payload).sort(), [
    "distanceM",
    "rhythmAccuracy",
    "rhythmBonusHits",
    "rhythmBonusPoints",
    "rhythmHitCount",
    "rhythmMissCount",
  ]);
  assert.equal(typeof gameovers[0].payload.rhythmAccuracy, "number");
  harness.destroy();
});

test("falling skips jump physics, damages once, and recovers past the gap", async () => {
  const modules = await loadGameModules();
  const harness = createHarness(modules, "black", {
    onStep: (state) =>
      modules.resolveEntityCollisions(state, state.worldEntities, {
        now: state.elapsedMs,
        onEvent: (event) => harness.events.push(event),
      }),
  });
  harness.state.worldGaps = [{ id: "gap-1", x: 200, width: 180 }];
  const initialHealth = harness.state.health;
  const initialWorldOffset = harness.state.worldOffset;

  harness.loop.advance(modules.GAME_CONFIG.fixedStepMs);
  assert.equal(harness.state.player.isFalling, true);
  assert.equal(harness.state.player.isSliding, false);
  assert.equal(harness.state.player.jumpsUsed, 0);
  assert.equal(harness.state.health, initialHealth - modules.GAME_CONFIG.fallDamage);
  assert.equal(
    harness.events.filter((event) => event.type === "fall_damage").length,
    1,
  );
  assert.deepEqual(
    harness.events.find((event) => event.type === "fall_damage").payload,
    { gapId: "gap-1" },
  );

  for (let frame = 0; frame < 120; frame += 1) {
    harness.loop.advance(modules.GAME_CONFIG.fixedStepMs);
  }

  assert.equal(harness.state.player.isFalling, false);
  assert.equal(harness.state.player.isGrounded, true);
  assert.equal(harness.state.player.fallGapId, null);
  assert.ok(harness.state.player.fallRecoveryUntilMs > harness.state.elapsedMs);
  assert.ok(harness.state.worldOffset > initialWorldOffset);

  const recoveryObstacle = {
    id: "recovery-obstacle",
    type: "obstacle",
    variant: "box",
    x: harness.state.worldOffset + harness.state.player.x,
    y: modules.GAME_CONFIG.groundY - 80,
    width: 90,
    height: 80,
    hitByPlayer: false,
    collected: false,
  };
  modules.resolveEntityCollisions(harness.state, [recoveryObstacle], {
    now: harness.state.elapsedMs,
    onEvent: (event) => harness.events.push(event),
  });
  assert.equal(harness.state.health, initialHealth - modules.GAME_CONFIG.fallDamage);
  assert.equal(recoveryObstacle.hitByPlayer, true);
  harness.destroy();
});

test("identical seed, inputs, and timestamps produce identical state", async () => {
  const modules = await loadGameModules();
  const first = createHarness(modules, "white");
  const second = createHarness(modules, "white");

  for (let frame = 0; frame < 90; frame += 1) {
    if (frame === 1 || frame === 20) {
      first.target.dispatch("keydown", "w");
      second.target.dispatch("keydown", "w");
    }
    if (frame >= 45 && frame < 55) {
      first.target.dispatch("keydown", "s");
      second.target.dispatch("keydown", "s");
    } else {
      first.target.dispatch("keyup", "s");
      second.target.dispatch("keyup", "s");
    }
    first.loop.advance(1000 / 60);
    second.loop.advance(1000 / 60);
  }

  assert.deepEqual(first.state, second.state);
  assert.deepEqual(first.events, second.events);
  first.destroy();
  second.destroy();
});
