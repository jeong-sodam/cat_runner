const assert = require("node:assert/strict");
const { test } = require("node:test");

test("pause hitbox accepts inclusive edges and rejects outside or invalid points", async () => {
  const { isPointInsideRect } = await import("../public/js/ui/pause-hitbox.js");
  const rect = { x: 1480, y: 24, width: 86, height: 52 };

  for (const point of [
    { x: 1480, y: 24 },
    { x: 1566, y: 24 },
    { x: 1480, y: 76 },
    { x: 1566, y: 76 },
    { x: 1523, y: 50 },
  ]) {
    assert.equal(isPointInsideRect(point, rect), true);
  }

  for (const point of [
    { x: 1479, y: 50 },
    { x: 1567, y: 50 },
    { x: 1523, y: 23 },
    { x: 1523, y: 77 },
    { x: Number.NaN, y: 50 },
  ]) {
    assert.equal(isPointInsideRect(point, rect), false);
  }

  assert.equal(isPointInsideRect({ x: 1523, y: 50 }, null), false);
  assert.equal(isPointInsideRect({ x: 1523, y: 50 }, { x: 1480, y: 24 }), false);
});
