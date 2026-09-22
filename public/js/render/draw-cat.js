import { GAME_CONFIG } from "../game/constants.js";
import { PALETTE } from "./color-palette.js";

function drawCat(ctx, catId, player, effect = null) {
  const colors = PALETTE.cats[catId] || PALETTE.cats.black;
  const width = player.width;
  const height = player.height;
  const scaleX = width / GAME_CONFIG.playerWidth;
  const scaleY = height / (player.isSliding ? GAME_CONFIG.slideHeight : GAME_CONFIG.playerHeight);
  const x = player.x;
  const y = player.y;

  ctx.save();
  ctx.fillStyle = "rgba(63, 43, 43, 0.18)";
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + height + 7, width * 0.34, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY);

  if (effect) {
    ctx.strokeStyle = PALETTE.effects[effect.type] || PALETTE.effects.magnet;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(45, 57, 56, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = colors.body;
  ctx.beginPath();
  ctx.ellipse(45, 70, 34, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(63, 43, 43, 0.24)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = colors.body;
  ctx.beginPath();
  ctx.moveTo(14, 38);
  ctx.lineTo(20, 3);
  ctx.lineTo(38, 27);
  ctx.lineTo(54, 27);
  ctx.lineTo(72, 3);
  ctx.lineTo(78, 38);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(63, 43, 43, 0.24)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = colors.patch;
  if (catId === "calico" || catId === "chaos" || catId === "mackerel") {
    ctx.beginPath();
    ctx.arc(25, 35, 15, 0, Math.PI * 2);
    ctx.fill();
  }
  if (catId === "cheese" || catId === "chaos") {
    ctx.fillRect(55, 48, 18, 22);
  }
  if (catId === "mackerel") {
    ctx.fillRect(36, 55, 7, 38);
    ctx.fillRect(50, 54, 7, 39);
  }

  ctx.fillStyle = colors.eye || "#f9d976";
  ctx.beginPath();
  ctx.arc(32, 36, 5, 0, Math.PI * 2);
  ctx.arc(58, 36, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3f2b2b";
  ctx.beginPath();
  ctx.arc(33, 37, 2, 0, Math.PI * 2);
  ctx.arc(59, 37, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = colors.patch;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(17, 73);
  ctx.quadraticCurveTo(-10, 45, 5, 20);
  ctx.stroke();

  ctx.fillStyle = colors.body;
  const legOffset = player.isSliding
    ? 4
    : player.isGrounded === false
      ? (player.vy || 0) < 0 ? 10 : 3
      : (player.animationFrame || 0) % 2 ? 8 : 0;
  ctx.fillRect(22 + legOffset, 92, 13, 18);
  ctx.fillRect(56 - legOffset, 92, 13, 18);
  ctx.fillStyle = "rgba(255, 250, 245, 0.55)";
  ctx.fillRect(30, 58, 7, 4);
  ctx.fillRect(56, 58, 7, 4);

  ctx.restore();
}

export { drawCat };
