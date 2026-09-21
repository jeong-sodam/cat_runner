import { GAME_CONFIG } from "../game/constants.js";

function createCanvasViewport(canvas) {
  canvas.width = GAME_CONFIG.canvasWidth;
  canvas.height = GAME_CONFIG.canvasHeight;

  let metrics = {
    scale: 1,
    displayWidth: GAME_CONFIG.canvasWidth,
    displayHeight: GAME_CONFIG.canvasHeight,
    offsetX: 0,
    offsetY: 0,
  };

  function resize() {
    const rect = canvas.getBoundingClientRect?.() || {
      left: 0,
      top: 0,
      width: canvas.clientWidth || GAME_CONFIG.canvasWidth,
      height: canvas.clientHeight || GAME_CONFIG.canvasHeight,
    };
    const scale = Math.min(
      rect.width / GAME_CONFIG.canvasWidth,
      rect.height / GAME_CONFIG.canvasHeight,
    );
    const displayWidth = GAME_CONFIG.canvasWidth * scale;
    const displayHeight = GAME_CONFIG.canvasHeight * scale;
    metrics = {
      scale,
      displayWidth,
      displayHeight,
      offsetX: (rect.width - displayWidth) / 2,
      offsetY: (rect.height - displayHeight) / 2,
    };
    if (canvas.style) {
      canvas.style.objectFit = "contain";
    }
    return metrics;
  }

  function toLogicalPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect?.() || {
      left: 0,
      top: 0,
      width: metrics.displayWidth,
      height: metrics.displayHeight,
    };
    return {
      x: (clientX - rect.left - metrics.offsetX) / metrics.scale,
      y: (clientY - rect.top - metrics.offsetY) / metrics.scale,
    };
  }

  const view = {
    resize,
    getMetrics: () => ({ ...metrics }),
    toLogicalPoint,
  };
  resize();
  return view;
}

export { createCanvasViewport };
