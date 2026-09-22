import { GAME_CONFIG } from "../game/constants.js";
import { drawBackground } from "./draw-backgrounds.js";
import { drawCat } from "./draw-cat.js";
import { drawGrass, drawMouse, drawObstacle } from "./draw-entities.js";
import { drawHud } from "./draw-hud.js";
import { PALETTE } from "./color-palette.js";

const CAT_POSE_FRAME = Object.freeze({
  run: 0,
  jump: 1,
  slide: 2,
});

function getCatPose(player) {
  if (player?.isSliding) {
    return "slide";
  }
  return player?.isGrounded === false ? "jump" : "run";
}

function getSpriteDimensions(sprite) {
  const width = Number(sprite?.naturalWidth || sprite?.width || 0);
  const height = Number(sprite?.naturalHeight || sprite?.height || 0);
  return { width, height };
}

function canDrawCatSprite(ctx, sprite) {
  const { width, height } = getSpriteDimensions(sprite);
  return typeof ctx.drawImage === "function" && width >= 3 && height > 0;
}

function getItemPresentation(entity, state) {
  if (entity.type !== "mouse" && entity.type !== "grass") {
    return { y: entity.y, brightness: 1 };
  }

  const phase = entity.type === "grass" ? 180 : 260;
  const bob = Math.sin(((state.elapsedMs || 0) + entity.x) / phase) * 2;
  const brightness = 0.96 + Math.sin(((state.elapsedMs || 0) + entity.x) / 320) * 0.04;
  return { y: entity.y + bob, brightness };
}

function drawTiledBackground(ctx, sprite, offset, alpha = 1) {
  const { width, height } = getSpriteDimensions(sprite);
  if (width <= 0 || height <= 0) {
    return false;
  }

  const tileWidth = (width / height) * GAME_CONFIG.canvasHeight;
  const normalizedOffset = ((offset % tileWidth) + tileWidth) % tileWidth;
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let x = -normalizedOffset; x < GAME_CONFIG.canvasWidth; x += tileWidth) {
    ctx.drawImage(
      sprite,
      x,
      0,
      tileWidth,
      GAME_CONFIG.canvasHeight,
    );
  }
  ctx.restore();
  return true;
}

function createSceneRenderer(ctx, assets = {}) {
  const assetProvider = {
    getCatSprite: assets.getCatSprite || (() => null),
    getBackgroundSprite: assets.getBackgroundSprite || (() => null),
    getItemSprite: assets.getItemSprite || (() => null),
  };

  function drawBackgroundScene(state) {
    const sprite = assetProvider.getBackgroundSprite(state.zoneId);
    if (sprite && typeof ctx.drawImage === "function") {
      const colors = PALETTE.backgrounds[state.zoneId] || PALETTE.backgrounds.home_day;
      const hasFarLayer = drawTiledBackground(ctx, sprite, state.worldOffset * 0.18, 0.34);
      if (hasFarLayer) {
        ctx.save();
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = colors.sky || colors.wall;
        ctx.fillRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight);
        ctx.restore();
        drawTiledBackground(ctx, sprite, state.worldOffset, 0.9);
        return;
      }
    }
    drawBackground(ctx, state);
  }

  function drawCatScene(state) {
    const sprite = assetProvider.getCatSprite(state.catId);
    const { width: spriteWidth, height: spriteHeight } = getSpriteDimensions(sprite);
    if (canDrawCatSprite(ctx, sprite)) {
      const pose = getCatPose(state.player);
      const frameWidth = spriteWidth / 3;
      const sourceX = frameWidth * CAT_POSE_FRAME[pose];
      ctx.drawImage(
        sprite,
        sourceX,
        0,
        frameWidth,
        spriteHeight,
        state.player.x,
        state.player.y,
        state.player.width,
        state.player.height,
      );
      return;
    }
    const animationFrame = Number.isFinite(state.animationFrame)
      ? state.animationFrame
      : Math.floor((state.elapsedMs || 0) / 120);
    drawCat(
      ctx,
      state.catId,
      { ...state.player, animationFrame },
      state.activeEffect,
    );
  }

  function drawEntity(entity, state) {
    const screenEntity = {
      ...entity,
      x: entity.x - state.worldOffset,
    };
    const sprite = assetProvider.getItemSprite(entity.type, entity.variant);
    if (sprite && ctx.drawImage) {
      const presentation = getItemPresentation(screenEntity, state);
      ctx.save();
      ctx.filter = `brightness(${presentation.brightness})`;
      ctx.drawImage(
        sprite,
        screenEntity.x,
        presentation.y,
        screenEntity.width,
        screenEntity.height,
      );
      ctx.restore();
      return;
    }
    if (entity.type === "obstacle") {
      drawObstacle(ctx, screenEntity);
    } else if (entity.type === "mouse") {
      drawMouse(ctx, screenEntity);
    } else if (entity.type === "grass") {
      drawGrass(ctx, screenEntity);
    }
  }

  function drawHudScene(state) {
    return drawHud(ctx, state);
  }

  function render(state, world = state.worldEntities || []) {
    ctx.clearRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight);
    drawBackgroundScene(state);
    for (const entity of [...world].sort((first, second) => first.x - second.x)) {
      if (entity.collected) {
        continue;
      }
      drawEntity(entity, state);
    }
    drawCatScene(state);
    return drawHudScene(state);
  }

  return {
    render,
    drawBackground: drawBackgroundScene,
    drawCat: drawCatScene,
    drawObstacle: (entity, state) => drawEntity(entity, state),
    drawMouse: (entity, state) => drawEntity(entity, state),
    drawGrass: (entity, state) => drawEntity(entity, state),
    drawHud: drawHudScene,
  };
}

export { createSceneRenderer, getCatPose };
