export type GenBox = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

// Modern 9x3 block grid — tuned to fit viewBox 1000x420
export const defaultLayout: GenBox[] = (() => {
  const boxes: GenBox[] = [];
  const cols = 9;
  const rows = 3;

  const startX = 40;  // reduced from 70
  const startY = 80;
  const gapX = 14;    // reduced from 18
  const gapY = 20;    // slightly tighter
  const w = 86;       // reduced from 90
  const h = 68;

  let n = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = `GEN-${String(n).padStart(2, "0")}`;
      boxes.push({
        id,
        x: startX + c * (w + gapX),
        y: startY + r * (h + gapY),
        w,
        h,
      });
      n++;
    }
  }
  return boxes;
})();

export default defaultLayout;
