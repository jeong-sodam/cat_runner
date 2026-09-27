function isPointInsideRect(point, rect) {
  const x = Number(point?.x);
  const y = Number(point?.y);
  const left = Number(rect?.x);
  const top = Number(rect?.y);
  const width = Number(rect?.width);
  const height = Number(rect?.height);
  if (![x, y, left, top, width, height].every(Number.isFinite)) {
    return false;
  }
  if (width < 0 || height < 0) {
    return false;
  }
  return x >= left && x <= left + width && y >= top && y <= top + height;
}

export { isPointInsideRect };
