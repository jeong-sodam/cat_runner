const assert = require("node:assert/strict");
const { test } = require("node:test");

async function loadRenderModules() {
  const [constants, stateModule, palette, viewport, renderer] = await Promise.all([
    import("../public/js/game/constants.js"),
    import("../public/js/game/state.js"),
    import("../public/js/render/color-palette.js"),
    import("../public/js/render/canvas-viewport.js"),
    import("../public/js/render/scene-renderer.js"),
  ]);
  return { ...constants, ...stateModule, ...palette, ...viewport, ...renderer };
}

function createFakeContext() {
  const target = { calls: [] };
  return new Proxy(target, {
    get(object, property) {
      if (property in object) {
        return object[property];
      }
      if (typeof property === "string") {
        const method = (...args) => {
          object.calls.push({ name: property, args });
        };
        object[property] = method;
        return method;
      }
      return undefined;
    },
  });
}

function createCanvas(width = 800, height = 400) {
  return {
    width: 0,
    height: 0,
    style: {},
    getBoundingClientRect() {
      return { left: 10, top: 20, width, height };
    },
  };
}

function createState(modules, catId = "black", zoneId = "home_day") {
  const state = modules.createGameState({ catId, seed: "render-seed" });
  state.zoneId = zoneId;
  state.worldEntities = [
    {
      id: "box",
      type: "obstacle",
      variant: "box",
      x: 800,
      y: 620,
      width: 90,
      height: 80,
      collected: false,
    },
    {
      id: "mouse",
      type: "mouse",
      variant: "toy",
      x: 980,
      y: 610,
      width: 42,
      height: 42,
      collected: false,
    },
    {
      id: "grass",
      type: "grass",
      variant: "cat-grass",
      x: 1120,
      y: 585,
      width: 48,
      height: 72,
      collected: false,
    },
  ];
  return state;
}

test("viewport fixes logical dimensions and maps letterboxed coordinates", async () => {
  const modules = await loadRenderModules();
  const canvas = createCanvas(800, 400);
  const viewport = modules.createCanvasViewport(canvas);

  assert.equal(canvas.width, 1600);
  assert.equal(canvas.height, 900);
  const metrics = viewport.getMetrics();
  assert.ok(metrics.scale > 0);
  assert.ok(metrics.displayWidth < 800);
  assert.equal(canvas.style.objectFit, "contain");

  const center = viewport.toLogicalPoint(410, 220);
  assert.ok(Math.abs(center.x - 800) < 0.01);
  assert.ok(Math.abs(center.y - 450) < 0.01);
});

test("all six cat palettes and three backgrounds render without image assets", async () => {
  const modules = await loadRenderModules();
  const bodyColors = Object.values(modules.PALETTE.cats).map((cat) => cat.body);
  assert.equal(new Set(bodyColors).size, 6);

  const context = createFakeContext();
  const renderer = modules.createSceneRenderer(context);
  for (const catId of Object.keys(modules.CAT_DEFINITIONS)) {
    for (const zoneId of ["home_day", "outside", "home_night"]) {
      renderer.render(createState(modules, catId, zoneId));
    }
  }

  const methodNames = new Set(context.calls.map((call) => call.name));
  assert.ok(methodNames.has("fillRect"));
  assert.ok(methodNames.has("arc"));
  assert.ok(methodNames.has("ellipse"));
  assert.ok(methodNames.has("fillText"));
});

test("renderer draws every entity variant and returns a pause hit area", async () => {
  const modules = await loadRenderModules();
  const context = createFakeContext();
  const renderer = modules.createSceneRenderer(context);
  const state = createState(modules);
  state.activeEffect = { type: "magnet", expiresAtMs: 5000 };
  const result = renderer.render(state);

  assert.deepEqual(Object.keys(result.pauseButton), ["x", "y", "width", "height"]);
  assert.ok(
    context.calls.some((call) => call.name === "fillText" && call.args[0] === "자석"),
  );
});

test("effect colors are distinct and HUD derives three hearts without mutating state", async () => {
  const modules = await loadRenderModules();
  const colors = Object.values(modules.PALETTE.effects);
  assert.equal(new Set(colors).size, 4);

  const context = createFakeContext();
  const renderer = modules.createSceneRenderer(context);
  const state = createState(modules);
  state.health = 11;
  state.score = 123;
  state.distanceM = 45.7;
  const before = JSON.parse(JSON.stringify(state));
  renderer.render(state);

  assert.deepEqual(state, before);
  const text = context.calls
    .filter((call) => call.name === "fillText")
    .map((call) => call.args[0]);
  assert.ok(text.includes("점수 123"));
  assert.ok(text.includes("거리 45m"));
  assert.ok(text.some((value) => value === "♥"));
});

test("injected sprites replace vector fallback through the asset provider", async () => {
  const modules = await loadRenderModules();
  const context = createFakeContext();
  const sprite = { name: "cat-sprite" };
  const itemSprite = { name: "mouse-sprite" };
  const renderer = modules.createSceneRenderer(context, {
    getCatSprite: () => sprite,
    getItemSprite: (type) => (type === "mouse" ? itemSprite : null),
  });
  renderer.render(createState(modules));

  const images = context.calls
    .filter((call) => call.name === "drawImage")
    .map((call) => call.args[0]);
  assert.ok(images.includes(sprite));
  assert.ok(images.includes(itemSprite));
});
