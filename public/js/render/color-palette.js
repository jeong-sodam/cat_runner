const PALETTE = Object.freeze({
  cats: Object.freeze({
    black: Object.freeze({ body: "#302d3a", patch: "#171521", eye: "#f9d976" }),
    white: Object.freeze({ body: "#fffaf2", patch: "#d9d1c8", eye: "#73c7c9" }),
    calico: Object.freeze({ body: "#fff5df", patch: "#e47d52", accent: "#302d3a", eye: "#6d4c41" }),
    cheese: Object.freeze({ body: "#e9a441", patch: "#b96c2f", eye: "#2d3b2f" }),
    mackerel: Object.freeze({ body: "#7e8fa3", patch: "#40536b", accent: "#d9e3ed", eye: "#f2d56b" }),
    chaos: Object.freeze({ body: "#f3eee2", patch: "#302d3a", accent: "#b96c2f", eye: "#6d4c41" }),
  }),
  effects: Object.freeze({
    magnet: "#4aa8ff",
    invincible: "#f9d976",
    double_score: "#b47cff",
    slow_miss: "#ff6b6b",
  }),
  rhythm: Object.freeze({
    primary: "#5f9df7",
    primaryRing: "#d9e8ff",
    secondary: "#f2a65a",
    secondaryRing: "#fff0cf",
  }),
  backgrounds: Object.freeze({
    home_day: Object.freeze({ sky: "#c9efff", floor: "#d7a56d", wall: "#fff6e8" }),
    outside: Object.freeze({ sky: "#9dd7ff", floor: "#83b96b", wall: "#b9e5ff" }),
    home_night: Object.freeze({ sky: "#25345c", floor: "#7c5a57", wall: "#4b416b" }),
  }),
  ui: Object.freeze({
    ink: "#3f2b2b",
    cream: "#fffaf5",
    emptyHeart: "#d6c7c3",
    accent: "#f28c65",
  }),
});

export { PALETTE };
