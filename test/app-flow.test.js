const assert = require("node:assert/strict");
const { test } = require("node:test");

class FakeElement {
  constructor(documentRef, tagName) {
    this.ownerDocument = documentRef;
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.listeners = new Map();
    this.attributes = new Map();
    this.dataset = {};
    this.className = "";
    this.textContent = "";
    this.hidden = false;
    this.disabled = false;
    this.value = "";
    this.checked = false;
    this.style = {};
  }

  append(...children) {
    for (const child of children) {
      if (child && typeof child === "object") {
        child.parentNode = this;
        this.children.push(child);
      }
    }
  }

  replaceChildren(...children) {
    this.children = [];
    this.append(...children);
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatch(type, event = {}) {
    const nextEvent = {
      target: this,
      preventDefault() {
        nextEvent.defaultPrevented = true;
      },
      ...event,
    };
    for (const listener of this.listeners.get(type) || []) {
      listener(nextEvent);
    }
    return nextEvent;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) || null;
  }

  focus() {}
}

class FakeDocument {
  constructor() {
    this.defaultView = {
      addEventListener() {},
      removeEventListener() {},
    };
    this.elements = new Map();
  }

  createElement(tagName) {
    return new FakeElement(this, tagName);
  }

  getElementById(id) {
    return this.elements.get(id) || null;
  }

  register(id, element) {
    this.elements.set(id, element);
    return element;
  }
}

function createAppDocument() {
  const documentRef = new FakeDocument();
  documentRef.register("screen-root", documentRef.createElement("section"));
  documentRef.register("game-canvas", documentRef.createElement("canvas"));
  documentRef.register("game-shell", documentRef.createElement("main"));
  return documentRef;
}

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

function findAll(element, predicate) {
  const found = [];
  for (const child of element.children || []) {
    if (predicate(child)) {
      found.push(child);
    }
    found.push(...findAll(child, predicate));
  }
  return found;
}

function textOf(element) {
  return [element.textContent || "", ...(element.children || []).map(textOf)].join(" ");
}

test("unauthenticated bootstrap shows sign-in and never enters character selection", async () => {
  const { createAppController, SCREEN_NAMES } = await import("../public/js/app/app-controller.js");
  const documentRef = createAppDocument();
  const controller = createAppController({
    documentRef,
    fetchFn: async () => jsonResponse({ authenticated: false }),
  });

  await controller.bootstrap();

  assert.equal(controller.getState().screen, SCREEN_NAMES.AUTH);
  assert.equal(documentRef.getElementById("screen-root").children[0].className, "auth-screen flow-card");
  assert.equal(findAll(documentRef.getElementById("screen-root"), (element) => element.tagName === "A").length, 1);
});

test("missing auth configuration renders setup guidance without a secret", async () => {
  const { createAppController, SCREEN_NAMES } = await import("../public/js/app/app-controller.js");
  const documentRef = createAppDocument();
  const controller = createAppController({
    documentRef,
    fetchFn: async () => jsonResponse({ error: { code: "AUTH_CONFIG_MISSING" } }, 503),
  });

  await controller.bootstrap();

  const screen = documentRef.getElementById("screen-root");
  assert.equal(controller.getState().screen, SCREEN_NAMES.AUTH_CONFIG_ERROR);
  assert.equal(screen.children[0].dataset.state, "auth-config-error");
  assert.doesNotMatch(textOf(screen), /client-secret-value/);
});

test("authenticated users without a nickname receive nickname onboarding", async () => {
  const { createAppController, SCREEN_NAMES } = await import("../public/js/app/app-controller.js");
  const documentRef = createAppDocument();
  let savedUser = null;
  const controller = createAppController({
    documentRef,
    fetchFn: async (url, request = {}) => {
      if (request.method === "PATCH") {
        savedUser = { id: "user-1", email: "cat@example.com", nickname: "same-name" };
        return jsonResponse({ user: savedUser });
      }
      return jsonResponse({
        authenticated: true,
        user: { id: "user-1", email: "cat@example.com", nickname: null },
      });
    },
  });

  await controller.bootstrap();
  assert.equal(controller.getState().screen, SCREEN_NAMES.NICKNAME);
  const screen = documentRef.getElementById("screen-root");
  const input = findAll(screen, (element) => element.tagName === "INPUT")[0];
  const form = findAll(screen, (element) => element.tagName === "FORM")[0];
  input.value = "same-name";
  form.dispatch("submit");
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(savedUser, controller.getState().user);
  assert.equal(controller.getState().screen, SCREEN_NAMES.CHARACTER_SELECT);
});

test("character selection renders six cats and defaults each new run to black", async () => {
  const { createCharacterSelect } = await import("../public/js/ui/character-select.js");
  const documentRef = createAppDocument();
  const root = documentRef.createElement("section");
  let started = null;
  const select = createCharacterSelect((value) => {
    started = value;
  }, { documentRef });

  select.mount(root);
  const section = root.children[0];
  const cards = section.children[2].children;
  assert.deepEqual(select.getCatIds(), ["black", "white", "calico", "cheese", "mackerel", "chaos"]);
  assert.equal(cards.length, 6);
  assert.match(cards[0].className, /selected/);

  cards[4].dispatch("click");
  assert.match(section.children[2].children[4].className, /selected/);
  section.children[3].dispatch("click");
  assert.deepEqual(started, { catId: "mackerel" });
});

test("result screen shows local retry state without claiming an unsaved rank", async () => {
  const { createResultScreen } = await import("../public/js/ui/result-screen.js");
  const documentRef = createAppDocument();
  const root = documentRef.createElement("section");
  let retries = 0;
  let restarted = 0;
  let opened = 0;
  createResultScreen(
    {
      score: 42,
      distanceM: 12.5,
      mouseCount: 3,
      rank: 2,
      saved: false,
      errorMessage: "not saved",
    },
    {
      onRetry: () => { retries += 1; },
      onRestart: () => { restarted += 1; },
      onLeaderboard: () => { opened += 1; },
    },
    { documentRef },
  ).mount(root);

  assert.match(textOf(root), /not saved/);
  assert.doesNotMatch(textOf(root), /Leaderboard rank/);
  const buttons = findAll(root, (element) => element.tagName === "BUTTON");
  buttons[0].dispatch("click");
  buttons[1].dispatch("click");
  buttons[2].dispatch("click");
  assert.deepEqual({ retries, restarted, opened }, { retries: 1, restarted: 1, opened: 1 });
});

test("leaderboard renders full email and XSS-like values as text, with retry", async () => {
  const { createLeaderboardPanel } = await import("../public/js/ui/leaderboard.js");
  const documentRef = createAppDocument();
  const root = documentRef.createElement("section");
  let calls = 0;
  const panel = createLeaderboardPanel(
    {
      getLeaderboard: async () => {
        calls += 1;
        if (calls === 1) {
          throw new Error("temporary");
        }
        return {
          entries: [{
            rank: 1,
            nickname: "<script>alert(1)</script>",
            email: "full-address@example.com",
            score: 99,
            distanceM: 25.5,
          }],
        };
      },
    },
    {},
    { documentRef },
  );
  panel.mount(root);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.match(textOf(root), /Leaderboard could not be loaded/);
  const retry = findAll(root, (element) => element.tagName === "BUTTON")[0];
  retry.dispatch("click");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.match(textOf(root), /<script>alert\(1\)<\/script>/);
  assert.match(textOf(root), /full-address@example.com/);
  assert.equal(findAll(root, (element) => element.tagName === "TR").length, 2);
});
