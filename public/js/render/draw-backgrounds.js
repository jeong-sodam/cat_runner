import { GAME_CONFIG } from "../game/constants.js";
import { PALETTE } from "./color-palette.js";

function drawWindow(ctx, x, y, width, height, color) {
  ctx.fillStyle = "#fff8e7";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = color;
  ctx.fillRect(x + 10, y + 10, width - 20, height - 20);
  ctx.strokeStyle = "#6d4c41";
  ctx.lineWidth = 8;
  ctx.strokeRect(x, y, width, height);
  ctx.beginPath();
  ctx.moveTo(x + width / 2, y + 10);
  ctx.lineTo(x + width / 2, y + height - 10);
  ctx.moveTo(x + 10, y + height / 2);
  ctx.lineTo(x + width - 10, y + height / 2);
  ctx.stroke();
}

function drawLivingRoom(ctx, state, night = false) {
  const colors = night ? PALETTE.backgrounds.home_night : PALETTE.backgrounds.home_day;
  ctx.fillStyle = colors.wall;
  ctx.fillRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight);
  ctx.fillStyle = night ? "#302b49" : "#fff1d8";
  ctx.fillRect(0, 0, GAME_CONFIG.canvasWidth, 470);
  drawWindow(ctx, 180, 100, 260, 190, night ? "#546b9c" : "#9ddfff");

  const offset = (state.worldOffset * 0.2) % 500;
  ctx.fillStyle = night ? "#584351" : "#d98668";
  ctx.fillRect(980 - offset, 335, 290, 180);
  ctx.fillStyle = night ? "#7b5660" : "#f3ad82";
  ctx.fillRect(940 - offset, 295, 370, 70);
  ctx.fillStyle = night ? "#493a51" : "#b65d58";
  ctx.fillRect(1060 - offset, 440, 45, 145);
  ctx.fillRect(1190 - offset, 440, 45, 145);

  ctx.fillStyle = colors.floor;
  ctx.fillRect(0, 585, GAME_CONFIG.canvasWidth, 315);
  ctx.fillStyle = night ? "#493849" : "#f4d6a4";
  ctx.fillRect(0, 585, GAME_CONFIG.canvasWidth, 18);
}

function drawOutside(ctx, state) {
  const colors = PALETTE.backgrounds.outside;
  ctx.fillStyle = colors.sky;
  ctx.fillRect(0, 0, GAME_CONFIG.canvasWidth, 900);
  ctx.fillStyle = "#fdf1c7";
  ctx.beginPath();
  ctx.arc(1320, 150, 70, 0, Math.PI * 2);
  ctx.fill();

  const cloudOffset = (state.worldOffset * 0.12) % 800;
  for (const x of [180 - cloudOffset, 700 - cloudOffset, 1220 - cloudOffset]) {
    ctx.fillStyle = "#ffffffaa";
    ctx.beginPath();
    ctx.arc(x, 170, 42, 0, Math.PI * 2);
    ctx.arc(x + 45, 165, 55, 0, Math.PI * 2);
    ctx.arc(x + 95, 175, 36, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#78a9c0";
  ctx.fillRect(0, 475, GAME_CONFIG.canvasWidth, 115);
  ctx.fillStyle = "#575d6b";
  ctx.fillRect(0, 590, GAME_CONFIG.canvasWidth, 310);
  ctx.fillStyle = "#e6c968";
  const roadOffset = state.worldOffset % 300;
  for (let x = -roadOffset; x < GAME_CONFIG.canvasWidth; x += 300) {
    ctx.fillRect(x, 735, 150, 18);
  }
  ctx.fillStyle = "#83b96b";
  ctx.fillRect(0, 575, GAME_CONFIG.canvasWidth, 25);
}

function drawHomeDay(ctx, state) {
  drawLivingRoom(ctx, state, false);
}

function drawHomeNight(ctx, state) {
  drawLivingRoom(ctx, state, true);
}

function drawBackground(ctx, state) {
  if (state.zoneId === "outside") {
    return drawOutside(ctx, state);
  }
  if (state.zoneId === "home_night") {
    return drawHomeNight(ctx, state);
  }
  return drawHomeDay(ctx, state);
}

export {
  drawBackground,
  drawHomeDay,
  drawHomeNight,
  drawOutside,
};
