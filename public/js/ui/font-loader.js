async function waitForFonts(documentRef = globalThis.document) {
  try {
    const ready = documentRef?.fonts?.ready;
    if (ready && typeof ready.then === "function") {
      await ready;
    }
  } catch {
    // Font loading is best effort; CSS fallbacks and canvas fallbacks remain available.
  }
}

export { waitForFonts };
