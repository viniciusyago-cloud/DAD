import React from "react";

/* ============================================================
   ANNOTATED IMAGE — renderer
   An image value is either a plain URL string or:
     { src, crop:{x,y,w,h}, layers:[...] }
   Coordinates are normalised 0..1 against the (cropped) image,
   so annotations scale with any display size.
   ============================================================ */

export const normImg = (v) =>
  typeof v === "string" || !v
    ? { src: v || "", crop: null, layers: [] }
    : { src: v.src || "", crop: v.crop || null, layers: Array.isArray(v.layers) ? v.layers : [] };

export const imgSrc = (v) => normImg(v).src;
export const hasAnno = (v) => { const n = normImg(v); return !!(n.layers.length || n.crop); };

export const ANIMS = [
  { v: "", l: "Nenhuma" },
  { v: "pulse", l: "Pulsar" },
  { v: "blink", l: "Piscar" },
  { v: "pop", l: "Surgir" },
  { v: "fade", l: "Aparecer" },
  { v: "bounce", l: "Saltar" },
  { v: "draw", l: "Desenhar (rotas)" },
  { v: "dash", l: "Fluxo (rotas)" },
];

const animClass = (a) => (a ? ` an-${a}` : "");
const animStyle = (l) => ({
  animationDelay: l.delay ? `${l.delay}s` : undefined,
  animationDuration: l.dur ? `${l.dur}s` : undefined,
});

/* --- one layer --- */
function Layer({ l, W, H }) {
  const X = (x) => x * W, Y = (y) => y * H;
  const c = l.color || "#ecc25a";
  const cls = animClass(l.anim);
  const st = animStyle(l);

  switch (l.type) {
    case "pin": {
      const r = (l.size || 14);
      return (
        <g className={`an-l${cls}`} style={st} transform={`translate(${X(l.x)} ${Y(l.y)})`}>
          <circle r={r + 4} fill="#0d1218" opacity="0.55" />
          <circle r={r} fill={c} stroke="#0d1218" strokeWidth="2.5" />
          {l.label ? (
            <text y={r * 0.36} textAnchor="middle" fill="#0d1218"
                  style={{ font: `800 ${r * 1.05}px system-ui, sans-serif` }}>{l.label}</text>
          ) : null}
        </g>
      );
    }
    case "icon":
      return (
        <g className={`an-l${cls}`} style={st}>
          <image href={l.src} x={X(l.x) - (l.size || 32) / 2} y={Y(l.y) - (l.size || 32) / 2}
                 width={l.size || 32} height={l.size || 32} />
        </g>
      );
    case "text": {
      const s = l.size || 22;
      return (
        <g className={`an-l${cls}`} style={st}>
          <text x={X(l.x)} y={Y(l.y)} textAnchor={l.align || "start"} fill={c}
                stroke="#0d1218" strokeWidth={s * 0.22} paintOrder="stroke"
                style={{ font: `800 ${s}px system-ui, sans-serif`, whiteSpace: "pre" }}>{l.text}</text>
        </g>
      );
    }
    case "route": {
      const pts = (l.pts || []).map(([x, y]) => `${X(x)},${Y(y)}`).join(" ");
      if ((l.pts || []).length < 2) return null;
      const w = l.width || 6;
      return (
        <g className={`an-l${cls}`} style={st}>
          <polyline points={pts} fill="none" stroke="#0d1218" strokeWidth={w + 5}
                    strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          <polyline className={l.anim === "draw" ? "an-draw-p" : l.anim === "dash" ? "an-dash-p" : ""}
                    points={pts} fill="none" stroke={c} strokeWidth={w}
                    strokeLinecap="round" strokeLinejoin="round"
                    markerEnd={l.arrow === false ? undefined : `url(#ah-${l.id})`}
                    pathLength={l.anim === "draw" ? 1 : undefined} style={st} />
        </g>
      );
    }
    case "arrow": {
      const w = l.width || 6;
      return (
        <g className={`an-l${cls}`} style={st}>
          <line x1={X(l.x)} y1={Y(l.y)} x2={X(l.x2)} y2={Y(l.y2)} stroke="#0d1218" strokeWidth={w + 5} strokeLinecap="round" opacity="0.5" />
          <line x1={X(l.x)} y1={Y(l.y)} x2={X(l.x2)} y2={Y(l.y2)} stroke={c} strokeWidth={w}
                strokeLinecap="round" markerEnd={`url(#ah-${l.id})`} />
        </g>
      );
    }
    case "rect":
      return (
        <g className={`an-l${cls}`} style={st}>
          <rect x={X(Math.min(l.x, l.x2))} y={Y(Math.min(l.y, l.y2))}
                width={Math.abs(X(l.x2) - X(l.x))} height={Math.abs(Y(l.y2) - Y(l.y))}
                rx={l.radius ?? 4} fill={l.fill ? c : "none"} fillOpacity={l.fill ? (l.fillOp ?? 0.22) : 0}
                stroke={c} strokeWidth={l.width || 5} />
        </g>
      );
    case "circle": {
      const rx = Math.abs(X(l.x2) - X(l.x)) / 2, ry = Math.abs(Y(l.y2) - Y(l.y)) / 2;
      return (
        <g className={`an-l${cls}`} style={st}>
          <ellipse cx={X(l.x) + (X(l.x2) - X(l.x)) / 2} cy={Y(l.y) + (Y(l.y2) - Y(l.y)) / 2}
                   rx={rx} ry={ry} fill={l.fill ? c : "none"} fillOpacity={l.fill ? (l.fillOp ?? 0.22) : 0}
                   stroke={c} strokeWidth={l.width || 5} />
        </g>
      );
    }
    default:
      return null;
  }
}

/* --- the picture --- */
export default function Pic({ v, className, style, alt = "", onLoadSize }) {
  const { src, crop, layers } = normImg(v);
  const [nat, setNat] = React.useState(null);
  if (!src) return null;

  // Natural size drives the SVG viewBox; falls back to a sane ratio.
  const NW = nat?.w || 1600, NH = nat?.h || 900;
  const c = crop || { x: 0, y: 0, w: 1, h: 1 };
  const W = NW * c.w, H = NH * c.h;

  const wrapStyle = { position: "relative", overflow: "hidden", ...style };
  const inner = {
    position: "relative",
    width: `${100 / c.w}%`,
    marginLeft: `${(-c.x * 100) / c.w}%`,
    marginTop: `${(-c.y * 100) / c.h}%`,
    paddingBottom: 0,
  };

  return (
    <span className={className} style={wrapStyle}>
      <span style={{ display: "block", position: "relative", width: "100%", paddingTop: `${(H / W) * 100}%` }}>
        <span style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <img
            src={src} alt={alt}
            onLoad={(e) => {
              const s = { w: e.target.naturalWidth || 1600, h: e.target.naturalHeight || 900 };
              setNat(s); onLoadSize?.(s);
            }}
            style={{
              position: "absolute", display: "block", border: 0,
              width: `${100 / c.w}%`, height: `${100 / c.h}%`,
              left: `${(-c.x * 100) / c.w}%`, top: `${(-c.y * 100) / c.h}%`,
              objectFit: "cover",
            }}
          />
          {layers.length > 0 && (
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
                 style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
              <defs>
                {layers.filter((l) => l.type === "route" || l.type === "arrow").map((l) => (
                  <marker key={l.id} id={`ah-${l.id}`} viewBox="0 0 10 10" refX="7" refY="5"
                          markerWidth="2.6" markerHeight="2.6" orient="auto-start-reverse" markerUnits="strokeWidth">
                    <path d="M0 0 L10 5 L0 10 z" fill={l.color || "#ecc25a"} />
                  </marker>
                ))}
              </defs>
              {layers.map((l) => <Layer key={l.id} l={l} W={W} H={H} />)}
            </svg>
          )}
        </span>
      </span>
    </span>
  );
}
