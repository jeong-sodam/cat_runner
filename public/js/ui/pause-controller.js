import { fitSingleLineText } from "./text-fitting.js";

const PAUSE_COPY = Object.freeze({
  running: {
    button: "Ⅱ 일시정지",
    label: "게임 일시정지",
  },
  paused: {
    button: "▶ 계속",
    label: "게임 계속",
  },
});

function createPauseController(gameLoop, audioManager, options = {}) {
  const documentRef = options.documentRef || globalThis.document;
  let root = null;
  let overlay = null;

  function isPaused() {
    return gameLoop?.getState?.()?.status === "paused";
  }

  function sync() {
    if (!overlay) {
      return;
    }
    const paused = isPaused();
    overlay.hidden = !paused;
    overlay.setAttribute?.("aria-hidden", String(!paused));
  }

  function togglePause() {
    audioManager?.unlock?.();
    if (isPaused()) {
      gameLoop.resume?.();
      audioManager?.playSfx?.("resume");
      audioManager?.startMusic?.();
    } else if (gameLoop?.getState?.()?.status === "running") {
      gameLoop.pause?.();
      audioManager?.playSfx?.("pause");
      audioManager?.stopMusic?.();
    }
    sync();
  }

  function mount(nextRoot) {
    root = nextRoot;
    if (!root || !documentRef?.createElement) {
      return null;
    }
    overlay = documentRef.createElement("section");
    overlay.className = "pause-overlay";
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "일시정지 메뉴");

    const card = documentRef.createElement("div");
    card.className = "pause-card";
    const heading = documentRef.createElement("h2");
    heading.className = "fit-title";
    heading.textContent = "잠깐 쉬어가기";
    const resumeButton = documentRef.createElement("button");
    resumeButton.type = "button";
    resumeButton.className = "game-button primary";
    resumeButton.textContent = "▶ 계속하기";
    resumeButton.addEventListener("click", togglePause);
    const restartButton = documentRef.createElement("button");
    restartButton.type = "button";
    restartButton.className = "game-button";
    restartButton.textContent = "↻ 다시 시작";
    restartButton.addEventListener("click", () => {
      gameLoop.stop?.();
      audioManager?.stopMusic?.();
      options.onRestart?.();
      sync();
    });

    const settingsRoot = documentRef.createElement("div");
    settingsRoot.className = "settings-panel";
    card.append(heading, resumeButton, restartButton, settingsRoot);
    overlay.append(card);
    root.append(overlay);

    fitSingleLineText(heading, { container: card, minPx: 18, maxPx: 32 });
    sync();
    options.settingsPanel?.mount?.(settingsRoot);
    return overlay;
  }

  function destroy() {
    overlay?.remove?.();
    root = null;
    overlay = null;
  }

  return { mount, togglePause, sync, destroy };
}

export { createPauseController };
