const assert = require("node:assert/strict");
const { test } = require("node:test");

class FakeElement {
  constructor(documentRef, tagName) {
    this.ownerDocument = documentRef;
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.listeners = new Map();
    this.attributes = new Map();
    this.dataset = {};
    this.className = "";
    this.textContent = "";
    this.hidden = false;
    this.disabled = false;
    this.value = "";
    this.checked = false;
    this.style = {};
  }

  append(...children) {
    for (const child of children) {
      if (child && typeof child === "object") {
        child.parentNode = this;
        this.children.push(child);
      }
    }
  }

  replaceChildren(...children) {
    this.children = [];
    this.append(...children);
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatch(type, event = {}) {
    const nextEvent = {
      target: this,
      preventDefault() {
        nextEvent.defaultPrevented = true;
      },
      ...event,
    };
    for (const listener of this.listeners.get(type) || []) {
      listener(nextEvent);
    }
    return nextEvent;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) || null;
  }

  focus() {}
}

class FakeDocument {
  constructor() {
    this.defaultView = {
      addEventListener() {},
      removeEventListener() {},
    };
    this.elements = new Map();
  }

  createElement(tagName) {
    return new FakeElement(this, tagName);
  }

  getElementById(id) {
    return this.elements.get(id) || null;
  }

  register(id, element) {
    this.elements.set(id, element);
    return element;
  }
}

function createAppDocument() {
  const documentRef = new FakeDocument();
  documentRef.register("screen-root", documentRef.createElement("section"));
  documentRef.register("game-canvas", documentRef.createElement("canvas"));
  documentRef.register("game-shell", documentRef.createElement("main"));
  return documentRef;
}

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

function findAll(element, predicate) {
  const found = [];
  for (const child of element.children || []) {
    if (predicate(child)) {
      found.push(child);
    }
    found.push(...findAll(child, predicate));
  }
  return found;
}

function textOf(element) {
  return [element.textContent || "", ...(element.children || []).map(textOf)].join(" ");
}

test("unauthenticated bootstrap shows sign-in and never enters character selection", async () => {
  const { createAppController, SCREEN_NAMES } = await import("../public/js/app/app-controller.js");
  const documentRef = createAppDocument();
  const controller = createAppController({
    documentRef,
    fetchFn: async () => jsonResponse({ authenticated: false }),
  });

  await controller.bootstrap();

  assert.equal(controller.getState().screen, SCREEN_NAMES.AUTH);
  assert.equal(documentRef.getElementById("screen-root").children[0].className, "auth-screen flow-card");
  assert.equal(findAll(documentRef.getElementById("screen-root"), (element) => element.tagName === "A").length, 1);
  assert.match(textOf(documentRef.getElementById("screen-root")), /Microsoft Entra ID로 로그인/);
});

test("missing auth configuration renders setup guidance without a secret", async () => {
  const { createAppController, SCREEN_NAMES } = await import("../public/js/app/app-controller.js");
  const documentRef = createAppDocument();
  const controller = createAppController({
    documentRef,
    fetchFn: async () => jsonResponse({ error: { code: "AUTH_CONFIG_MISSING" } }, 503),
  });

  await controller.bootstrap();

  const screen = documentRef.getElementById("screen-root");
  assert.equal(controller.getState().screen, SCREEN_NAMES.AUTH_CONFIG_ERROR);
  assert.equal(screen.children[0].dataset.state, "auth-config-error");
  assert.doesNotMatch(textOf(screen), /client-secret-value/);
});

test("guest mode adds a local play button to the auth screen", async () => {
  const { createAppController, SCREEN_NAMES } = await import("../public/js/app/app-controller.js");
  const documentRef = createAppDocument();
  const controller = createAppController({
    documentRef,
    fetchFn: async () => jsonResponse({ authenticated: false, guestMode: true }),
  });

  await controller.bootstrap();

  const screen = documentRef.getElementById("screen-root");
  assert.equal(controller.getState().screen, SCREEN_NAMES.AUTH);
  const links = findAll(screen, (element) => element.tagName === "A");
  assert.equal(links.length, 2);
  assert.equal(links[1].href, "/auth/guest");
  assert.match(textOf(screen), /게스트로 플레이/);
});

test("bootstrap continues to the sign-in screen when asset preloading fails", async () => {
  const { createAppController, SCREEN_NAMES } = await import("../public/js/app/app-controller.js");
  const documentRef = createAppDocument();
  let preloadCalls = 0;
  const controller = createAppController({
    documentRef,
    assetLoader: {
      preload: async () => {
        preloadCalls += 1;
        throw new Error("asset unavailable");
      },
    },
    fetchFn: async () => jsonResponse({ authenticated: false }),
  });

  await controller.bootstrap();

  assert.equal(preloadCalls, 1);
  assert.equal(controller.getState().screen, SCREEN_NAMES.AUTH);
});

test("authenticated users without a nickname receive nickname onboarding", async () => {
  const { createAppController, SCREEN_NAMES } = await import("../public/js/app/app-controller.js");
  const documentRef = createAppDocument();
  let savedUser = null;
  const controller = createAppController({
    documentRef,
    fetchFn: async (url, request = {}) => {
      if (request.method === "PATCH") {
        savedUser = { id: "user-1", email: "cat@example.com", nickname: "same-name" };
        return jsonResponse({ user: savedUser });
      }
      return jsonResponse({
        authenticated: true,
        user: { id: "user-1", email: "cat@example.com", nickname: null },
      });
    },
  });

  await controller.bootstrap();
  assert.equal(controller.getState().screen, SCREEN_NAMES.NICKNAME);
  const screen = documentRef.getElementById("screen-root");
  const input = findAll(screen, (element) => element.tagName === "INPUT")[0];
  const form = findAll(screen, (element) => element.tagName === "FORM")[0];
  input.value = "same-name";
  form.dispatch("submit");
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(savedUser, controller.getState().user);
  assert.equal(controller.getState().screen, SCREEN_NAMES.CHARACTER_SELECT);
});

test("gameover character selection skips resume lookup while normal selection keeps it", async () => {
  const { createAppController, SCREEN_NAMES } = await import("../public/js/app/app-controller.js");
  const documentRef = createAppDocument();
  let resumeLookups = 0;
  const controller = createAppController({
    documentRef,
    fetchFn: async () => jsonResponse({
      authenticated: true,
      user: { id: "user-1", nickname: "runner" },
    }),
    runApiClient: {
      getResumableRun: async () => {
        resumeLookups += 1;
        return { run: null };
      },
    },
  });

  await controller.bootstrap();
  await new Promise((resolve) => setTimeout(resolve, 0));
  const bootstrapLookups = resumeLookups;
  assert.equal(controller.getState().screen, SCREEN_NAMES.CHARACTER_SELECT);

  controller.showCharacterSelect({ allowResume: false });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(resumeLookups, bootstrapLookups);
  assert.equal(findAll(documentRef.getElementById("screen-root"), (element) => element.className === "resume-modal flow-card").length, 0);

  controller.showCharacterSelect();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(resumeLookups, bootstrapLookups + 1);
  controller.destroy();
});

test("character selection renders six cats and defaults each new run to black", async () => {
  const { createCharacterSelect } = await import("../public/js/ui/character-select.js");
  const documentRef = createAppDocument();
  const root = documentRef.createElement("section");
  let started = null;
  const select = createCharacterSelect((value) => {
    started = value;
  }, { documentRef });

  select.mount(root);
  const section = root.children[0];
  const cards = section.children[2].children;
  assert.deepEqual(select.getCatIds(), ["black", "white", "calico", "cheese", "mackerel", "chaos"]);
  assert.equal(cards.length, 6);
  assert.match(cards[0].className, /selected/);
  assert.equal(cards[0].children[0].tagName, "IMG");
  assert.equal(cards[0].children[0].alt, "검정 고양이 모습");
  assert.equal(cards[5].children[0].src, "/assets/cat-runner/cats/chaos.png");
  assert.equal(cards[5].dataset.catId, "chaos");
  assert.equal(cards[5].dataset.englishName, "Mayhem");
  for (const card of cards) {
    const stats = card.children[4];
    assert.equal(stats.tagName, "UL");
    assert.equal(stats.children.length, 9);
    assert.ok(stats.children.every((row) => row.getAttribute("aria-label").endsWith("/5")));
    assert.ok(stats.children.every((row) => row.children[1].children.length === 5));
  }
  const localModeNote = section.children[4];
  assert.equal(localModeNote.className, "local-mode-note");
  assert.equal(localModeNote.dataset.mode, "local");
  cards[0].children[0].dispatch("error");
  assert.equal(cards[0].children[0].hidden, true);
  assert.equal(cards[0].getAttribute("aria-pressed"), "true");
  assert.match(textOf(section), /이번 달리기의 고양이를 골라주세요/);
  assert.match(textOf(section), /이 고양이로 달리기/);

  cards[4].dispatch("click");
  assert.match(section.children[2].children[4].className, /selected/);
  section.children[3].dispatch("click");
  assert.deepEqual(started, { catId: "mackerel" });
});

test("result screen shows local retry state without claiming an unsaved rank", async () => {
  const { createResultScreen } = await import("../public/js/ui/result-screen.js");
  const documentRef = createAppDocument();
  const root = documentRef.createElement("section");
  let retries = 0;
  let restarted = 0;
  let opened = 0;
  createResultScreen(
    {
      score: 42,
      distanceM: 12.5,
      mouseCount: 3,
      rank: 2,
      saved: false,
      errorMessage: "저장하지 못했습니다.",
    },
    {
      onRetry: () => { retries += 1; },
      onRestart: () => { restarted += 1; },
      onLeaderboard: () => { opened += 1; },
    },
    { documentRef },
  ).mount(root);

  assert.match(textOf(root), /저장하지 못했습니다/);
  assert.doesNotMatch(textOf(root), /순위표 순위/);
  const buttons = findAll(root, (element) => element.tagName === "BUTTON");
  buttons[0].dispatch("click");
  buttons[1].dispatch("click");
  buttons[2].dispatch("click");
  assert.deepEqual({ retries, restarted, opened }, { retries: 1, restarted: 1, opened: 1 });
});

test("leaderboard renders full email and XSS-like values as text, with retry", async () => {
  const { createLeaderboardPanel } = await import("../public/js/ui/leaderboard.js");
  const documentRef = createAppDocument();
  const root = documentRef.createElement("section");
  let calls = 0;
  const panel = createLeaderboardPanel(
    {
      getLeaderboard: async () => {
        calls += 1;
        if (calls === 1) {
          throw new Error("temporary");
        }
        return {
          entries: [{
            rank: 1,
            nickname: "<script>alert(1)</script>",
            email: "full-address@example.com",
            score: 99,
            distanceM: 25.5,
          }],
        };
      },
    },
    {},
    { documentRef },
  );
  panel.mount(root);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.match(textOf(root), /순위표를 불러오지 못했습니다/);
  const retry = findAll(root, (element) => element.tagName === "BUTTON")[0];
  retry.dispatch("click");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.match(textOf(root), /<script>alert\(1\)<\/script>/);
  assert.match(textOf(root), /full-address@example.com/);
  assert.match(textOf(root), /순위표/);
  assert.match(textOf(root), /이메일/);
  assert.equal(findAll(root, (element) => element.tagName === "TR").length, 2);
});

test("local leaderboard renders personal top five and latest result without server calls", async () => {
  const { createLeaderboardPanel } = await import("../public/js/ui/leaderboard.js");
  const documentRef = createAppDocument();
  const root = documentRef.createElement("section");
  let serverCalls = 0;
  const panel = createLeaderboardPanel(
    {
      getLeaderboard: async () => {
        serverCalls += 1;
        return { entries: [] };
      },
    },
    {},
    {
      documentRef,
      mode: "local",
      localStore: {
        getLocalScores: () => [
          { score: 50, distanceM: 20, catId: "white", achievedAt: 1 },
          { score: 40, distanceM: 18, catId: "black", achievedAt: 2 },
        ],
        getLastResult: () => ({ score: 5, distanceM: 3, catId: "chaos", achievedAt: 3 }),
      },
    },
  );
  panel.mount(root);
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(serverCalls, 0);
  assert.match(textOf(root), /내 점수순위/);
  assert.match(textOf(root), /전체 순위/);
  assert.match(textOf(root), /로그인 후 제공됩니다/);
  assert.match(textOf(root), /방금 기록/);
  assert.match(textOf(root), /점수 5/);
  assert.equal(findAll(root, (element) => element.tagName === "TR").length, 3);
  const globalTab = findAll(root, (element) => element.dataset.tab === "global")[0];
  assert.equal(globalTab.disabled, true);
  assert.equal(findAll(root, (element) => element.className === "current-result").length, 1);
});

test("empty local leaderboard shows a non-error state", async () => {
  const { createLeaderboardPanel } = await import("../public/js/ui/leaderboard.js");
  const documentRef = createAppDocument();
  const root = documentRef.createElement("section");
  createLeaderboardPanel(
    null,
    {},
    {
      documentRef,
      mode: "local",
      localStore: { getLocalScores: () => [], getLastResult: () => null },
    },
  ).mount(root);
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(textOf(root), /아직 저장된 기록이 없습니다/);
  assert.equal(findAll(root, (element) => element.className === "form-error").length, 1);
  assert.equal(findAll(root, (element) => element.className === "leaderboard-empty")[0].hidden, false);
  assert.equal(findAll(root, (element) => element.textContent === "다시 시도").length, 0);
});

test("local gameover saves the latest result and opens the local leaderboard offline", async () => {
  const { createAppController, SCREEN_NAMES } = await import("../public/js/app/app-controller.js");
  const documentRef = createAppDocument();
  const records = [];
  let latest = null;
  let saveCalls = 0;
  let lastResultCalls = 0;
  let serverCalls = 0;
  let frameCallback = null;
  let frameTime = 0;
  const localRunStore = {
    getLocalScores: () => records,
    getLastResult: () => latest,
    saveLocalResult: (record) => {
      saveCalls += 1;
      records.push(record);
      return { saved: true, ranked: true, rank: 1, record, entries: records };
    },
    saveLastResult: (record) => {
      lastResultCalls += 1;
      latest = record;
      return true;
    },
  };
  const controller = createAppController({
    documentRef,
    localRunStore,
    runApiClient: {
      getLeaderboard: async () => {
        serverCalls += 1;
        return { entries: [] };
      },
    },
    audioManagerFactory: () => ({
      unlock: async () => {},
      startMusic() {},
      stopMusic() {},
      playSfx() {},
      destroy() {},
    }),
    settingsPanelFactory: () => ({ mount() {} }),
    gameClock: {
      now: () => frameTime,
      requestFrame: (callback) => {
        frameCallback = callback;
        return 1;
      },
      cancelFrame() {},
    },
  });

  await controller.startGame("black", { runMode: "local" });
  controller.getState().gameState.health = 0;
  frameTime = 0;
  frameCallback(frameTime);
  frameTime = 50;
  frameCallback(frameTime);
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(saveCalls, 1);
  assert.equal(lastResultCalls, 1);
  assert.equal(controller.getState().screen, SCREEN_NAMES.RESULT);
  const resultButtons = findAll(documentRef.getElementById("screen-root"), (element) => element.tagName === "BUTTON");
  resultButtons.find((button) => button.textContent === "순위표").dispatch("click");
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(controller.getState().screen, SCREEN_NAMES.LEADERBOARD);
  assert.equal(serverCalls, 0);
  assert.match(textOf(documentRef.getElementById("screen-root")), /방금 기록/);
  controller.destroy();
});

test("API client preserves a pending result and signals sign-in on 401", async () => {
  const {
    createApiClient,
    loadPendingResult,
    mapApiError,
  } = await import("../public/js/app/api-client.js");
  const storage = new Map();
  const localStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  let redirected = 0;
  const api = createApiClient(
    async () => jsonResponse({ error: { code: "AUTH_REQUIRED" } }, 401),
    { storage: localStorage, onUnauthorized: () => { redirected += 1; } },
  );

  await assert.rejects(
    api.post("/api/runs/complete", {}, { pendingResult: { score: 55 } }),
    (error) => error.code === "AUTH_REQUIRED" && error.retryable === false,
  );
  assert.deepEqual(loadPendingResult(localStorage), { score: 55 });
  assert.equal(redirected, 1);
  assert.deepEqual(mapApiError({ code: "NEW_SERVER_ERROR", message: "English error" }), {
    code: "UNKNOWN_ERROR",
    status: null,
    message: "요청을 처리하지 못했습니다. 다시 시도해주세요.",
    retryable: true,
  });
});

test("authenticated runs wait for server confirmation before starting the game", async () => {
  const { createAppController, SCREEN_NAMES } = await import("../public/js/app/app-controller.js");
  const documentRef = createAppDocument();
  let resolveStart;
  const startGate = new Promise((resolve) => {
    resolveStart = resolve;
  });
  const calls = [];
  const controller = createAppController({
    documentRef,
    fetchFn: async () => jsonResponse({
      authenticated: true,
      user: { id: "user-1", nickname: "runner" },
    }),
    runApiClient: {
      startRun: async (payload) => {
        calls.push(payload);
        await startGate;
        return { runId: "server-run", catId: payload.catId, seed: "seed", expiresAt: 5000 };
      },
    },
    audioManagerFactory: () => ({
      unlock: async () => {},
      startMusic() {},
      stopMusic() {},
      playSfx() {},
      destroy() {},
    }),
    settingsPanelFactory: () => ({ mount() {} }),
    gameClock: {
      now: () => 0,
      requestFrame: () => 1,
      cancelFrame() {},
    },
  });

  await controller.bootstrap();
  const starting = controller.startGame("black");
  await Promise.resolve();
  assert.equal(controller.getState().screen, SCREEN_NAMES.CHARACTER_SELECT);
  assert.equal(controller.getState().gameState, null);
  assert.deepEqual(calls, [{ userId: "user-1", catId: "black" }]);

  resolveStart();
  await starting;
  assert.equal(controller.getState().screen, SCREEN_NAMES.GAME);
  assert.equal(controller.getState().runMode, "server");
  controller.destroy();
});

test("failed server start exposes safe retry/local actions and local mode avoids sync calls", async () => {
  const { createAppController, SCREEN_NAMES } = await import("../public/js/app/app-controller.js");
  const documentRef = createAppDocument();
  const logs = [];
  let startCalls = 0;
  const controller = createAppController({
    documentRef,
    fetchFn: async () => jsonResponse({
      authenticated: true,
      user: { id: "user-1", nickname: "runner" },
    }),
    runApiClient: {
      startRun: async () => {
        startCalls += 1;
        const error = new Error("secret request details");
        error.code = "NETWORK_ERROR";
        error.status = 503;
        throw error;
      },
    },
    logger: { error: (...args) => logs.push(args) },
    audioManagerFactory: () => ({
      unlock: async () => {},
      startMusic() {},
      stopMusic() {},
      playSfx() {},
      destroy() {},
    }),
    settingsPanelFactory: () => ({ mount() {} }),
    gameClock: {
      now: () => 0,
      requestFrame: () => 1,
      cancelFrame() {},
    },
  });

  await controller.bootstrap();
  await controller.startGame("chaos");

  const screen = documentRef.getElementById("screen-root");
  const modal = findAll(screen, (element) => element.className === "start-error-modal flow-card")[0];
  assert.ok(modal);
  assert.doesNotMatch(textOf(modal), /secret request details/);
  assert.equal(logs.length, 1);
  assert.deepEqual(logs[0], ["Run start failed", { status: 503, code: "NETWORK_ERROR" }]);
  const actions = findAll(modal, (element) => element.tagName === "BUTTON");
  assert.equal(actions.length, 2);

  actions[1].dispatch("click");
  assert.equal(controller.getState().screen, SCREEN_NAMES.GAME);
  assert.equal(controller.getState().runMode, "local");
  assert.equal(startCalls, 1);
  controller.destroy();
});

test("local result is visibly excluded from ranking without a retry action", async () => {
  const { createResultScreen } = await import("../public/js/ui/result-screen.js");
  const documentRef = createAppDocument();
  const root = documentRef.createElement("section");
  createResultScreen(
    {
      score: 10,
      distanceM: 4,
      mouseCount: 1,
      saved: false,
      localOnly: true,
      rank: null,
      errorMessage: "local only",
    },
    { onRetry: () => assert.fail("local results must not retry server completion") },
    { documentRef },
  ).mount(root);

  assert.equal(findAll(root, (element) => element.className === "local-mode-badge").length, 1);
  assert.match(textOf(root), /local only/);
  assert.equal(findAll(root, (element) => element.tagName === "BUTTON").length, 2);
  assert.equal(findAll(root, (element) => element.className === "result-rank").length, 0);
});
