function getWidth(element) {
  const rect = element?.getBoundingClientRect?.();
  if (Number.isFinite(rect?.width) && rect.width > 0) {
    return rect.width;
  }
  const width = Number(element?.clientWidth);
  return width > 0 ? width : 0;
}

function fitSingleLineText(element, options = {}) {
  if (!element?.style) {
    return () => {};
  }

  const minPx = Number.isFinite(options.minPx) ? options.minPx : 20;
  const maxPx = Number.isFinite(options.maxPx) ? options.maxPx : 48;
  const container = options.container || element.parentElement;

  function fit() {
    const availableWidth = getWidth(container) || getWidth(element);
    if (!availableWidth) {
      return minPx;
    }
    let size = maxPx;
    element.style.fontSize = `${size}px`;
    while (size > minPx && element.scrollWidth > availableWidth) {
      size -= 1;
      element.style.fontSize = `${size}px`;
    }
    return size;
  }

  fit();
  if (typeof globalThis.ResizeObserver === "function" && container) {
    const observer = new globalThis.ResizeObserver(fit);
    observer.observe(container);
    return () => observer.disconnect();
  }
  return () => {};
}

export { fitSingleLineText };
