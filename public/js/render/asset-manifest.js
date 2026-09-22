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

export { BACKGROUND_ASSET_MANIFEST, CAT_ASSET_MANIFEST, CAT_POSES };
