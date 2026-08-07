/* ============================================================
   BACKGROUND REMOVAL (client-side, canvas)
   Two modes:
     edge — flood-fill from the borders; only background that
            touches the outside is removed, so a white shirt in
            the middle of the subject survives.
     all  — every pixel matching the colour, anywhere.
   Plus tolerance and edge feathering for clean cut-outs.
   ============================================================ */

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("load"));
    im.src = src;
  });
}

const dist = (r, g, b, tr, tg, tb) =>
  Math.sqrt((r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2);

/** Sample the average colour of the four corners. */
export function autoColor(ctx, w, h) {
  const pts = [[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3]];
  let r = 0, g = 0, b = 0;
  for (const [x, y] of pts) {
    const d = ctx.getImageData(x, y, 1, 1).data;
    r += d[0]; g += d[1]; b += d[2];
  }
  return [Math.round(r / 4), Math.round(g / 4), Math.round(b / 4)];
}

export function pickColor(ctx, x, y) {
  const d = ctx.getImageData(x, y, 1, 1).data;
  return [d[0], d[1], d[2]];
}

/**
 * @param {ImageData} srcData  untouched source pixels
 * @param {object} o { color:[r,g,b], tolerance:0..100, mode:'edge'|'all', feather:0..20 }
 * @returns {ImageData} new pixels with alpha knocked out
 */
export function removeBackground(srcData, o) {
  const { width: w, height: h } = srcData;
  const src = srcData.data;
  const out = new Uint8ClampedArray(src);          // copy
  const [tr, tg, tb] = o.color;
  const tol = Math.max(1, (o.tolerance ?? 30) * 1.8);   // 0..180
  const soft = Math.max(0, o.feather ?? 6) * 1.8;

  const alphaFor = (i) => {
    const d = dist(src[i], src[i + 1], src[i + 2], tr, tg, tb);
    if (d <= tol) return 0;                                  // fully background
    if (soft > 0 && d <= tol + soft) return Math.round(255 * ((d - tol) / soft)); // edge blend
    return -1;                                               // keep as-is
  };

  if (o.mode === "all") {
    for (let i = 0; i < src.length; i += 4) {
      const a = alphaFor(i);
      if (a >= 0) out[i + 3] = Math.min(out[i + 3], a);
    }
    return new ImageData(out, w, h);
  }

  // edge mode: BFS from every border pixel through background-ish pixels
  const seen = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (seen[p]) return;
    seen[p] = 1;
    stack.push(p);
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }

  while (stack.length) {
    const p = stack.pop();
    const i = p * 4;
    const a = alphaFor(i);
    if (a < 0) continue;                 // not background — stop spreading here
    out[i + 3] = Math.min(out[i + 3], a);
    if (a > 0) continue;                 // feathered edge: don't spread past it
    const x = p % w, y = (p / w) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  return new ImageData(out, w, h);
}

/** Trim fully-transparent margins so the cut-out sits tight in its box. */
export function trimTransparent(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const { width: w, height: h } = canvas;
  const d = ctx.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return canvas;                       // fully transparent — leave it
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  if (cw === w && ch === h) return canvas;
  const cut = document.createElement("canvas");
  cut.width = cw; cut.height = ch;
  cut.getContext("2d").drawImage(canvas, x0, y0, cw, ch, 0, 0, cw, ch);
  return cut;
}

export const canvasToBlob = (canvas) =>
  new Promise((res) => canvas.toBlob(res, "image/png"));
