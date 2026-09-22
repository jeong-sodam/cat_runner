import {
  BACKGROUND_ASSET_MANIFEST,
  CAT_ASSET_MANIFEST,
  ITEM_ASSET_MANIFEST,
} from "./asset-manifest.js";

function createAssetLoader(options = {}) {
  const manifest = options.manifest || {
    cats: CAT_ASSET_MANIFEST,
    backgrounds: BACKGROUND_ASSET_MANIFEST,
    items: ITEM_ASSET_MANIFEST,
  };
  const ImageCtor = options.ImageCtor === undefined ? globalThis.Image : options.ImageCtor;
  const state = {
    status: "idle",
    cats: new Map(),
    backgrounds: new Map(),
    items: new Map(),
    failures: new Set(),
  };
  let preloadPromise = null;

  function recordFailure(kind, id) {
    state.failures.add(kind + ":" + id);
  }

  function loadImage(kind, id, definition) {
    return new Promise((resolve) => {
      if (typeof ImageCtor !== "function" || !definition?.src) {
        recordFailure(kind, id);
        resolve(null);
        return;
      }

      let image;
      try {
        image = new ImageCtor();
      } catch {
        recordFailure(kind, id);
        resolve(null);
        return;
      }

      let settled = false;
      const settle = (success) => {
        if (settled) {
          return;
        }
        settled = true;
        if (success) {
          state[kind].set(id, image);
        } else {
          recordFailure(kind, id);
        }
        resolve(success ? image : null);
      };
      image.onload = () => settle(true);
      image.onerror = () => settle(false);
      try {
        image.src = definition.src;
      } catch {
        settle(false);
      }
    });
  }

  function preload() {
    if (preloadPromise) {
      return preloadPromise;
    }
    state.status = "loading";
    const catLoads = Object.entries(manifest.cats || {}).map(([id, definition]) =>
      loadImage("cats", id, definition),
    );
    const backgroundLoads = Object.entries(manifest.backgrounds || {}).map(([id, definition]) =>
      loadImage("backgrounds", id, definition),
    );
    const itemLoads = Object.entries(manifest.items || {}).flatMap(([type, variants]) =>
      Object.entries(variants || {}).map(([variant, definition]) =>
        loadImage("items", `${type}:${variant}`, definition),
      ),
    );
    preloadPromise = Promise.all([...catLoads, ...backgroundLoads, ...itemLoads])
      .catch(() => [])
      .then(() => {
        state.status = "ready";
        return getState();
      });
    return preloadPromise;
  }

  function getCatSprite(catId) {
    return state.cats.get(catId) || null;
  }

  function getBackgroundSprite(zoneId) {
    return state.backgrounds.get(zoneId) || null;
  }

  function getItemSprite(type, variant) {
    return state.items.get(`${type}:${variant}`) || null;
  }

  function getCatPreviewSrc(catId) {
    return manifest.cats?.[catId]?.src || null;
  }

  function getState() {
    return {
      status: state.status,
      cats: new Map(state.cats),
      backgrounds: new Map(state.backgrounds),
      items: new Map(state.items),
      failures: new Set(state.failures),
    };
  }

  return {
    preload,
    getCatSprite,
    getBackgroundSprite,
    getItemSprite,
    getCatPreviewSrc,
    getState,
  };
}

export { createAssetLoader };
