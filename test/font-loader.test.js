const assert = require("node:assert/strict");
const { test } = require("node:test");

test("waitForFonts waits for the document font readiness promise", async () => {
  const { waitForFonts } = await import("../public/js/ui/font-loader.js");
  let resolveReady;
  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });
  let settled = false;
  const waiting = waitForFonts({ fonts: { ready } }).then(() => {
    settled = true;
  });

  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(settled, false);
  resolveReady();
  await waiting;
  assert.equal(settled, true);
});

test("waitForFonts tolerates rejected and unavailable font APIs", async () => {
  const { waitForFonts } = await import("../public/js/ui/font-loader.js");

  await assert.doesNotReject(waitForFonts({ fonts: { ready: Promise.reject(new Error("font failed")) } }));
  await assert.doesNotReject(waitForFonts({}));
  await assert.doesNotReject(waitForFonts(null));
});
