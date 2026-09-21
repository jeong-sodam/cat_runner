import { GAME_CONFIG } from "../game/constants.js";
import { drawBackground } from "./draw-backgrounds.js";
import { drawCat } from "./draw-cat.js";
import { drawGrass, drawMouse, drawObstacle } from "./draw-entities.js";
import { drawHud } from "./draw-hud.js";

function createSceneRenderer(ctx, assets = {}) {
  const assetProvider = {
    getCatSprite: assets.getCatSprite || (() => null),
    getItemSprite: assets.getItemSprite || (() => null),
  };

  function drawBackgroundScene(state) {
    drawBackground(ctx, state);
  }

  function drawCatScene(state) {
    const sprite = assetProvider.getCatSprite(state.catId);
    if (sprite && ctx.drawImage) {
      ctx.drawImage(
        sprite,
        state.player.x,
        state.player.y,
        state.player.width,
        state.player.height,
      );
      return;
    }
    drawCat(ctx, state.catId, state.player, state.activeEffect);
  }

  function drawEntity(entity, state) {
    const screenEntity = {
      ...entity,
      x: entity.x - state.worldOffset,
    };
    const sprite = assetProvider.getItemSprite(entity.type, entity.variant);
    if (sprite && ctx.drawImage) {
      ctx.drawImage(
        sprite,
        screenEntity.x,
        screenEntity.y,
        screenEntity.width,
        screenEntity.height,
      );
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

export { createSceneRenderer };
