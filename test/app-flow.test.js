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

  remove() {
    const siblings = this.parentNode?.children;
    if (siblings) {
      const index = siblings.indexOf(this);
      if (index !== -1) {
        siblings.splice(index, 1);
      }
    }
    this.parentNode = null;
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
    const listeners = new Map();
    this.defaultView = {
      addEventListener(type, listener) {
        const current = listeners.get(type) || new Set();
        current.add(listener);
        listeners.set(type, current);
      },
      removeEventListener(type, listener) {
        listeners.get(type)?.delete(listener);
      },
      dispatch(type) {
        for (const listener of listeners.get(type) || []) {
          listener({ type });
        }
      },
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

test("bootstrap waits for font readiness and opens the welcome screen without API requests", async () => {
  const { createAppController, SCREEN_NAMES } = await import("../public/js/app/app-controller.js");
  const documentRef = createAppDocument();
  let resolveFonts;
  documentRef.fonts = {
    ready: new Promise((resolve) => {
      resolveFonts = resolve;
    }),
  };
  let fetchCalls = 0;
  const controller = createAppController({
    documentRef,
    fetchFn: async () => { fetchCalls += 1; },
  });

  const bootstrapping = controller.bootstrap();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(controller.getState().screen, SCREEN_NAMES.LOADING);
  assert.equal(fetchCalls, 0);

  resolveFonts();
  await bootstrapping;
  assert.equal(controller.getState().screen, SCREEN_NAMES.WELCOME);
  assert.equal(documentRef.getElementById("game-shell").dataset.screen, SCREEN_NAMES.WELCOME);
  assert.equal(fetchCalls, 0);
});

test("bootstrap renders the welcome screen without fetch", async () => {
  const { createAppController, SCREEN_NAMES } = await import("../public/js/app/app-controller.js");
  const documentRef = createAppDocument();
  const controller = createAppController({ documentRef, fetchFn: null });

  await controller.bootstrap();

  assert.equal(controller.getState().screen, SCREEN_NAMES.WELCOME);
  const screen = documentRef.getElementById("screen-root");
  assert.doesNotMatch(textOf(screen), /로컬 플레이|로컬로 플레이/);
  assert.equal(findAll(screen, (element) => element.tagName === "BUTTON")[0].textContent, "게임 시작");
  assert.equal(findAll(screen, (element) => element.tagName === "SMALL").length, 0);
  controller.destroy();
});

test("welcome start action enters character selection without network calls", async () => {
  const { createAppController, SCREEN_NAMES } = await import("../public/js/app/app-controller.js");
  const documentRef = createAppDocument();
  let fetchCalls = 0;
  const controller = createAppController({
    documentRef,
    fetchFn: async () => { fetchCalls += 1; },
  });

  await controller.bootstrap();

  const screen = documentRef.getElementById("screen-root");
  assert.equal(controller.getState().screen, SCREEN_NAMES.WELCOME);
  const startButton = findAll(screen, (element) => element.textContent === "게임 시작")[0];
  assert.equal(findAll(screen, (element) => element.tagName === "BUTTON").length, 1);
  startButton.dispatch("click");
  assert.equal(controller.getState().screen, SCREEN_NAMES.CHARACTER_SELECT);
  assert.equal(fetchCalls, 0);
  assert.doesNotMatch(textOf(screen), /\/auth\/guest/);
  controller.destroy();
});

test("bootstrap continues to the welcome screen when asset preloading fails", async () => {
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
  });

  await controller.bootstrap();

  assert.equal(preloadCalls, 1);
  assert.equal(controller.getState().screen, SCREEN_NAMES.WELCOME);
});

test("local character selection offers resume and new-game actions", async () => {
  const { createAppController, SCREEN_NAMES } = await import("../public/js/app/app-controller.js");
  const documentRef = createAppDocument();
  const candidate = {
    mode: "local",
    runId: "local-saved-run",
    catId: "white",
    seed: "saved-seed",
    snapshotVersion: 1,
    snapshot: {
      status: "paused",
      score: 77,
      elapsedMs: 450,
      zoneId: "outside",
      rhythm: {
        targets: [
          { id: "resume-target", x: 300, y: 220, radius: 30, button: "primary", status: "active", expiresAtMs: 900 },
        ],
        feedbackEvents: [
          { type: "hit", x: 250, y: 180, createdAtMs: 400, expiresAtMs: 800 },
        ],
        hitCount: 2,
        missCount: 1,
      },
      worldEntities: [
        { type: "obstacle", variant: "box", x: 900, y: 620, width: 80, height: 80 },
        { type: "obstacle", variant: "box", x: 100, y: 620, width: 80, height: 80 },
      ],
    },
    savedAt: 100,
  };
  let activeRun = candidate;
  let clearCalls = 0;
  let frameCallback = null;
  const localRunStore = {
    loadLocalRun: () => activeRun,
    saveLocalRun: (run) => { activeRun = run; return true; },
    clearLocalRun: () => { clearCalls += 1; activeRun = null; },
  };
  const controller = createAppController({
    documentRef,
    localRunStore,
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
      requestFrame: (callback) => { frameCallback = callback; return 1; },
      cancelFrame() {},
    },
  });

  controller.showCharacterSelect();
  const screen = documentRef.getElementById("screen-root");
  assert.equal(controller.getState().screen, SCREEN_NAMES.CHARACTER_SELECT);
  assert.equal(findAll(screen, (element) => element.className.includes("local-resume-modal")).length, 1);
  const continueButton = findAll(screen, (element) => element.textContent === "이어하기")[0];
  continueButton.dispatch("click");
  assert.equal(controller.getState().screen, SCREEN_NAMES.GAME);
  assert.equal(controller.getState().gameState.seed, "saved-seed");
  assert.equal(controller.getState().gameState.score, 77);
  assert.equal(controller.getState().gameState.zoneId, "outside");
  assert.equal(controller.getState().gameState.elapsedMs, 450);
  assert.equal(controller.getState().gameState.rhythm.hitCount, 2);
  assert.equal(controller.getState().gameState.rhythm.missCount, 1);
  assert.equal(controller.getState().gameState.rhythm.targets[0].status, "active");
  assert.deepEqual(controller.getState().gameState.rhythm.feedbackEvents, []);
  assert.deepEqual(
    controller.getState().gameState.worldEntities.map((entity) => entity.x),
    [100, 900],
  );
  assert.equal(controller.getState().gameState.status, "running");
  assert.equal(activeRun.runId, "local-saved-run");
  controller.destroy();

  activeRun = candidate;
  controller.showCharacterSelect();
  const newButton = findAll(screen, (element) => element.textContent === "새 게임")[0];
  newButton.dispatch("click");
  assert.equal(clearCalls, 1);
  assert.equal(activeRun, null);
  assert.equal(controller.getState().screen, SCREEN_NAMES.CHARACTER_SELECT);
  assert.equal(findAll(screen, (element) => element.className.includes("local-resume-modal")).length, 0);
  controller.destroy();
});

test("local runs save initial, one-second, and pagehide snapshots", async () => {
  const { createAppController } = await import("../public/js/app/app-controller.js");
  const documentRef = createAppDocument();
  const savedRuns = [];
  let frameCallback = null;
  const controller = createAppController({
    documentRef,
    localRunStore: {
      saveLocalRun: (run) => { savedRuns.push(structuredClone(run)); return true; },
      loadLocalRun: () => null,
      clearLocalRun() {},
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
      requestFrame: (callback) => { frameCallback = callback; return 1; },
      cancelFrame() {},
    },
  });

  await controller.startGame("calico");
  assert.equal(savedRuns.length, 1);
  assert.equal(savedRuns[0].mode, "local");
  assert.equal(typeof savedRuns[0].runId, "string");
  assert.equal("userId" in savedRuns[0], false);
  assert.equal("expiresAt" in savedRuns[0], false);
  frameCallback(0);
  controller.getState().gameState.elapsedMs = 999;
  frameCallback(1);
  assert.equal(savedRuns.length, 1);
  controller.getState().gameState.elapsedMs = 1000;
  frameCallback(2);
  assert.equal(savedRuns.length, 2);
  controller.getState().gameState.elapsedMs = 1500;
  frameCallback(3);
  assert.equal(savedRuns.length, 2);
  documentRef.defaultView.dispatch("pagehide");
  assert.equal(savedRuns.length, 3);
  assert.equal(savedRuns[2].snapshot.elapsedMs, 1500);
  controller.destroy();
});

test("gameplay misclicks lower accuracy and leave rhythm targets available", async () => {
  const { createAppController } = await import("../public/js/app/app-controller.js");
  const documentRef = createAppDocument();
  const controller = createAppController({
    documentRef,
    localRunStore: {
      loadLocalRun: () => null,
      saveLocalRun: () => true,
      clearLocalRun() {},
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

  await controller.startGame("black");
  const gameState = controller.getState().gameState;
  const target = {
    id: "test-target",
    x: 500,
    y: 200,
    radius: 30,
    button: "primary",
    status: "active",
    expiresAtMs: 5000,
  };
  gameState.rhythm.targets = [target];
  const canvas = documentRef.getElementById("game-canvas");

  canvas.dispatch("pointerdown", { button: 0, clientX: 10, clientY: 10 });
  assert.equal(gameState.rhythm.missCount, 1);
  assert.equal(target.status, "active");
  assert.deepEqual(
    [gameState.rhythm.feedbackEvents[0].type, gameState.rhythm.feedbackEvents[0].x, gameState.rhythm.feedbackEvents[0].y],
    ["miss", 10, 10],
  );

  canvas.dispatch("pointerdown", { button: 0, clientX: 500, clientY: 200 });
  assert.equal(gameState.rhythm.hitCount, 1);
  assert.equal(gameState.rhythm.missCount, 1);
  assert.equal(target.status, "hit");
  assert.equal(gameState.rhythm.feedbackEvents[1].type, "hit");

  canvas.dispatch("pointerdown", { button: 0, clientX: 20, clientY: 30 });
  assert.equal(gameState.rhythm.missCount, 2);
  assert.equal(gameState.rhythm.feedbackEvents[2].type, "miss");
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
  assert.ok(cards[5].children[0].src.endsWith("/assets/cat-runner/cats/chaos.png"));
  assert.equal(cards[5].dataset.catId, "chaos");
  assert.equal(cards[5].dataset.englishName, "Mayhem");
  for (const card of cards) {
    const stats = card.children[4];
    assert.equal(stats.tagName, "UL");
    assert.equal(card.dataset.statCount, "3");
    assert.equal(stats.children.length, 3);
    assert.deepEqual(
      Array.from(stats.children, (row) => row.dataset.statKey),
      ["speed", "health", "itemDuration"],
    );
    assert.equal(textOf(stats).includes("슬라이드"), false);
    assert.equal(textOf(stats).includes("낙사 저항"), false);
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

test("result screen shows local save failure without a server retry or rank", async () => {
  const { createResultScreen } = await import("../public/js/ui/result-screen.js");
  const documentRef = createAppDocument();
  const root = documentRef.createElement("section");
  let restarted = 0;
  let opened = 0;
  createResultScreen(
    {
      score: 42,
      distanceM: 12.5,
      mouseCount: 3,
      rank: 2,
      saved: false,
      rhythmAccuracy: 0.5,
      rhythmMultiplier: 1,
      errorMessage: "저장하지 못했습니다.",
    },
    {
      onRestart: () => { restarted += 1; },
      onLeaderboard: () => { opened += 1; },
    },
    { documentRef },
  ).mount(root);

  assert.match(textOf(root), /저장하지 못했습니다/);
  assert.doesNotMatch(textOf(root), /순위표 순위/);
  assert.match(textOf(root), /50%/);
  assert.match(textOf(root), /x1\.00/);
  const buttons = findAll(root, (element) => element.tagName === "BUTTON");
  assert.equal(buttons.length, 2);
  assert.deepEqual(buttons.map((button) => button.textContent), ["캐릭터 선택", "내 기록"]);
  assert.doesNotMatch(textOf(root), /개인기록표/);
  assert.equal(buttons.some((button) => button.textContent === "저장 재시도"), false);
  buttons.find((button) => button.textContent === "캐릭터 선택").dispatch("click");
  buttons.find((button) => button.textContent === "내 기록").dispatch("click");
  assert.deepEqual({ restarted, opened }, { restarted: 1, opened: 1 });
});

test("local leaderboard renders personal top five and latest result without server calls", async () => {
  const { createLeaderboardPanel } = await import("../public/js/ui/leaderboard.js");
  const documentRef = createAppDocument();
  const root = documentRef.createElement("section");
  const panel = createLeaderboardPanel(
    {},
    {
      documentRef,
      localStore: {
        getLocalScores: () => [
          { score: 50, distanceM: 20, catId: "white", rhythmAccuracy: 0.9, rhythmMultiplier: 1.4, achievedAt: 1 },
          { score: 40, distanceM: 18, catId: "black", rhythmAccuracy: 0.8, rhythmMultiplier: 1.3, achievedAt: 2 },
        ],
        getLastResult: () => ({
          score: 5,
          distanceM: 3,
          catId: "chaos",
          rhythmAccuracy: 0.25,
          rhythmMultiplier: 0.75,
          achievedAt: 3,
        }),
      },
    },
  );
  panel.mount(root);
  assert.match(textOf(root), /내 기록 상위 5개/);
  assert.match(textOf(root), /방금 기록/);
  assert.match(textOf(root), /점수 5/);
  assert.match(textOf(root), /정확도 25%/);
  assert.match(textOf(root), /정확도 보정 x0\.75/);
  assert.match(textOf(root), /90%/);
  assert.match(textOf(root), /x1\.40/);
  assert.match(textOf(root), /80%/);
  assert.match(textOf(root), /x1\.30/);
  assert.equal(findAll(root, (element) => element.tagName === "TR").length, 3);
  assert.equal(findAll(root, (element) => element.className === "current-result").length, 1);
});

test("local leaderboard clamps accuracy and formats a zero multiplier", async () => {
  const { createLeaderboardPanel } = await import("../public/js/ui/leaderboard.js");
  const documentRef = createAppDocument();
  const root = documentRef.createElement("section");
  createLeaderboardPanel(
    {},
    {
      documentRef,
      localStore: {
        getLocalScores: () => [{
          score: 8,
          distanceM: 2,
          catId: "black",
          rhythmAccuracy: 1.5,
          rhythmMultiplier: 0,
          achievedAt: 1,
        }],
        getLastResult: () => null,
      },
    },
  ).mount(root);

  assert.match(textOf(root), /정확도/);
  assert.match(textOf(root), /100%/);
  assert.match(textOf(root), /x0\.00/);
});

test("empty local leaderboard shows a non-error state", async () => {
  const { createLeaderboardPanel } = await import("../public/js/ui/leaderboard.js");
  const documentRef = createAppDocument();
  const root = documentRef.createElement("section");
  createLeaderboardPanel(
    {},
    {
      documentRef,
      localStore: { getLocalScores: () => [], getLastResult: () => null },
    },
  ).mount(root);
  assert.match(textOf(root), /아직 저장된 기록이 없습니다/);
  assert.equal(findAll(root, (element) => element.className === "form-error").length, 0);
  assert.equal(findAll(root, (element) => element.className === "leaderboard-empty")[0].hidden, false);
  assert.equal(findAll(root, (element) => element.textContent === "다시 시도").length, 0);
});

test("local gameover saves the latest result and opens My Records offline", async () => {
  const { createAppController, SCREEN_NAMES } = await import("../public/js/app/app-controller.js");
  const documentRef = createAppDocument();
  const records = [];
  let latest = null;
  let saveCalls = 0;
  let lastResultCalls = 0;
  let activeRunClearCalls = 0;
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
    clearLocalRun: () => { activeRunClearCalls += 1; },
  };
  const controller = createAppController({
    documentRef,
    localRunStore,
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

  await controller.startGame("black");
  controller.getState().gameState.health = 0;
  frameTime = 0;
  frameCallback(frameTime);
  frameTime = 50;
  frameCallback(frameTime);
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(saveCalls, 1);
  assert.equal(lastResultCalls, 1);
  assert.equal(activeRunClearCalls, 1);
  assert.equal(controller.getState().screen, SCREEN_NAMES.RESULT);
  assert.match(textOf(documentRef.getElementById("screen-root")), /내 기록에 저장되었습니다/);
  assert.match(textOf(documentRef.getElementById("screen-root")), /개인 순위: 1위/);
  const resultButtons = findAll(documentRef.getElementById("screen-root"), (element) => element.tagName === "BUTTON");
  assert.deepEqual(resultButtons.map((button) => button.textContent), ["캐릭터 선택", "내 기록"]);
  resultButtons.find((button) => button.textContent === "내 기록").dispatch("click");
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(controller.getState().screen, SCREEN_NAMES.LEADERBOARD);
  assert.match(textOf(documentRef.getElementById("screen-root")), /내 기록 상위 5개/);
  assert.match(textOf(documentRef.getElementById("screen-root")), /방금 기록/);
  assert.match(textOf(documentRef.getElementById("screen-root")), /정확도 \d+%/);
  assert.match(textOf(documentRef.getElementById("screen-root")), /정확도 보정 x\d+\.\d{2}/);
  assert.equal(findAll(documentRef.getElementById("screen-root"), (element) => element.tagName === "TR").length, 2);
  findAll(documentRef.getElementById("screen-root"), (element) => element.textContent === "뒤로")[0].dispatch("click");
  assert.equal(controller.getState().screen, SCREEN_NAMES.RESULT);
  assert.match(textOf(documentRef.getElementById("screen-root")), /개인 순위: 1위/);
  controller.destroy();
});

test("local fallback result keeps rank and explains session-only persistence", async () => {
  const { createAppController, SCREEN_NAMES } = await import("../public/js/app/app-controller.js");
  const documentRef = createAppDocument();
  const records = [{ score: 25, distanceM: 10, rhythmAccuracy: 0.8, rhythmMultiplier: 1.3, achievedAt: 1 }];
  let latest = null;
  let frameCallback = null;
  let frameTime = 0;
  const localRunStore = {
    getLocalScores: () => records,
    getLastResult: () => latest,
    getLocalRank: () => 2,
    getStorageStatus: () => ({ persistent: false, warning: true }),
    saveLocalResult: (record) => {
      records.unshift(record);
      return {
        saved: true,
        persisted: false,
        warning: true,
        ranked: true,
        rank: 2,
        record,
        entries: records.slice(0, 5),
        totalEntries: records.length,
      };
    },
    saveLastResult: (record) => {
      latest = record;
      return true;
    },
  };
  const controller = createAppController({
    documentRef,
    localRunStore,
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

  await controller.startGame("black");
  controller.getState().gameState.health = 0;
  frameTime = 0;
  frameCallback(frameTime);
  frameTime = 50;
  frameCallback(frameTime);
  await new Promise((resolve) => setTimeout(resolve, 0));

  const screen = documentRef.getElementById("screen-root");
  assert.equal(controller.getState().screen, SCREEN_NAMES.RESULT);
  assert.equal(controller.getState().lastResult.saved, true);
  assert.equal(controller.getState().lastResult.persisted, false);
  assert.equal(controller.getState().lastResult.storageWarning, true);
  assert.match(textOf(screen), /현재 세션에 기록되었습니다/);
  assert.doesNotMatch(textOf(screen), /저장 재시도/);

  assert.match(textOf(screen), /현재 세션에 기록되었습니다/);
  findAll(screen, (element) => element.tagName === "BUTTON")
    .find((button) => button.textContent === "내 기록")
    .dispatch("click");
  assert.equal(controller.getState().screen, SCREEN_NAMES.LEADERBOARD);
  assert.equal(findAll(screen, (element) => element.tagName === "TR").length, 3);
  assert.match(textOf(screen), /방금 기록/);
  assert.match(textOf(screen), /80% x1\.30/);
  controller.destroy();
});

test("local result shows save failure without server retry and exposes separate actions", async () => {
  const { createResultScreen } = await import("../public/js/ui/result-screen.js");
  const documentRef = createAppDocument();
  const root = documentRef.createElement("section");
  let localScoresOpened = 0;
  createResultScreen(
    {
      score: 10,
      distanceM: 4,
      mouseCount: 1,
      saved: false,
      localOnly: true,
      rank: null,
    },
    {
      onLeaderboard: () => { localScoresOpened += 1; },
    },
    { documentRef },
  ).mount(root);

  assert.equal(findAll(root, (element) => element.className === "local-mode-badge").length, 0);
  assert.match(textOf(root), /내 기록에 저장하지 못했습니다/);
  assert.doesNotMatch(textOf(root), /로컬 플레이/);
  assert.equal(findAll(root, (element) => element.tagName === "BUTTON").length, 2);
  const buttons = findAll(root, (element) => element.tagName === "BUTTON");
  assert.deepEqual(buttons.map((button) => button.textContent), ["캐릭터 선택", "내 기록"]);
  assert.doesNotMatch(textOf(root), /개인기록표/);
  buttons.find((button) => button.textContent === "내 기록").dispatch("click");
  assert.equal(localScoresOpened, 1);
  assert.equal(findAll(root, (element) => element.className === "result-rank").length, 0);
});
