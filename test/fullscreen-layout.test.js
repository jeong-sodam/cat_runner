const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const root = path.join(__dirname, "..");
const styles = fs.readFileSync(path.join(root, "public", "styles.css"), "utf8");
const index = fs.readFileSync(path.join(root, "public", "index.html"), "utf8");

function rule(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return styles.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1] || "";
}

test("fullscreen shell uses the browser viewport without document padding", () => {
  const documentRule = rule("html,\nbody");
  const shellRule = rule("#game-shell");

  assert.match(documentRule, /overflow:\s*hidden/);
  assert.match(shellRule, /width:\s*100vw/);
  assert.match(shellRule, /height:\s*100vh/);
  assert.match(shellRule, /max-width:\s*none/);
  assert.match(shellRule, /max-height:\s*none/);
  assert.doesNotMatch(documentRule, /padding\s*:/);
  assert.match(styles, /@supports\s*\(height:\s*100dvh\)[\s\S]*?#game-shell\s*\{[\s\S]*?height:\s*100dvh/);
});

test("fullscreen shell preserves the frame and light-blue canvas background", () => {
  const shellRule = rule("#game-shell");
  const canvasRule = rule("#game-canvas");

  assert.match(shellRule, /overflow:\s*hidden/);
  assert.match(shellRule, /border:\s*8px\s+solid\s+var\(--outline\)/);
  assert.match(shellRule, /border-radius:\s*24px/);
  assert.match(canvasRule, /object-fit:\s*contain/);
  assert.match(canvasRule, /background:\s*#d8f3ff/);
});

test("long content scrolls inside panels instead of the document", () => {
  const characterRule = rule(".character-screen");

  assert.match(characterRule, /overflow-x:\s*hidden/);
  assert.match(characterRule, /overflow-y:\s*auto/);
  assert.match(
    styles,
    /#game-shell\[data-screen\]:not\(\[data-screen="game"\]\) \.wide-card\s*\{\s*overflow:\s*auto/,
  );
  assert.match(rule("#game-shell"), /overflow:\s*hidden/);
});

test("flow cards grow vertically without changing wide-card panels", () => {
  const flowCardRule = rule(".flow-card");
  const wideCardRule = rule(".wide-card");

  assert.match(flowCardRule, /width:\s*min\(516px,\s*calc\(100%\s*-\s*8px\)\)/);
  assert.match(
    flowCardRule,
    /padding:\s*clamp\(15px,\s*4\.5vw,\s*48px\)\s+clamp\(10px,\s*3vw,\s*32px\)/,
  );
  assert.match(flowCardRule, /max-width:\s*100%/);
  assert.match(wideCardRule, /width:\s*min\(1050px,\s*100%\)/);
  assert.match(
    styles,
    /@media\s*\(max-width:\s*500px\)[\s\S]*?\.flow-card\s*\{[\s\S]*?width:\s*min\(100%,\s*516px\)[\s\S]*?padding:\s*clamp\(15px,\s*7\.5vw,\s*33px\)\s+clamp\(10px,\s*5vw,\s*22px\)/,
  );
});

test("index keeps the responsive viewport and fullscreen layout anchors", () => {
  assert.match(index, /<meta\s+name="viewport"\s+content="width=device-width,\s*initial-scale=1">/);
  assert.match(index, /id="game-shell"/);
  assert.match(index, /id="screen-root"/);
  assert.match(index, /id="game-canvas"/);
});
