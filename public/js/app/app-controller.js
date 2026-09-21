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
    const characterSelect = createCharacterSelect(
      ({ catId }) => startGame(catId),
      { documentRef },
    );
    characterSelect.mount(screenRoot);
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
  }

  function startGame(catId = "black") {
    destroyGame();
    state.catId = catId;
    state.screen = SCREEN_NAMES.GAME;
    const seed = String(Date.now()) + ":" + catId;
    const gameState = createGameState({ catId, seed });
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
