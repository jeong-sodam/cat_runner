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
import { isPointInsideRect } from "../ui/pause-hitbox.js";
import { createSettingsPanel } from "../ui/settings-panel.js";
import { renderWelcomeScreen, renderLoadingScreen } from "../ui/auth-screen.js";
import { createCharacterSelect } from "../ui/character-select.js";
import { createLeaderboardPanel } from "../ui/leaderboard.js";
import { createPersonalRecordsPanel } from "../ui/personal-records.js";
import { createResultScreen } from "../ui/result-screen.js";
import { createLocalRunStore } from "../sync/local-run-store.js";
import { waitForFonts } from "../ui/font-loader.js";
import { fitSingleLineText } from "../ui/text-fitting.js";

const SCREEN_NAMES = Object.freeze({
  LOADING: "loading",
  WELCOME: "welcome",
  CHARACTER_SELECT: "character-select",
  GAME: "game",
  RESULT: "result",
  PERSONAL_RECORDS: "personal-records",
  LEADERBOARD: "leaderboard",
});

function createAppController(options = {}) {
  const documentRef = options.documentRef || globalThis.document;
  const windowRef = options.windowRef || documentRef?.defaultView || globalThis;
  const screenRoot = options.screenRoot || documentRef?.getElementById?.("screen-root");
  const canvas = options.canvas || documentRef?.getElementById?.("game-canvas");
  const gameShell = options.gameShell || documentRef?.getElementById?.("game-shell");
  const assetLoader = options.assetLoader || createAssetLoader();
  const state = {
    screen: SCREEN_NAMES.LOADING,
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
  let localRunStore = null;
  let localRunMetadata = null;
  let lastLocalSnapshotAt = -Infinity;
  let pageHideHandler = null;
  let completionInProgress = false;
  let finalGameState = null;

  function setScreen(screen) {
    state.screen = screen;
    screenRoot?.setAttribute?.("data-screen", screen);
    if (gameShell) {
      gameShell.dataset.screen = screen;
      gameShell.setAttribute?.("data-screen", screen);
    }
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
    if (pageHideHandler) {
      windowRef.removeEventListener?.("pagehide", pageHideHandler);
      pageHideHandler = null;
    }
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

  function getLocalRunStore() {
    if (!localRunStore) {
      localRunStore = options.localRunStore || createLocalRunStore();
    }
    return localRunStore;
  }

  function showLocalResumePrompt(candidate) {
    if (!screenRoot || !documentRef?.createElement) {
      return;
    }
    const modal = documentRef.createElement("section");
    modal.className = "resume-modal flow-card local-resume-modal";
    const heading = documentRef.createElement("h2");
    heading.className = "fit-title";
    heading.textContent = "이어서 달릴까요?";
    const description = documentRef.createElement("p");
    description.textContent = "저장된 달리기가 있습니다. 이어서 하거나 새 게임을 시작할 수 있어요.";
    const continueButton = documentRef.createElement("button");
    continueButton.type = "button";
    continueButton.className = "game-button primary";
    continueButton.textContent = "이어하기";
    continueButton.addEventListener("click", () => {
      modal.remove?.();
      startGame(candidate.catId, {
        runId: candidate.runId,
        seed: candidate.seed,
        snapshot: candidate.snapshot,
        resumed: true,
      });
    });
    const newButton = documentRef.createElement("button");
    newButton.type = "button";
    newButton.className = "game-button";
    newButton.textContent = "새 게임";
    newButton.addEventListener("click", () => {
      getLocalRunStore().clearLocalRun?.();
      modal.remove?.();
      showCharacterSelect({ allowResume: false });
    });
    modal.append(heading, description, continueButton, newButton);
    screenRoot.append(modal);
    fitSingleLineText(heading, { container: modal, minPx: 18, maxPx: 32 });
  }

  function showWelcome() {
    destroyGame();
    setScreen(SCREEN_NAMES.WELCOME);
    renderWelcomeScreen(screenRoot, {
      documentRef,
      onLocalPlay: () => showCharacterSelect({ allowResume: true }),
    });
  }
  function showCharacterSelect({ allowResume = true } = {}) {
    destroyGame();
    setScreen(SCREEN_NAMES.CHARACTER_SELECT);
    const characterSelect = createCharacterSelect(
      ({ catId }) => startGame(catId),
      { documentRef },
    );
    characterSelect.mount(screenRoot);
    if (allowResume) {
      const candidate = getLocalRunStore().loadLocalRun?.();
      if (candidate) {
        showLocalResumePrompt(candidate);
      }
    }
  }

  function showResult(result) {
    destroyGame();
    state.lastResult = result;
    setScreen(SCREEN_NAMES.RESULT);
    showRoot();
    const resultScreen = createResultScreen(
      result,
      {
        onRestart: () => showCharacterSelect({ allowResume: false }),
        onPersonalRecords: () => showPersonalRecords(),
        onLeaderboard: () => showLeaderboard(),
      },
      { documentRef },
    );
    resultScreen.mount(screenRoot);
  }

  function showPersonalRecords() {
    destroyGame();
    setScreen(SCREEN_NAMES.PERSONAL_RECORDS);
    showRoot();
    const localStore = getLocalRunStore();
    const personalRecords = createPersonalRecordsPanel(
      {
        onBack: () => showResult(
          state.lastResult || localStore?.getLastResult?.() || { saved: false },
        ),
        onRestart: () => showCharacterSelect({ allowResume: false }),
      },
      {
        documentRef,
        localStore,
        currentResult: state.lastResult,
      },
    );
    personalRecords.mount(screenRoot);
  }

  function showLeaderboard() {
    destroyGame();
    setScreen(SCREEN_NAMES.LEADERBOARD);
    showRoot();
    const localStore = getLocalRunStore();
    const leaderboard = createLeaderboardPanel(
      {
        onBack: () => showResult(
          state.lastResult || localStore.getLastResult?.() || { saved: false },
        ),
        onRestart: () => showCharacterSelect({ allowResume: false }),
      },
      {
        documentRef,
        localStore,
        currentResult: state.lastResult,
      },
    );
    leaderboard.mount(screenRoot);
  }

  async function completeGameover() {
    if (completionInProgress || (!state.gameState && !finalGameState)) {
      return;
    }
    completionInProgress = true;
    const completedState = state.gameState || finalGameState;
    const rhythm = getRhythmSummary(completedState.rhythm);
    const localResult = {
      score: completedState.score,
      distanceM: completedState.distanceM,
      mouseCount: completedState.mouseCount,
      rhythmAccuracy: rhythm.accuracy,
      rhythmMultiplier: rhythm.scoreMultiplier,
      isPersonalBest: false,
      saved: false,
    };
    const achievedAt = Date.now();
    const localStore = getLocalRunStore();
    const scoreRecord = {
      ...localResult,
      catId: completedState.catId,
      achievedAt,
    };
    let savedResult = {
      saved: false,
      persisted: false,
      warning: false,
      rank: null,
    };
    let lastResultSaved = false;
    try {
      savedResult = localStore.saveLocalResult(scoreRecord) || savedResult;
    } catch {
      // The result screen reports a local save failure without entering server retry flow.
    }
    try {
      lastResultSaved = localStore.saveLastResult(scoreRecord) !== false;
    } catch {
      lastResultSaved = false;
    }
    try {
      localStore.clearLocalRun?.();
    } catch {
      // A stale active snapshot must not prevent displaying the completed result.
    }
    const saved = savedResult.saved === true && lastResultSaved;
    const storageStatus = localStore.getStorageStatus?.() || {
      persistent: savedResult.persisted !== false,
      warning: savedResult.warning === true,
    };
    const persisted = savedResult.persisted === true && storageStatus.persistent === true;
    const storageWarning = savedResult.warning === true || storageStatus.warning === true;
    showResult({
      ...localResult,
      saved,
      persisted,
      storageWarning,
      rank: savedResult.rank,
      isPersonalBest: saved && savedResult.rank === 1,
      localOnly: true,
      catId: completedState.catId,
      achievedAt,
      errorMessage: saved
        ? undefined
        : "개인기록표에 저장하지 못했습니다. 브라우저 저장소를 확인해주세요.",
    });
    completionInProgress = false;
    return;
  }

  function playEventSound(event) {
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
    state.runMode = "local";
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
        status: runOptions.resumed ? "ready" : gameState.status,
      });
    }
    state.gameState = gameState;
    const localStore = getLocalRunStore();
    localRunMetadata = {
      runId: runOptions.runId || "local-" + Date.now() + "-" + catId,
      catId,
      seed,
    };
    lastLocalSnapshotAt = gameState.elapsedMs;
    localStore.saveLocalRun?.({
      ...localRunMetadata,
      mode: "local",
      snapshotVersion: 1,
      snapshot: snapshotGameState(),
    });
    pageHideHandler = () => {
      const snapshot = snapshotGameState();
      if (snapshot && localRunMetadata) {
        localStore.saveLocalRun?.({
          ...localRunMetadata,
          mode: "local",
          snapshotVersion: 1,
          snapshot,
        });
      }
    };
    windowRef.addEventListener?.("pagehide", pageHideHandler);
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
    let pauseHitArea = null;
    let loop = null;
    input = createInputController(canvas, () => pauseController?.togglePause(), {
      onPointerDown: ({ x, y, button }) => {
        if (
          button === "primary" &&
          isPointInsideRect({ x, y }, pauseHitArea)
        ) {
          pauseController?.togglePause?.();
          return;
        }
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
        const renderResult = renderer?.render(nextState);
        if (renderResult?.pauseButton) {
          pauseHitArea = renderResult.pauseButton;
        }
        if (
          localRunMetadata &&
          nextState.elapsedMs - lastLocalSnapshotAt >= 1000
        ) {
          const snapshot = snapshotGameState();
          if (snapshot) {
            getLocalRunStore().saveLocalRun?.({
              ...localRunMetadata,
              mode: "local",
              snapshotVersion: 1,
              snapshot,
            });
            lastLocalSnapshotAt = nextState.elapsedMs;
          }
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
      onRestart: () => {
        getLocalRunStore().clearLocalRun?.();
        startGame(state.catId || "black");
      },
    });
    pauseController.mount(gameShell);
    const initialRender = renderer?.render(gameState);
    if (initialRender?.pauseButton) {
      pauseHitArea = initialRender.pauseButton;
    }
    resizeHandler = () => viewport?.resize();
    windowRef.addEventListener?.("resize", resizeHandler);
    viewport?.resize();
    void audioManager.unlock();
    audioManager.startMusic();
    loop.start();
    return gameState;
  }

  async function startGame(catId = "black", runOptions = {}) {
    const resumeLocalRun =
      runOptions.resumed === true &&
      typeof runOptions.runId === "string" &&
      runOptions.runId.startsWith("local-");
    return initializeGame(catId, {
      ...runOptions,
      resumed: resumeLocalRun,
      seed: resumeLocalRun ? runOptions.seed : undefined,
      snapshot: resumeLocalRun ? runOptions.snapshot : undefined,
    });
  }

  async function bootstrap() {
    setScreen(SCREEN_NAMES.LOADING);
    renderLoadingScreen(screenRoot, { documentRef });
    await waitForFonts(documentRef);
    try {
      await assetLoader.preload?.();
    } catch {
      // Preloading is optional: the renderer falls back to code-drawn scenes.
    }
    showWelcome();
    return state;
  }
  function destroy() {
    destroyGame();
  }

  return {
    bootstrap,
    showWelcome,
    showCharacterSelect,
    startGame,
    destroy,
    getState: () => ({ ...state }),
  };
}

export { SCREEN_NAMES, createAppController };
