const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

async function loadRenderModules() {
  const [constants, stateModule, palette, viewport, renderer, manifest, loader] = await Promise.all([
    import("../public/js/game/constants.js"),
    import("../public/js/game/state.js"),
    import("../public/js/render/color-palette.js"),
    import("../public/js/render/canvas-viewport.js"),
    import("../public/js/render/scene-renderer.js"),
    import("../public/js/render/asset-manifest.js"),
    import("../public/js/render/asset-loader.js"),
  ]);
  return {
    ...constants,
    ...stateModule,
    ...palette,
    ...viewport,
    ...renderer,
    ...manifest,
    ...loader,
  };
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

function createFakeImageCtor(failingSources = new Set()) {
  const createdSources = [];
  class FakeImage {
    set src(value) {
      this._src = value;
      createdSources.push(value);
      if (failingSources.has(value)) {
        this.onerror?.(new Error("missing"));
      } else {
        this.onload?.();
      }
    }

    get src() {
      return this._src;
    }
  }
  return { FakeImage, createdSources };
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

test("renderer draws active floor gaps behind world entities", async () => {
  const modules = await loadRenderModules();
  const context = createFakeContext();
  const renderer = modules.createSceneRenderer(context);
  const state = createState(modules);
  state.worldGaps = [{ id: "gap-render", x: 320, width: 180 }];

  renderer.render(state);

  assert.ok(
    context.calls.some(
      (call) =>
        call.name === "fillRect" &&
        call.args[0] === 320 &&
        call.args[1] === modules.GAME_CONFIG.groundY - 115 &&
        call.args[2] === 180,
    ),
  );
});

test("renderer draws primary and bonus rhythm targets without mutating them", async () => {
  const modules = await loadRenderModules();
  const context = createFakeContext();
  const renderer = modules.createSceneRenderer(context);
  const state = createState(modules);
  state.rhythm.targets = [
    { id: "primary", x: 320, y: 220, radius: 30, button: "primary", status: "active" },
    { id: "bonus", x: 720, y: 420, radius: 24, button: "secondary", status: "active" },
    { id: "missed", x: 900, y: 500, radius: 20, button: "primary", status: "miss" },
  ];
  const before = JSON.stringify(state);
  renderer.render(state);

  const arcs = context.calls.filter((call) => call.name === "arc");
  assert.ok(arcs.some((call) => call.args[0] === 320 && call.args[1] === 220 && call.args[2] === 30));
  assert.ok(arcs.some((call) => call.args[0] === 720 && call.args[1] === 420 && call.args[2] === 24));
  assert.ok(!arcs.some((call) => call.args[0] === 900 && call.args[1] === 500));
  const labels = context.calls
    .filter((call) => call.name === "fillText")
    .map((call) => call.args[0]);
  assert.ok(labels.includes("L"));
  assert.ok(labels.includes("R"));
  assert.deepEqual(JSON.stringify(state), before);
});

test("HUD renders the complete health capacity for two and five health cats", async () => {
  const modules = await loadRenderModules();
  for (const catId of ["black", "calico"]) {
    const context = createFakeContext();
    const renderer = modules.createSceneRenderer(context);
    const state = createState(modules, catId);
    state.health = state.maxHealth;
    renderer.render(state);
    const hearts = context.calls.filter(
      (call) => call.name === "fillText" && call.args[0] === "♥" && call.args[2] === 120,
    );
    assert.equal(hearts.length, state.maxHealth);
    assert.match(context.font, /Pretendard/);
  }
});

test("HUD omits duplicate local labels even when state has server mode fields", async () => {
  const modules = await loadRenderModules();
  const context = createFakeContext();
  const renderer = modules.createSceneRenderer(context);
  const state = createState(modules);
  state.connectionMode = "server";
  state.runMode = "server";
  renderer.render(state);

  const labels = context.calls
    .filter((call) => call.name === "fillText")
    .map((call) => call.args[0]);
  assert.equal(labels.includes("LOCAL"), false);
  assert.equal(labels.includes("SERVER"), false);
  assert.ok(context.calls.some(
    (call) => call.name === "fillRect" && call.args[0] === 230 && call.args[1] === 12 && call.args[2] === 270 && call.args[3] === 100,
  ));
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
  const sprite = { name: "cat-sprite", naturalWidth: 300, naturalHeight: 100 };
  const backgroundSprite = {
    name: "background-sprite",
    naturalWidth: 1600,
    naturalHeight: 900,
  };
  const itemSprite = { name: "mouse-sprite" };
  const renderer = modules.createSceneRenderer(context, {
    getCatSprite: () => sprite,
    getBackgroundSprite: () => backgroundSprite,
    getItemSprite: (type) => (type === "mouse" ? itemSprite : null),
  });
  const state = createState(modules);
  state.worldOffset = 320;
  renderer.render(state);

  const images = context.calls
    .filter((call) => call.name === "drawImage")
    .map((call) => call.args[0]);
  assert.ok(images.includes(sprite));
  assert.ok(images.includes(itemSprite));
  assert.ok(images.includes(backgroundSprite));
});

test("loaded cat sheets use distinct run, jump, and slide source regions", async () => {
  const modules = await loadRenderModules();
  const context = createFakeContext();
  const sprite = { name: "cat-sheet", naturalWidth: 300, naturalHeight: 100 };
  const renderer = modules.createSceneRenderer(context, {
    getCatSprite: () => sprite,
  });
  const state = createState(modules);
  const before = JSON.parse(JSON.stringify(state));

  state.player.isGrounded = true;
  state.player.isSliding = false;
  renderer.drawCat(state);
  state.player.isGrounded = false;
  state.player.isSliding = false;
  renderer.drawCat(state);
  state.player.isGrounded = true;
  state.player.isSliding = true;
  renderer.drawCat(state);

  const sourceX = context.calls
    .filter((call) => call.name === "drawImage" && call.args[0] === sprite)
    .map((call) => call.args[1]);
  assert.deepEqual(sourceX, [0, 100, 200]);
  assert.equal(modules.getCatPose({ isGrounded: true, isSliding: false }), "run");
  assert.equal(modules.getCatPose({ isGrounded: false, isSliding: false }), "jump");
  assert.equal(modules.getCatPose({ isGrounded: true, isSliding: true }), "slide");
  state.player.isGrounded = before.player.isGrounded;
  state.player.isSliding = before.player.isSliding;
  assert.deepEqual(state, before);
});

test("cat jump presentation distinguishes ascent and descent without mutating physics", async () => {
  const modules = await loadRenderModules();
  const context = createFakeContext();
  const sprite = { name: "cat-sheet", naturalWidth: 300, naturalHeight: 100 };
  const renderer = modules.createSceneRenderer(context, {
    getCatSprite: () => sprite,
  });
  const state = createState(modules);
  const before = JSON.parse(JSON.stringify(state));

  state.player.isGrounded = false;
  state.player.isSliding = false;
  state.player.vy = -320;
  renderer.drawCat(state);
  state.player.vy = 180;
  renderer.drawCat(state);

  const calls = context.calls.filter(
    (call) => call.name === "drawImage" && call.args[0] === sprite,
  );
  assert.deepEqual(calls.map((call) => call.args[1]), [100, 100]);
  assert.deepEqual(calls.map((call) => call.args[6]), [state.player.y - 4, state.player.y + 3]);
  assert.deepEqual(modules.getCatAirPresentation({ isGrounded: true, vy: -320 }), {
    yOffset: 0,
    phase: "ground",
  });
  assert.deepEqual(modules.getCatAirPresentation({ isGrounded: false, vy: -320 }), {
    yOffset: -4,
    phase: "rising",
  });
  assert.deepEqual(modules.getCatAirPresentation({ isGrounded: false, vy: 180 }), {
    yOffset: 3,
    phase: "falling",
  });

  state.player.isGrounded = before.player.isGrounded;
  state.player.isSliding = before.player.isSliding;
  state.player.vy = before.player.vy;
  assert.deepEqual(state, before);
});

test("vector cat fallback uses distinct airborne leg poses", async () => {
  const modules = await loadRenderModules();
  const context = createFakeContext();
  const renderer = modules.createSceneRenderer(context);
  const state = createState(modules);
  state.player.isGrounded = false;
  state.player.isSliding = false;
  state.player.vy = -220;
  renderer.drawCat(state);
  state.player.vy = 220;
  renderer.drawCat(state);

  const legCalls = context.calls.filter(
    (call) => call.name === "fillRect" && call.args[1] === 92,
  );
  assert.deepEqual(legCalls.slice(-4).map((call) => call.args[0]), [32, 46, 25, 53]);
});

test("loaded backgrounds repeat and move their far and near layers at different rates", async () => {
  const modules = await loadRenderModules();
  const context = createFakeContext();
  const backgroundSprite = {
    name: "background-sprite",
    naturalWidth: 1600,
    naturalHeight: 900,
  };
  const renderer = modules.createSceneRenderer(context, {
    getBackgroundSprite: () => backgroundSprite,
  });
  const state = createState(modules);
  state.worldOffset = 320;
  renderer.drawBackground(state);

  const backgroundCalls = context.calls.filter(
    (call) => call.name === "drawImage" && call.args[0] === backgroundSprite,
  );
  assert.equal(backgroundCalls.length, 4);
  assert.notEqual(backgroundCalls[0].args[1], backgroundCalls[1].args[1]);
  assert.equal(backgroundCalls[0].args.length, 5);
});

test("asset loader preloads once and keeps successful cat and background images", async () => {
  const modules = await loadRenderModules();
  const { FakeImage, createdSources } = createFakeImageCtor();
  const manifest = {
    cats: { black: { src: "/cat-black.png" } },
    backgrounds: { home_day: { src: "/home-day.png" } },
  };
  const loader = modules.createAssetLoader({ ImageCtor: FakeImage, manifest });

  const first = loader.preload();
  const second = loader.preload();
  assert.equal(first, second);
  await first;

  assert.deepEqual(createdSources, ["/cat-black.png", "/home-day.png"]);
  assert.equal(loader.getState().status, "ready");
  assert.ok(loader.getCatSprite("black"));
  assert.ok(loader.getBackgroundSprite("home_day"));
  assert.equal(loader.getCatPreviewSrc("black"), "/cat-black.png");
  assert.equal(loader.getCatPreviewSrc("unknown"), null);
});

test("asset loader preloads item sprites with type and variant keys", async () => {
  const modules = await loadRenderModules();
  const { FakeImage, createdSources } = createFakeImageCtor();
  const manifest = {
    cats: {},
    backgrounds: {},
    items: {
      obstacle: { box: { src: "/item-box.png" } },
      mouse: { toy: { src: "/item-mouse.png" } },
    },
  };
  const loader = modules.createAssetLoader({ ImageCtor: FakeImage, manifest });

  await loader.preload();

  assert.deepEqual(createdSources, ["/item-box.png", "/item-mouse.png"]);
  assert.ok(loader.getItemSprite("obstacle", "box"));
  assert.ok(loader.getItemSprite("mouse", "toy"));
  assert.equal(loader.getItemSprite("grass", "cat-grass"), null);
  assert.ok(loader.getState().items.has("obstacle:box"));
});

test("asset loader records missing or unsupported images and returns fallback nulls", async () => {
  const modules = await loadRenderModules();
  const manifest = {
    cats: { black: { src: "/cat-black.png" } },
    backgrounds: { home_day: { src: "/home-day.png" } },
  };
  const failing = createFakeImageCtor(new Set(["/home-day.png"]));
  const loader = modules.createAssetLoader({ ImageCtor: failing.FakeImage, manifest });

  await loader.preload();
  assert.ok(loader.getCatSprite("black"));
  assert.equal(loader.getBackgroundSprite("home_day"), null);
  assert.ok(loader.getState().failures.has("backgrounds:home_day"));

  const unsupported = modules.createAssetLoader({ ImageCtor: null, manifest });
  await unsupported.preload();
  assert.equal(unsupported.getCatSprite("black"), null);
  assert.ok(unsupported.getState().failures.has("cats:black"));
});

test("storybook asset manifest covers every playable cat and game zone", async () => {
  const modules = await loadRenderModules();
  const catIds = ["black", "white", "calico", "cheese", "mackerel", "chaos"];
  const zoneIds = ["home_day", "outside", "home_night"];
  const itemIds = {
    obstacle: ["box", "fence", "pot", "yarn"],
    mouse: ["toy"],
    grass: ["cat-grass"],
  };

  assert.deepEqual(modules.CAT_POSES, ["run", "jump", "slide"]);
  assert.deepEqual(Object.keys(modules.CAT_ASSET_MANIFEST), catIds);
  assert.deepEqual(Object.keys(modules.BACKGROUND_ASSET_MANIFEST), zoneIds);
  for (const definition of Object.values(modules.CAT_ASSET_MANIFEST)) {
    assert.equal(definition.frameCount, 3);
    assert.ok(definition.frameWidth > 0);
    assert.ok(definition.frameHeight > 0);
    assert.ok(fs.existsSync(path.join(__dirname, "..", "public", definition.src.slice(1))));
  }
  for (const definition of Object.values(modules.BACKGROUND_ASSET_MANIFEST)) {
    assert.ok(definition.width > 0);
    assert.ok(definition.height > 0);
    assert.ok(fs.existsSync(path.join(__dirname, "..", "public", definition.src.slice(1))));
  }
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(modules.ITEM_ASSET_MANIFEST).map(([type, variants]) => [
        type,
        Object.keys(variants),
      ]),
    ),
    itemIds,
  );
  for (const variants of Object.values(modules.ITEM_ASSET_MANIFEST)) {
    for (const definition of Object.values(variants)) {
      assert.ok(definition.width > 0);
      assert.ok(definition.height > 0);
      assert.ok(fs.existsSync(path.join(__dirname, "..", "public", definition.src.slice(1))));
    }
  }
});
