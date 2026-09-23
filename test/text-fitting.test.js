const assert = require("node:assert/strict");
const { test } = require("node:test");

test("DOM title fitting shrinks to the available width but respects its minimum", async () => {
  const { fitSingleLineText } = await import("../public/js/ui/text-fitting.js");
  const element = {
    style: {},
    parentElement: null,
    get scrollWidth() {
      const size = Number.parseFloat(this.style.fontSize) || 48;
      return 500 * (size / 48);
    },
  };
  const container = {
    clientWidth: 200,
    getBoundingClientRect: () => ({ width: 200 }),
  };
  element.parentElement = container;

  fitSingleLineText(element, { minPx: 20, maxPx: 48, container });

  assert.equal(element.style.fontSize, "20px");
});

test("DOM title fitting is safe without layout measurement or ResizeObserver", async () => {
  const { fitSingleLineText } = await import("../public/js/ui/text-fitting.js");
  const element = { style: {}, scrollWidth: 0, parentElement: null };
  assert.doesNotThrow(() => fitSingleLineText(element));
});

test("canvas text fitting keeps labels within width and uses the shared family", async () => {
  const { CANVAS_FONT_FAMILY, fitCanvasText } = await import("../public/js/render/text-fitting.js");
  const calls = [];
  const context = {
    font: "",
    measureText(value) {
      const size = Number.parseInt(this.font, 10) || 28;
      return { width: value.length * size * 0.8 };
    },
    fillText(...args) {
      calls.push(args);
    },
  };

  const size = fitCanvasText(context, "정확도 100%", 0, 0, 40, { minPx: 10, maxPx: 22 });

  assert.equal(size, 10);
  assert.match(context.font, /Pretendard/);
  assert.deepEqual(calls, [["정확도 100%", 0, 0]]);
  assert.match(CANVAS_FONT_FAMILY, /Noto Sans KR/);
});
