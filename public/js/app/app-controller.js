import { createAudioManager } from "../audio/audio-manager.js";
import { createGameLoop } from "../game/game-loop.js";
import { createInputController } from "../game/input-controller.js";
import { getRhythmSummary, resolveRhythmTarget } from "../game/rhythm-targets.js";
import { updateScore } from "../game/scoring.js";
import { createPatternStream } from "../game/patterns.js";
import { resolveEntityCollisions } from "../game/collision.js";
import { createGameState } from "../game/state.js";
import { updateWorldEntities } from "../game/world.js";
import { createCanvasViewport } from "../render/canvas-viewport.js";
import { createAssetLoader } from "../render/asset-loader.js";
import { createSceneRenderer } from "../render/scene-renderer.js";
import { createPauseController } from "../ui/pause-controller.js";
import { createSettingsPanel } from "../ui/settings-panel.js";
import { renderAuthConfigError, renderAuthScreen, renderLoadingScreen } from "../ui/auth-screen.js";
import { createNicknameScreen } from "../ui/nickname-screen.js";
import { createCharacterSelect } from "../ui/character-select.js";
import { createLeaderboardPanel } from "../ui/leaderboard.js";
import { createResultScreen } from "../ui/result-screen.js";
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
  RESULT: "result",
  LEADERBOARD: "leaderboard",
});

function createAppController(options = {}) {
  const documentRef = options.documentRef || globalThis.document;
  const windowRef = options.windowRef || documentRef?.defaultView || globalThis;
  const fetchFn = options.fetchFn || globalThis.fetch;
  const screenRoot = options.screenRoot || documentRef?.getElementById?.("screen-root");
  const canvas = options.canvas || documentRef?.getElementById?.("game-canvas");
  const gameShell = options.gameShell || documentRef?.getElementById?.("game-shell");
  const assetLoader = options.assetLoader || createAssetLoader();
  const state = {
    screen: SCREEN_NAMES.LOADING,
    user: null,
    catId: null,
    runMode: null,
    gameState: null,
    lastResult: null,
  };
  let gameLoop = null;
  let input = null;
  let pauseController = null;
  let audioManager = null;
  let resizeHandler = null;
  let runApiClient = null;
  let runSync = null;
  let networkMonitor = null;
  let localRunStore = null;
  let reconnectBanner = null;
  let pausedForNetwork = false;
  let lastSnapshotAt = -Infinity;
  let completionInProgress = false;
  let finalGameState = null;

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

  function getLocalRunStore() {
    if (!localRunStore) {
      localRunStore = options.localRunStore || createLocalRunStore();
    }
    return localRunStore;
  }

  function teardownRunSync() {
    networkMonitor?.stop?.();
    runSync?.destroy?.();
    networkMonitor = null;
    runSync = null;
    runApiClient = null;
  }

  function setupRunSync() {
    if (runSync || !state.user) {
      return runSync;
    }
    runApiClient = options.runApiClient || createRunApiClient(fetchFn);
    const localStore = getLocalRunStore();
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

  function startErrorMessage(error) {
    switch (error?.code) {
      case "AUTH_REQUIRED":
      case "AUTH_CONFIG_MISSING":
        return "로그인이 만료되었습니다. 다시 로그인한 뒤 시도해주세요.";
      case "CAT_INVALID":
        return "선택한 고양이를 시작할 수 없습니다.";
      case "NETWORK_ERROR":
        return "서버에 연결하지 못했습니다. 연결을 확인하거나 로컬 플레이를 선택해주세요.";
      default:
        return "게임을 시작하지 못했습니다. 다시 시도하거나 로컬 플레이를 선택해주세요.";
    }
  }

  function logStartFailure(error) {
    const logger = options.logger || globalThis.console;
    logger?.error?.("Run start failed", {
      status: error?.status ?? null,
      code: error?.code || "RUN_START_FAILED",
    });
  }

  function showStartFailure(catId, error) {
    logStartFailure(error);
    showRoot();
    const existing = screenRoot?.querySelector?.(".start-error-modal");
    existing?.remove?.();
    if (!screenRoot || !documentRef?.createElement) {
      return;
    }
    const modal = documentRef.createElement("section");
    modal.className = "start-error-modal flow-card";
    const heading = documentRef.createElement("h2");
    heading.textContent = "서버 연결을 확인해주세요";
    const message = documentRef.createElement("p");
    message.textContent = startErrorMessage(error);
    const actions = documentRef.createElement("div");
    actions.className = "result-actions";
    const retryButton = documentRef.createElement("button");
    retryButton.type = "button";
    retryButton.className = "game-button primary";
    retryButton.textContent = "다시 시도";
    retryButton.addEventListener("click", () => {
      modal.remove?.();
      void startGame(catId);
    });
    const localButton = documentRef.createElement("button");
    localButton.type = "button";
    localButton.className = "game-button";
    localButton.textContent = "로컬 플레이";
    localButton.addEventListener("click", () => {
      modal.remove?.();
      teardownRunSync();
      initializeGame(catId, { runMode: "local" });
    });
    actions.append(retryButton, localButton);
    modal.append(heading, message, actions);
    screenRoot.append(modal);
  }

  function showAuth(options = {}) {
    destroyGame();
    setScreen(SCREEN_NAMES.AUTH);
    renderAuthScreen(screenRoot, {
      documentRef,
      guestMode: options.guestMode === true,
    });
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

  function showResult(result) {
    destroyGame();
    state.lastResult = result;
    setScreen(SCREEN_NAMES.RESULT);
    showRoot();
    const resultScreen = createResultScreen(
      result,
      {
        onRetry: () => void completeGameover(),
        onRestart: () => showCharacterSelect(),
        onLeaderboard: () => showLeaderboard(),
      },
      { documentRef },
    );
    resultScreen.mount(screenRoot);
  }

  function showLeaderboard() {
    destroyGame();
    setScreen(SCREEN_NAMES.LEADERBOARD);
    showRoot();
    setupRunSync();
    const leaderboard = createLeaderboardPanel(
      runApiClient,
      {
        onBack: () => showResult(state.lastResult || { saved: false }),
        onRestart: () => showCharacterSelect(),
      },
      { documentRef },
    );
    leaderboard.mount(screenRoot);
  }

  async function completeGameover() {
    if (completionInProgress || (!state.gameState && !finalGameState)) {
      return;
    }
    completionInProgress = true;
    const completedState = state.gameState || finalGameState;
    const runMode = completedState.runMode || state.runMode || "server";
    const rhythmAccuracy = getRhythmSummary(completedState.rhythm).accuracy;
    const localResult = {
      score: completedState.score,
      distanceM: completedState.distanceM,
      mouseCount: completedState.mouseCount,
      rhythmAccuracy,
      isPersonalBest: false,
      saved: false,
    };
    if (runMode === "local") {
      const isPersonalBest = getLocalRunStore().saveLocalBest({
        ...localResult,
        catId: completedState.catId,
        achievedAt: Date.now(),
      });
      showResult({
        ...localResult,
        isPersonalBest,
        localOnly: true,
        errorMessage: "로컬 플레이 기록은 순위표에 등록되지 않습니다.",
      });
      completionInProgress = false;
      return;
    }
    try {
      runSync?.saveSnapshot?.(completedState);
      const activeRun = runSync?.getState?.().activeRun;
      const flushed = activeRun ? await runSync.flush() : false;
      const currentRun = runSync?.getState?.().activeRun;
      if (!flushed || !currentRun?.runId || !runApiClient?.completeRun) {
        throw new Error("The completed run is not ready to submit.");
      }
      const response = await runApiClient.completeRun(
        currentRun.runId,
        [],
        Date.now(),
      );
      runSync.complete();
      showResult({ ...response.result, saved: true });
    } catch (error) {
      showResult({
        ...localResult,
        errorMessage: "기록을 저장하지 못했습니다. 다시 시도해주세요.",
      });
    } finally {
      completionInProgress = false;
    }
  }

  function playEventSound(event) {
    if (state.runMode === "server") {
      runSync?.recordEvent(
        event.type,
        Number.isFinite(event.occurredAtMs) ? event.occurredAtMs : state.gameState?.elapsedMs || 0,
        event.payload || {},
      );
    }
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
    if (event.type === "run_gameover") {
      finalGameState = snapshotGameState();
      void completeGameover();
    }
  }

  function initializeGame(catId = "black", runOptions = {}) {
    destroyGame();
    state.catId = catId;
    state.runMode = runOptions.runMode || "local";
    setScreen(SCREEN_NAMES.GAME);
    completionInProgress = false;
    finalGameState = null;
    const seed = runOptions.seed || String(Date.now()) + ":" + catId;
    const gameState = createGameState({ catId, seed });
    gameState.runMode = state.runMode;
    gameState.connectionMode = state.runMode;
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
    const renderer = context ? createSceneRenderer(context, assetLoader) : null;
    const patternStream = createPatternStream(seed);
    audioManager = options.audioManagerFactory
      ? options.audioManagerFactory()
      : createAudioManager();
    const settingsPanel = options.settingsPanelFactory
      ? options.settingsPanelFactory(audioManager)
      : createSettingsPanel(audioManager, { documentRef });
    let loop = null;
    input = createInputController(canvas, () => pauseController?.togglePause(), {
      onPointerDown: ({ x, y, button }) => {
        if (gameState.status !== "running") {
          return;
        }
        const target = resolveRhythmTarget(gameState.rhythm, {
          x,
          y,
          button,
          nowMs: gameState.elapsedMs,
        });
        if (target) {
          updateScore(gameState);
        }
      },
    });
    loop = createGameLoop({
      state: gameState,
      input,
      clock: options.gameClock,
      onEvent: playEventSound,
      onStateChange: (nextState) => {
        renderer?.render(nextState);
        if (state.runMode === "server" && nextState.elapsedMs - lastSnapshotAt >= 500) {
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
      onRestart: () => startGame(state.catId || "black", { runMode: state.runMode || "local" }),
    });
    pauseController.mount(gameShell);
    resizeHandler = () => viewport?.resize();
    windowRef.addEventListener?.("resize", resizeHandler);
    viewport?.resize();
    void audioManager.unlock();
    audioManager.startMusic();
    loop.start();
    return gameState;
  }

  async function startGame(catId = "black", runOptions = {}) {
    if (runOptions.runMode === "local" || runOptions.resumed || !state.user) {
      return initializeGame(catId, {
        ...runOptions,
        runMode: runOptions.runMode || (runOptions.resumed ? "server" : "local"),
      });
    }
    const sync = setupRunSync();
    try {
      await sync.startRun({ userId: state.user.id, catId });
      return initializeGame(catId, { ...runOptions, runMode: "server" });
    } catch (error) {
      state.gameState = null;
      showStartFailure(catId, error);
      return null;
    }
  }

  async function bootstrap() {
    setScreen(SCREEN_NAMES.LOADING);
    renderLoadingScreen(screenRoot, { documentRef });
    try {
      await assetLoader.preload?.();
    } catch {
      // Preloading is optional: the renderer falls back to code-drawn scenes.
    }
    if (typeof fetchFn !== "function") {
      showAuthConfigError();
      return state;
    }
    try {
      const response = await fetchFn("/api/me", { credentials: "same-origin" });
      const payload = await response.json();
      if (!response.ok) {
        if (payload.error?.code === "AUTH_CONFIG_MISSING" && !payload.guestMode) {
          showAuthConfigError();
        } else if (payload.error?.code === "AUTH_CONFIG_MISSING") {
          showAuth({ guestMode: payload.guestMode });
        } else {
          showAuth({ guestMode: payload.guestMode });
        }
        return state;
      }
      if (!payload.authenticated || !payload.user) {
        showAuth({ guestMode: payload.guestMode });
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
    teardownRunSync();
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
