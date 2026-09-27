const test = require("node:test");
const assert = require("node:assert/strict");

async function loadAudio() {
  return import("../public/js/audio/audio-manager.js");
}

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
}

function createProviderRecorder() {
  return {
    plays: [],
    notes: [],
    play(name, volume) {
      this.plays.push({ name, volume });
    },
    playMusicNote(index, volume) {
      this.notes.push({ index, volume });
    },
    stopAll() {},
    destroy() {},
  };
}

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = new Map();
    this.listeners = new Map();
    this.className = "";
    this.hidden = false;
    this.textContent = "";
  }

  append(...children) {
    this.children.push(...children);
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) || null;
  }
}

function createFakeDocument() {
  return {
    createElement: (tagName) => new FakeElement(tagName),
  };
}

test("audio settings persist independently through injected storage", async () => {
  const { createAudioManager } = await loadAudio();
  const storage = createStorage();
  const first = createAudioManager(storage);
  first.setMusicVolume(0.25);
  first.setSfxVolume(0.75);
  first.setMuted(true);

  const second = createAudioManager(storage);
  assert.deepEqual(second.getSettings(), {
    muted: true,
    musicVolume: 0.25,
    sfxVolume: 0.75,
  });
});

test("unlock enables sfx and music, while mute silences both", async () => {
  const { createAudioManager } = await loadAudio();
  const provider = createProviderRecorder();
  const context = {
    resume: async () => {},
  };
  const manager = createAudioManager(createStorage(), {
    audioContextFactory: () => context,
    providerFactory: () => provider,
    musicSequencerFactory: (nextProvider) => ({
      start() {
        nextProvider.playMusicNote(0, 0.1);
      },
      stop() {},
      isRunning: () => false,
    }),
  });

  assert.equal(await manager.unlock(), true);
  manager.playSfx("jump");
  manager.startMusic();
  assert.equal(provider.plays.length, 1);
  assert.equal(provider.notes.length, 1);
  manager.setMuted(true);
  manager.playSfx("mouse");
  assert.equal(provider.plays.length, 1);
  manager.setMuted(false);
  manager.playSfx("mouse");
  assert.equal(provider.plays.length, 2);
});

test("audio unlock failure is swallowed", async () => {
  const { createAudioManager } = await loadAudio();
  const manager = createAudioManager(createStorage(), {
    audioContextFactory: () => {
      throw new Error("autoplay blocked");
    },
  });

  assert.equal(await manager.unlock(), false);
  assert.doesNotThrow(() => manager.playSfx("jump"));
});

test("pause controller uses one toggle for resume and pause button", async () => {
  const { createPauseController } = await import("../public/js/ui/pause-controller.js");
  const events = [];
  const state = { status: "running" };
  const gameLoop = {
    getState: () => state,
    pause: () => {
      state.status = "paused";
    },
    resume: () => {
      state.status = "running";
    },
  };
  const audioManager = {
    unlock: () => Promise.resolve(true),
    playSfx: (name) => events.push(name),
    startMusic: () => events.push("music-start"),
    stopMusic: () => events.push("music-stop"),
  };
  const documentRef = createFakeDocument();
  const root = new FakeElement("main");
  const controller = createPauseController(gameLoop, audioManager, { documentRef });
  const overlay = controller.mount(root);

  assert.equal(overlay.hidden, true);
  assert.equal(overlay.getAttribute("aria-hidden"), "true");
  assert.equal(root.children.find((element) => element.className === "pause-button game-button"), undefined);
  controller.togglePause();
  assert.equal(state.status, "paused");
  assert.equal(overlay.hidden, false);
  assert.equal(overlay.getAttribute("aria-hidden"), "false");
  controller.togglePause();
  assert.equal(state.status, "running");
  assert.equal(overlay.hidden, true);
  assert.equal(overlay.getAttribute("aria-hidden"), "true");
  assert.deepEqual(events, ["pause", "music-stop", "resume", "music-start"]);
  return;
  const pauseButton = root.children.find((element) => element.className === "pause-button game-button");
  assert.equal(pauseButton.textContent, "Ⅱ 일시정지");
  assert.equal(pauseButton.getAttribute("aria-label"), "게임 일시정지");

  controller.togglePause();
  assert.equal(state.status, "paused");
  assert.equal(overlay.hidden, false);
  assert.equal(overlay.getAttribute("aria-hidden"), "false");
  assert.equal(pauseButton.textContent, "▶ 계속");
  controller.togglePause();
  assert.equal(state.status, "running");
  assert.equal(overlay.hidden, true);
  assert.equal(overlay.getAttribute("aria-hidden"), "true");
  assert.deepEqual(events, ["pause", "music-stop", "resume", "music-start"]);
});

test("paused game loop does not advance simulation", async () => {
  const { createGameState } = await import("../public/js/game/state.js");
  const { createGameLoop } = await import("../public/js/game/game-loop.js");
  const state = createGameState({ catId: "black", seed: "audio-test" });
  const input = {
    consumeJumpPress: () => false,
    isSliding: () => false,
  };
  const gameLoop = createGameLoop({
    state,
    input,
    clock: {
      requestFrame: () => 1,
      cancelFrame: () => {},
      now: () => 0,
    },
  });
  gameLoop.start();
  gameLoop.advance(100);
  const elapsedWhileRunning = state.elapsedMs;
  gameLoop.pause();
  gameLoop.advance(1000);
  assert.equal(state.elapsedMs, elapsedWhileRunning);
  assert.equal(state.status, "paused");
});
