function createInputController(canvas, onPause, options = {}) {
  const target = canvas?.ownerDocument?.defaultView || globalThis;
  const onPointerTarget = options.onPointerDown || (() => {});
  let jumpPressed = false;
  let slideHeld = false;
  let slidePressed = false;

  function normalizeKey(event) {
    return typeof event.key === "string" ? event.key.toLowerCase() : "";
  }

  function onKeyDown(event) {
    const key = normalizeKey(event);
    if (!["w", "s", "p"].includes(key)) {
      return;
    }
    event.preventDefault?.();
    if (key === "w") {
      if (!event.repeat) {
        jumpPressed = true;
      }
    } else if (key === "s") {
      slideHeld = true;
      if (!event.repeat) {
        slidePressed = true;
      }
    } else if (key === "p" && !event.repeat) {
      onPause?.();
    }
  }

  function onKeyUp(event) {
    const key = normalizeKey(event);
    if (key !== "s") {
      return;
    }
    event.preventDefault?.();
    slideHeld = false;
  }

  function getLogicalPoint(event) {
    const rect = canvas?.getBoundingClientRect?.() || {
      left: 0,
      top: 0,
      width: canvas?.width || 1,
      height: canvas?.height || 1,
    };
    const logicalWidth = canvas?.width || rect.width;
    const logicalHeight = canvas?.height || rect.height;
    const scale = Math.min(rect.width / logicalWidth, rect.height / logicalHeight) || 1;
    const displayWidth = logicalWidth * scale;
    const displayHeight = logicalHeight * scale;
    return {
      x: (event.clientX - rect.left - (rect.width - displayWidth) / 2) / scale,
      y: (event.clientY - rect.top - (rect.height - displayHeight) / 2) / scale,
    };
  }

  function onPointerDown(event) {
    if (event.button !== 0 && event.button !== 2) {
      return;
    }
    event.preventDefault?.();
    const point = getLogicalPoint(event);
    onPointerTarget({
      ...point,
      button: event.button === 2 ? "secondary" : "primary",
      event,
    });
  }

  function onContextMenu(event) {
    event.preventDefault?.();
  }

  target.addEventListener?.("keydown", onKeyDown);
  target.addEventListener?.("keyup", onKeyUp);
  canvas?.addEventListener?.("pointerdown", onPointerDown);
  canvas?.addEventListener?.("contextmenu", onContextMenu);

  return {
    consumeJumpPress() {
      const pressed = jumpPressed;
      jumpPressed = false;
      return pressed;
    },
    isSliding() {
      return slideHeld;
    },
    consumeSlidePress() {
      const pressed = slidePressed;
      slidePressed = false;
      return pressed;
    },
    destroy() {
      target.removeEventListener?.("keydown", onKeyDown);
      target.removeEventListener?.("keyup", onKeyUp);
      canvas?.removeEventListener?.("pointerdown", onPointerDown);
      canvas?.removeEventListener?.("contextmenu", onContextMenu);
    },
  };
}

export { createInputController };
