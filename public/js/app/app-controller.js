import { createAudioManager } from "../audio/audio-manager.js";
import { createGameLoop } from "../game/game-loop.js";
import { createInputController } from "../game/input-controller.js";
import { createPatternStream } from "../game/patterns.js";
import { resolveEntityCollisions } from "../game/collision.js";
import { createGameState } from "../game/state.js";
import { updateWorldEntities } from "../game/world.js";
import { createCanvasViewport } from "../render/canvas-viewport.js";
import { createSceneRenderer } from "../render/scene-renderer.js";
import { createPauseController } from "../ui/pause-controller.js";
import { createSettingsPanel } from "../ui/settings-panel.js";
import { renderAuthConfigError, renderAuthScreen, renderLoadingScreen } from "../ui/auth-screen.js";
import { createNicknameScreen } from "../ui/nickname-screen.js";
import { createCharacterSelect } from "../ui/character-select.js";
import { createLocalRunStore } from "../sync/local-run-store.js";
import { createNetworkMonitor } from "../sync/network-monitor.js";
import { createRunApiClient } from "../sync/run-api-client.js";
import { createRunSync } from "../sync/run-sync.js";

const SCREEN_NAMES = Object.freeze({
  LOADING: "loading",
  AUTH: "auth",
  AUTH_CONFIG_ERROR: "auth-config-error",
  NICKNAME: "nickname",
  CHARACTER_SELECT: "character-select",
  GAME: "game",
});

function createAppController(options = {}) {
  const documentRef = options.documentRef || globalThis.document;
  const windowRef = options.windowRef || documentRef?.defaultView || globalThis;
  const fetchFn = options.fetchFn || globalThis.fetch;
  const screenRoot = options.screenRoot || documentRef?.getElementById?.("screen-root");
  const canvas = options.canvas || documentRef?.getElementById?.("game-canvas");
  const gameShell = options.gameShell || documentRef?.getElementById?.("game-shell");
  const state = {
    screen: SCREEN_NAMES.LOADING,
    user: null,
    catId: null,
    gameState: null,
  };
  let gameLoop = null;
  let input = null;
  let pauseController = null;
  let audioManager = null;
  let resizeHandler = null;
  let runApiClient = null;
  let runSync = null;
  let networkMonitor = null;
  let reconnectBanner = null;
  let pausedForNetwork = false;
  let lastSnapshotAt = -Infinity;

  function setScreen(screen) {
    state.screen = screen;
    screenRoot?.setAttribute?.("data-screen", screen);
  }

  function showRoot() {
    if (screenRoot) {
      screenRoot.hidden = false;
    }
  }

  function hideRoot() {
    if (screenRoot) {
      screenRoot.hidden = true;
      screenRoot.replaceChildren?.();
    }
  }

  function destroyGame() {
    if (resizeHandler) {
      windowRef.removeEventListener?.("resize", resizeHandler);
      resizeHandler = null;
    }
    input?.destroy?.();
    pauseController?.destroy?.();
    gameLoop?.destroy?.();
    audioManager?.destroy?.();
    input = null;
    pauseController = null;
    gameLoop = null;
    audioManager = null;
    state.gameState = null;
  }

  function snapshotGameState() {
    if (!state.gameState) {
      return null;
    }
    try {
      return JSON.parse(JSON.stringify(state.gameState));
    } catch {
      return null;
    }
  }

  function showReconnectState(message = "연결이 끊겼습니다. 잠시 기다려주세요.") {
    if (!gameShell || !documentRef?.createElement) {
      return;
    }
    if (!reconnectBanner) {
      reconnectBanner = documentRef.createElement("p");
      reconnectBanner.className = "reconnect-banner";
      gameShell.append(reconnectBanner);
    }
    reconnectBanner.textContent = message;
    reconnectBanner.hidden = false;
  }

  function hideReconnectState() {
    if (reconnectBanner) {
      reconnectBanner.hidden = true;
    }
  }

  function setupRunSync() {
    if (runSync || !state.user) {
      return runSync;
    }
    runApiClient = options.runApiClient || createRunApiClient(fetchFn);
    const localStore = options.localRunStore || createLocalRunStore();
    const syncOptions = {
      onOffline: () => {
        pausedForNetwork = gameLoop?.getState?.()?.status === "running";
        gameLoop?.pause?.();
        showReconnectState();
      },
      onOnline: () => {
        hideReconnectState();
        if (pausedForNetwork) {
          pausedForNetwork = false;
          gameLoop?.resume?.();
        }
      },
    };
    runSync = options.runSyncFactory
      ? options.runSyncFactory(runApiClient, localStore, syncOptions)
      : createRunSync(runApiClient, localStore, syncOptions);
    networkMonitor = createNetworkMonitor(
      () => runSync?.handleOffline(snapshotGameState()),
      () => void runSync?.handleOnline(),
      windowRef,
    );
    return runSync;
  }

  function showResumePrompt(candidate) {
    if (!screenRoot || !documentRef?.createElement) {
      return;
    }
    const modal = documentRef.createElement("section");
    modal.className = "resume-modal flow-card";
    const heading = documentRef.createElement("h2");
    heading.textContent = "이어서 달릴까요?";
    const description = documentRef.createElement("p");
    description.textContent = "최근 달리기가 남아 있습니다. 24시간 안의 진행 상황을 복구할 수 있어요.";
    const continueButton = documentRef.createElement("button");
    continueButton.type = "button";
    continueButton.className = "game-button primary";
    continueButton.textContent = "이어서 하기";
    continueButton.addEventListener("click", () => {
      const restored = runSync.continueRun(candidate);
      modal.remove?.();
      if (restored) {
        startGame(restored.catId, {
          seed: restored.seed,
          snapshot: restored.snapshot,
          resumed: true,
        });
      }
    });
    const newButton = documentRef.createElement("button");
    newButton.type = "button";
    newButton.className = "game-button";
    newButton.textContent = "새로 시작하기";
    newButton.addEventListener("click", () => {
      void runSync.abandon().then(() => {
        modal.remove?.();
        showCharacterSelect();
      });
    });
    modal.append(heading, description, continueButton, newButton);
    screenRoot.append(modal);
  }

  async function checkForResume() {
    setupRunSync();
    if (!runApiClient || !state.user) {
      return;
    }
    try {
      const payload = await runApiClient.getResumableRun();
      const candidate = runSync.getLocalResumeCandidate(payload.run, state.user.id);
      if (candidate) {
        showResumePrompt(candidate);
      }
    } catch {
      // A resumable check is best effort; the normal new-run screen remains available.
    }
  }

  function showAuth() {
    destroyGame();
    setScreen(SCREEN_NAMES.AUTH);
    renderAuthScreen(screenRoot, { documentRef });
  }

  function showAuthConfigError() {
    destroyGame();
    setScreen(SCREEN_NAMES.AUTH_CONFIG_ERROR);
    renderAuthConfigError(screenRoot, { documentRef });
  }

  function showNickname() {
    destroyGame();
    setScreen(SCREEN_NAMES.NICKNAME);
    const nicknameScreen = createNicknameScreen(
      (user) => {
        state.user = user;
        showCharacterSelect();
      },
      { documentRef, fetchFn },
    );
    nicknameScreen.mount(screenRoot, state.user);
  }

  function showCharacterSelect() {
    destroyGame();
    setScreen(SCREEN_NAMES.CHARACTER_SELECT);
    setupRunSync();
    const characterSelect = createCharacterSelect(
      ({ catId }) => startGame(catId),
      { documentRef },
    );
    characterSelect.mount(screenRoot);
    void checkForResume();
  }

  function playEventSound(event) {
    runSync?.recordEvent(
      event.type,
      Number.isFinite(event.occurredAtMs) ? event.occurredAtMs : state.gameState?.elapsedMs || 0,
      event.payload || {},
    );
    const soundByEvent = {
      player_jump: "jump",
      mouse_collected: "mouse",
      grass_collected: "grass",
      obstacle_collision: "collision",
      run_gameover: "gameover",
    };
    const sound = soundByEvent[event.type];
    if (sound) {
      audioManager?.playSfx?.(sound);
    }
    if (event.type.endsWith?.("_activated")) {
      audioManager?.playSfx?.("effect");
    }
  }

  function startGame(catId = "black", runOptions = {}) {
    destroyGame();
    state.catId = catId;
    state.screen = SCREEN_NAMES.GAME;
    const seed = runOptions.seed || String(Date.now()) + ":" + catId;
    const gameState = createGameState({ catId, seed });
    if (runOptions.snapshot && typeof runOptions.snapshot === "object") {
      Object.assign(gameState, runOptions.snapshot, {
        catId,
        seed,
      });
    }
    state.gameState = gameState;
    hideRoot();

    const context = canvas?.getContext?.("2d");
    const viewport = canvas ? createCanvasViewport(canvas) : null;
    const renderer = context ? createSceneRenderer(context) : null;
    const patternStream = createPatternStream(seed);
    audioManager = options.audioManagerFactory
      ? options.audioManagerFactory()
      : createAudioManager();
    const settingsPanel = options.settingsPanelFactory
      ? options.settingsPanelFactory(audioManager)
      : createSettingsPanel(audioManager, { documentRef });
    let loop = null;
    input = createInputController(canvas, () => pauseController?.togglePause());
    loop = createGameLoop({
      state: gameState,
      input,
      onEvent: playEventSound,
      onStateChange: (nextState) => {
        renderer?.render(nextState);
        if (nextState.elapsedMs - lastSnapshotAt >= 500) {
          lastSnapshotAt = nextState.elapsedMs;
          runSync?.saveSnapshot(snapshotGameState());
        }
      },
      onStep: (nextState) => {
        updateWorldEntities(nextState, patternStream);
        resolveEntityCollisions(nextState, nextState.worldEntities, {
          now: nextState.elapsedMs,
          onEvent: playEventSound,
        });
      },
    });
    gameLoop = loop;
    pauseController = createPauseController(loop, audioManager, {
      settingsPanel,
      onRestart: () => startGame(state.catId || "black"),
    });
    pauseController.mount(gameShell);
    resizeHandler = () => viewport?.resize();
    windowRef.addEventListener?.("resize", resizeHandler);
    viewport?.resize();
    void audioManager.unlock();
    audioManager.startMusic();
    if (!runOptions.resumed && runSync && state.user) {
      void runSync
        .startRun({ userId: state.user.id, catId, snapshot: snapshotGameState() })
        .catch(() => {
          runSync.handleOffline(snapshotGameState());
        });
    }
    loop.start();
    return gameState;
  }

  async function bootstrap() {
    setScreen(SCREEN_NAMES.LOADING);
    renderLoadingScreen(screenRoot, { documentRef });
    if (typeof fetchFn !== "function") {
      showAuthConfigError();
      return state;
    }
    try {
      const response = await fetchFn("/api/me", { credentials: "same-origin" });
      const payload = await response.json();
      if (!response.ok) {
        if (payload.error?.code === "AUTH_CONFIG_MISSING") {
          showAuthConfigError();
        } else {
          showAuth();
        }
        return state;
      }
      if (!payload.authenticated || !payload.user) {
        showAuth();
        return state;
      }
      state.user = payload.user;
      if (!payload.user.nickname?.trim()) {
        showNickname();
      } else {
        showCharacterSelect();
      }
    } catch {
      showAuth();
    }
    return state;
  }

  function destroy() {
    destroyGame();
    networkMonitor?.stop?.();
    runSync?.destroy?.();
    networkMonitor = null;
    runSync = null;
  }

  return {
    bootstrap,
    showAuth,
    showAuthConfigError,
    showNickname,
    showCharacterSelect,
    startGame,
    destroy,
    getState: () => ({ ...state }),
  };
}

export { SCREEN_NAMES, createAppController };
