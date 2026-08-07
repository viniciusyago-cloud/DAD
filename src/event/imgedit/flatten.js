/* ============================================================
   FLATTEN — bake {src, crop, layers} into a single PNG.
   Used by the asset library: a library icon must be one real
   reusable file, not a value only our renderer understands.
   ============================================================ */

import { normImg } from "./Pic.jsx";
import { loadImage, canvasToBlob } from "./bgremove.js";

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* SVG markup for one layer, in cropped-pixel space. Icons are skipped
   here — external images don't load inside a canvas-drawn SVG, so they
   are painted separately with drawImage. */
function layerSvg(l, W, H) {
  const X = (x) => (x * W).toFixed(2), Y = (y) => (y * H).toFixed(2);
  const c = l.color || "#ecc25a";
  switch (l.type) {
    case "pin": {
      const r = l.size || 14;
      return `<g transform="translate(${X(l.x)} ${Y(l.y)})">
        <circle r="${r + 4}" fill="#0d1218" opacity="0.55"/>
        <circle r="${r}" fill="${c}" stroke="#0d1218" stroke-width="2.5"/>
        ${l.label ? `<text y="${(r * 0.36).toFixed(1)}" text-anchor="middle" fill="#0d1218"
          font-family="system-ui, sans-serif" font-weight="800" font-size="${(r * 1.05).toFixed(1)}">${esc(l.label)}</text>` : ""}
      </g>`;
    }
    case "text": {
      const s = l.size || 22;
      return `<text x="${X(l.x)}" y="${Y(l.y)}" fill="${c}" stroke="#0d1218"
        stroke-width="${(s * 0.22).toFixed(1)}" paint-order="stroke"
        font-family="system-ui, sans-serif" font-weight="800" font-size="${s}">${esc(l.text)}</text>`;
    }
    case "route": {
      if ((l.pts || []).length < 2) return "";
      const pts = l.pts.map(([x, y]) => `${X(x)},${Y(y)}`).join(" ");
      const w = l.width || 6;
      return `<polyline points="${pts}" fill="none" stroke="#0d1218" stroke-width="${w + 5}"
                stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
              <polyline points="${pts}" fill="none" stroke="${c}" stroke-width="${w}"
                stroke-linecap="round" stroke-linejoin="round"${l.arrow === false ? "" : ` marker-end="url(#m${l.id})"`}/>`;
    }
    case "arrow": {
      const w = l.width || 6;
      return `<line x1="${X(l.x)}" y1="${Y(l.y)}" x2="${X(l.x2)}" y2="${Y(l.y2)}" stroke="#0d1218"
                stroke-width="${w + 5}" stroke-linecap="round" opacity="0.5"/>
              <line x1="${X(l.x)}" y1="${Y(l.y)}" x2="${X(l.x2)}" y2="${Y(l.y2)}" stroke="${c}"
                stroke-width="${w}" stroke-linecap="round" marker-end="url(#m${l.id})"/>`;
    }
    case "rect":
      return `<rect x="${X(Math.min(l.x, l.x2))}" y="${Y(Math.min(l.y, l.y2))}"
        width="${(Math.abs(l.x2 - l.x) * W).toFixed(2)}" height="${(Math.abs(l.y2 - l.y) * H).toFixed(2)}"
        rx="${l.radius ?? 4}" fill="${l.fill ? c : "none"}" fill-opacity="${l.fill ? (l.fillOp ?? 0.22) : 0}"
        stroke="${c}" stroke-width="${l.width || 5}"/>`;
    case "circle": {
      const rx = (Math.abs(l.x2 - l.x) * W) / 2, ry = (Math.abs(l.y2 - l.y) * H) / 2;
      return `<ellipse cx="${((l.x + (l.x2 - l.x) / 2) * W).toFixed(2)}" cy="${((l.y + (l.y2 - l.y) / 2) * H).toFixed(2)}"
        rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}" fill="${l.fill ? c : "none"}"
        fill-opacity="${l.fill ? (l.fillOp ?? 0.22) : 0}" stroke="${c}" stroke-width="${l.width || 5}"/>`;
    }
    default:
      return "";
  }
}

/** Render {src, crop, layers} to a PNG Blob. */
export async function flattenToPng(value) {
  const { src, crop, layers } = normImg(value);
  if (!src) throw new Error("no source");

  const img = await loadImage(src);
  const nw = img.naturalWidth, nh = img.naturalHeight;
  const c = crop || { x: 0, y: 0, w: 1, h: 1 };
  const W = Math.max(1, Math.round(nw * c.w)), H = Math.max(1, Math.round(nh * c.h));

  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  ctx.drawImage(img, c.x * nw, c.y * nh, W, H, 0, 0, W, H);

  const vector = layers.filter((l) => l.type !== "icon");
  if (vector.length) {
    const markers = vector
      .filter((l) => (l.type === "route" && l.arrow !== false) || l.type === "arrow")
      .map((l) => `<marker id="m${l.id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="2.6"
          markerHeight="2.6" orient="auto-start-reverse" markerUnits="strokeWidth">
          <path d="M0 0 L10 5 L0 10 z" fill="${l.color || "#ecc25a"}"/></marker>`).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs>${markers}</defs>${vector.map((l) => layerSvg(l, W, H)).join("")}</svg>`;
    const overlay = await loadImage("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg));
    ctx.drawImage(overlay, 0, 0, W, H);
  }

  // icon layers are real images — paint them directly
  for (const l of layers.filter((x) => x.type === "icon")) {
    try {
      const ic = await loadImage(l.src);
      const s = l.size || 32;
      ctx.drawImage(ic, l.x * W - s / 2, l.y * H - s / 2, s, s);
    } catch { /* a missing icon shouldn't fail the whole export */ }
  }

  return canvasToBlob(cv);
}
