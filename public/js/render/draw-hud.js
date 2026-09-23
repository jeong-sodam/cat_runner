import { GAME_CONFIG } from "../game/constants.js";
import { getRhythmSummary } from "../game/rhythm-targets.js";
import { PALETTE } from "./color-palette.js";

const EFFECT_LABELS = Object.freeze({
  magnet: "자석",
  invincible: "무적",
  double_score: "점수 2배",
  slow_miss: "느림",
});

const CANVAS_FONT_FAMILY = '"Pretendard", "Noto Sans KR", "Malgun Gothic", system-ui, sans-serif';

function drawHudPanel(ctx, x, y, width, height) {
  ctx.fillStyle = "rgba(255, 250, 245, 0.88)";
  ctx.strokeStyle = "rgba(63, 43, 43, 0.34)";
  ctx.lineWidth = 3;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
}

function drawHud(ctx, state) {
  ctx.save();
  drawHudPanel(ctx, 18, 12, 190, 142);
  ctx.font = `bold 28px ${CANVAS_FONT_FAMILY}`;
  ctx.textBaseline = "middle";
  ctx.fillStyle = PALETTE.ui.ink;
  ctx.fillText("점수 " + state.score, 34, 38);
  ctx.fillText("거리 " + Math.floor(state.distanceM) + "m", 34, 78);

  const maxHealth = Math.max(1, Number(state.maxHealth) || GAME_CONFIG.maxHealth);
  const filledHealth = Math.max(0, Math.min(maxHealth, Math.ceil(state.health)));
  for (let index = 0; index < maxHealth; index += 1) {
    ctx.fillStyle = index < filledHealth ? "#e36f65" : PALETTE.ui.emptyHeart;
    ctx.fillText("♥", 34 + index * 25, 120);
  }

  const rhythm = getRhythmSummary(state.rhythm);
  drawHudPanel(ctx, 230, 12, 270, 100);
  ctx.fillStyle = PALETTE.ui.ink;
  ctx.font = `bold 22px ${CANVAS_FONT_FAMILY}`;
  ctx.fillText("정확도 " + Math.round(rhythm.accuracy * 100) + "%", 246, 40);
  ctx.fillText("타겟 " + (state.rhythm?.targets?.filter((target) => target.status === "active").length || 0), 246, 76);

  if (state.activeEffect) {
    drawHudPanel(ctx, 570, 14, 250, 92);
    const effectColor = PALETTE.effects[state.activeEffect.type] || PALETTE.ui.accent;
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

export { CANVAS_FONT_FAMILY, drawHud, EFFECT_LABELS };
