const CANVAS_FONT_FAMILY = '"Pretendard", "Noto Sans KR", "Malgun Gothic", system-ui, sans-serif';

function fitCanvasText(ctx, text, x, y, maxWidth, options = {}) {
  const minPx = Number.isFinite(options.minPx) ? options.minPx : 10;
  const maxPx = Number.isFinite(options.maxPx) ? options.maxPx : 28;
  const weight = options.weight || "bold";
  const family = options.family || CANVAS_FONT_FAMILY;
  let size = maxPx;

  const setFont = () => {
    ctx.font = `${weight} ${size}px ${family}`;
  };
  setFont();
  if (typeof ctx.measureText === "function" && Number.isFinite(maxWidth)) {
    while (size > minPx) {
      const metrics = ctx.measureText(String(text));
      const measuredWidth = Number(metrics?.width);
      if (!Number.isFinite(measuredWidth) || measuredWidth <= maxWidth) {
        break;
      }
      size -= 1;
      setFont();
    }
  }
  ctx.fillText(String(text), x, y);
  return size;
}

export { CANVAS_FONT_FAMILY, fitCanvasText };
