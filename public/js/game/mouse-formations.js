const FORMATION_CELL_SIZE = 42;
const FORMATION_CELL_STEP = 34;
const FORMATION_WIDTH = FORMATION_CELL_SIZE + FORMATION_CELL_STEP * 4;
const FORMATION_HEIGHT = FORMATION_WIDTH;
const FORMATION_KINDS = Object.freeze([
  "heart",
  "star",
  "clover",
  "thumbsUp",
  "alphabet",
]);
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const FORMATION_MASK_ROWS = Object.freeze({
  heart: Object.freeze([
    "01110",
    "11111",
    "11111",
    "01110",
    "00100",
  ]),
  star: Object.freeze([
    "00100",
    "10101",
    "01110",
    "11111",
    "00100",
  ]),
  clover: Object.freeze([
    "01010",
    "11111",
    "01110",
    "11111",
    "01010",
  ]),
  thumbsUp: Object.freeze([
    "00100",
    "01100",
    "01111",
    "11111",
    "11111",
  ]),
});

const ALPHABET_MASK_ROWS = Object.freeze({
  A: ["01110", "10001", "11111", "10001", "10001"],
  B: ["11110", "10001", "11110", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "11110", "10000", "11111"],
  F: ["11111", "10000", "11110", "10000", "10000"],
  G: ["01111", "10000", "10111", "10001", "01111"],
  H: ["10001", "10001", "11111", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "11100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001"],
  O: ["01110", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "11110", "10000", "10000"],
  Q: ["01110", "10001", "10101", "10011", "01111"],
  R: ["11110", "10001", "11110", "10010", "10001"],
  S: ["01111", "10000", "01110", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10101", "11011", "10001"],
  X: ["10001", "01010", "00100", "01010", "10001"],
  Y: ["10001", "01010", "00100", "00100", "00100"],
  Z: ["11111", "00010", "00100", "01000", "11111"],
});

const ALPHABET_MASKS = Object.freeze(
  Object.fromEntries(
    Object.entries(ALPHABET_MASK_ROWS).map(([letter, rows]) => [
      letter,
      Object.freeze(rows),
    ]),
  ),
);

function normalizeRandom(randomSource) {
  const value = typeof randomSource === "function"
    ? randomSource()
    : Number(randomSource);
  return Number.isFinite(value) ? Math.min(0.999999, Math.max(0, value)) : 0;
}

function maskRowsToCells(rows) {
  if (!Array.isArray(rows) || rows.length !== 5 || rows.some((row) => row.length !== 5)) {
    throw new Error("Formation masks must be five rows of five cells.");
  }
  return Object.freeze(
    rows.flatMap((row, rowIndex) =>
      [...row].flatMap((cell, columnIndex) =>
        cell === "1" ? [{ column: columnIndex, row: rowIndex }] : [],
      ),
    ).map((cell) => Object.freeze(cell)),
  );
}

function chooseKind(random) {
  return FORMATION_KINDS[Math.floor(random() * FORMATION_KINDS.length)];
}

function createFormation(randomSource = Math.random, options = {}) {
  const random = () => normalizeRandom(randomSource);
  const kind = options.kind || chooseKind(random);
  if (!FORMATION_KINDS.includes(kind)) {
    throw new Error("Unknown formation kind: " + kind);
  }

  if (kind === "alphabet") {
    const label = options.label || ALPHABET[Math.floor(random() * ALPHABET.length)];
    if (!ALPHABET_MASKS[label]) {
      throw new Error("Unknown formation letter: " + label);
    }
    const isDex = options.forceDex === true ||
      (options.forceDex !== false && random() < 0.05);
    const sequence = isDex ? Object.freeze(["D", "E", "X"]) : null;
    return Object.freeze({
      kind,
      label: isDex ? "DEX" : label,
      cells: maskRowsToCells(ALPHABET_MASKS[isDex ? "D" : label]),
      width: FORMATION_WIDTH,
      height: FORMATION_HEIGHT,
      isDex,
      obstacleSuppressed: isDex,
      sequence,
    });
  }

  return Object.freeze({
    kind,
    label: kind,
    cells: maskRowsToCells(FORMATION_MASK_ROWS[kind]),
    width: FORMATION_WIDTH,
    height: FORMATION_HEIGHT,
    isDex: false,
    obstacleSuppressed: false,
    sequence: null,
  });
}

export {
  ALPHABET_MASKS,
  FORMATION_CELL_SIZE,
  FORMATION_CELL_STEP,
  FORMATION_HEIGHT,
  FORMATION_KINDS,
  FORMATION_MASK_ROWS,
  FORMATION_WIDTH,
  createFormation,
  maskRowsToCells,
};

