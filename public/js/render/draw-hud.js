import { GAME_CONFIG } from "../game/constants.js";
import { PALETTE } from "./color-palette.js";

const EFFECT_LABELS = Object.freeze({
  magnet: "자석",
  invincible: "무적",
  double_score: "점수 2배",
  slow_miss: "꽝",
});

function drawHud(ctx, state) {
  ctx.save();
  ctx.font = "bold 28px Trebuchet MS, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillStyle = PALETTE.ui.ink;
  ctx.fillText("점수 " + state.score, 34, 38);
  ctx.fillText("거리 " + Math.floor(state.distanceM) + "m", 34, 78);

  const hearts = Math.max(
    0,
    Math.min(3, Math.ceil(state.health / (GAME_CONFIG.maxHealth / 3))),
  );
  ctx.fillStyle = "#e36f65";
  ctx.fillText("♥".repeat(hearts), 34, 120);
  ctx.fillStyle = PALETTE.ui.emptyHeart;
  ctx.fillText("♥".repeat(3 - hearts), 34 + hearts * 27, 120);

  if (state.activeEffect) {
    const effectColor =
      PALETTE.effects[state.activeEffect.type] || PALETTE.ui.accent;
    ctx.fillStyle = effectColor;
    ctx.beginPath();
    ctx.arc(600, 48, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.ui.ink;
    const effectLabel = EFFECT_LABELS[state.activeEffect.type] || state.activeEffect.type;
    ctx.fillText(effectLabel, 630, 48);
    const remaining = Math.max(
      0,
      Math.ceil((state.activeEffect.expiresAtMs - state.elapsedMs) / 1000),
    );
    ctx.fillText(remaining + "초", 630, 82);
  }

  const pauseButton = { x: 1480, y: 24, width: 86, height: 52 };
  ctx.fillStyle = PALETTE.ui.cream;
  ctx.strokeStyle = PALETTE.ui.ink;
  ctx.lineWidth = 4;
  ctx.fillRect(pauseButton.x, pauseButton.y, pauseButton.width, pauseButton.height);
  ctx.strokeRect(pauseButton.x, pauseButton.y, pauseButton.width, pauseButton.height);
  ctx.fillStyle = PALETTE.ui.ink;
  ctx.fillText("Ⅱ", pauseButton.x + 27, pauseButton.y + 27);
  ctx.restore();
  return { pauseButton };
}

export { drawHud, EFFECT_LABELS };
