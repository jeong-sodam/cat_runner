const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const root = path.join(__dirname, "..");
const styles = fs.readFileSync(path.join(root, "public", "styles.css"), "utf8");
const index = fs.readFileSync(path.join(root, "public", "index.html"), "utf8");

test("local Pretendard asset and font fallback contract are present", () => {
  assert.equal(
    fs.existsSync(path.join(root, "public", "assets", "fonts", "PretendardVariable.woff2")),
    true,
  );
  assert.match(styles, /@font-face/);
  assert.match(styles, /PretendardVariable\.woff2/);
  assert.match(styles, /font-display:\s*block/);
  assert.match(styles, /"Pretendard",\s*"Noto Sans KR",\s*"Malgun Gothic",\s*system-ui/);
});

test("responsive title and body rules avoid clipping contracts", () => {
  const rootHeadingRule = styles.match(/#screen-root h1\s*\{([^}]+)\}/)?.[1] || "";
  const cardHeadingRule = styles.match(/\.flow-card h1\s*\{([^}]+)\}/)?.[1] || "";
  assert.doesNotMatch(rootHeadingRule, /text-overflow:\s*ellipsis/);
  assert.doesNotMatch(cardHeadingRule, /text-overflow:\s*ellipsis/);
  assert.match(styles, /\.flow-card p,[\s\S]*?overflow-wrap:\s*anywhere/);
  assert.match(styles, /@media\s*\(max-width:\s*360px\)/);
  assert.match(styles, /font-size:\s*clamp\(1\.25rem,\s*6vw,\s*2\.2rem\)/);
  assert.match(styles, /#game-shell\[data-screen\]:not\(\[data-screen="game"\]\)/);
  assert.match(styles, /height:\s*min\(calc\(100dvh - 48px\),\s*900px\)/);
  assert.match(styles, /#game-shell\[data-screen\]:not\(\[data-screen="game"\]\) #screen-root[\s\S]*?overflow:\s*hidden/);
});

test("character selection scroll is scoped to the inner panel", () => {
  const characterRule = styles.match(/\.character-screen\s*\{([^}]+)\}/)?.[1] || "";
  const scopedCharacterRule = styles.match(
    /#game-shell\[data-screen\]:not\(\[data-screen="game"\]\) \.character-screen\s*\{([^}]+)\}/,
  )?.[1] || "";

  assert.match(characterRule, /min-height:\s*0/);
  assert.match(characterRule, /align-content:\s*start/);
  assert.match(characterRule, /overflow-x:\s*hidden/);
  assert.match(characterRule, /overflow-y:\s*auto/);
  assert.match(scopedCharacterRule, /overflow-y:\s*auto/);
  assert.match(
    styles,
    /#game-shell\[data-screen\]:not\(\[data-screen="game"\]\) \.wide-card[\s\S]*?overflow:\s*hidden/,
  );
});

test("index provides the responsive viewport and stylesheet", () => {
  assert.match(index, /name="viewport"/);
  assert.match(index, /href="\/styles\.css"/);
});
