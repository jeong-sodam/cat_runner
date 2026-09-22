const CAT_POSES = Object.freeze(["run", "jump", "slide"]);

const CAT_ASSET_MANIFEST = Object.freeze({
  black: Object.freeze({
    src: "/assets/cat-runner/cats/black.png",
    frameWidth: 724,
    frameHeight: 724,
    frameCount: 3,
  }),
  white: Object.freeze({
    src: "/assets/cat-runner/cats/white.png",
    frameWidth: 724,
    frameHeight: 724,
    frameCount: 3,
  }),
  calico: Object.freeze({
    src: "/assets/cat-runner/cats/calico.png",
    frameWidth: 647,
    frameHeight: 809,
    frameCount: 3,
  }),
  cheese: Object.freeze({
    src: "/assets/cat-runner/cats/cheese.png",
    frameWidth: 682,
    frameHeight: 768,
    frameCount: 3,
  }),
  mackerel: Object.freeze({
    src: "/assets/cat-runner/cats/mackerel.png",
    frameWidth: 724,
    frameHeight: 724,
    frameCount: 3,
  }),
  chaos: Object.freeze({
    src: "/assets/cat-runner/cats/chaos.png",
    frameWidth: 682,
    frameHeight: 768,
    frameCount: 3,
  }),
});

const BACKGROUND_ASSET_MANIFEST = Object.freeze({
  home_day: Object.freeze({
    src: "/assets/cat-runner/backgrounds/home-day.png",
    width: 1672,
    height: 941,
  }),
  outside: Object.freeze({
    src: "/assets/cat-runner/backgrounds/outside.png",
    width: 1672,
    height: 941,
  }),
  home_night: Object.freeze({
    src: "/assets/cat-runner/backgrounds/home-night.png",
    width: 1672,
    height: 941,
  }),
});

const ITEM_ASSET_MANIFEST = Object.freeze({
  obstacle: Object.freeze({
    box: Object.freeze({
      src: "/assets/cat-runner/items/box.png",
      width: 180,
      height: 160,
    }),
    fence: Object.freeze({
      src: "/assets/cat-runner/items/fence.png",
      width: 280,
      height: 80,
    }),
    pot: Object.freeze({
      src: "/assets/cat-runner/items/pot.png",
      width: 180,
      height: 160,
    }),
    yarn: Object.freeze({
      src: "/assets/cat-runner/items/yarn.png",
      width: 260,
      height: 80,
    }),
  }),
  mouse: Object.freeze({
    toy: Object.freeze({
      src: "/assets/cat-runner/items/mouse.png",
      width: 84,
      height: 84,
    }),
  }),
  grass: Object.freeze({
    "cat-grass": Object.freeze({
      src: "/assets/cat-runner/items/cat-grass.png",
      width: 96,
      height: 144,
    }),
  }),
});

export {
  BACKGROUND_ASSET_MANIFEST,
  CAT_ASSET_MANIFEST,
  CAT_POSES,
  ITEM_ASSET_MANIFEST,
};
