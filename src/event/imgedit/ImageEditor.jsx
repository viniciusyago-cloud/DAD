import React, { useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "../../supabaseClient.js";
import { normImg, ANIMS, useNatural } from "./Pic.jsx";
import { PALETTE } from "../blocks.js";
import AssetPicker from "../AssetPicker.jsx";
import { loadImage, autoColor, pickColor, removeBackground, trimTransparent, canvasToBlob } from "./bgremove.js";

/* ============================================================
   IMAGE / TACTICAL ANNOTATION EDITOR
   Crop + pins + routes + arrows + shapes + text + icons,
   each with an optional animation. Saved as vector data.
   ============================================================ */

const TOOLS = [
  { k: "select", l: "Selecionar", d: "M4 3l14 7-6 2-2 6z" },
  { k: "pin",    l: "Pino",       d: "M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z M12 10h.01" },
  { k: "route",  l: "Rota",       d: "M3 20l6-7 4 4 8-11" },
  { k: "arrow",  l: "Seta",       d: "M4 20L20 4M20 4h-7M20 4v7" },
  { k: "rect",   l: "Retângulo",  d: "M4 5h16v14H4z" },
  { k: "circle", l: "Círculo",    d: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z" },
  { k: "text",   l: "Texto",      d: "M5 6h14M12 6v13" },
  { k: "icon",   l: "Ícone",      d: "M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.7 6.7 19.6l1.1-6L3.4 9.4l6-.8z" },
  { k: "crop",   l: "Cortar",     d: "M6 2v14a2 2 0 0 0 2 2h14M2 6h14a2 2 0 0 1 2 2v14" },
  { k: "bg",     l: "Remover fundo", d: "M4 4h7v7H4zM13 13h7v7h-7zM13 4h7v7h-7zM4 13h7v7H4z" },
];


const uid = () => `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export default function ImageEditor({ value, onSave, onClose }) {
  const base = normImg(value);
  const [src, setSrc] = useState(base.src);
  const [crop, setCrop] = useState(base.crop);
  const [layers, setLayers] = useState(base.layers.map((l) => ({ ...l })));
  const [tool, setTool] = useState("select");
  const [sel, setSel] = useState(null);
  const [color, setColor] = useState("#ecc25a");
  const [draft, setDraft] = useState(null);      // in-progress shape / route
  const [cropDraft, setCropDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [iconPick, setIconPick] = useState(false);
  const [bg, setBg] = useState(null);   // { color, tolerance, mode, feather, trim, preview, busy, err }
  const stage = useRef(null);
  const drag = useRef(null);
  const fileRef = useRef(null);

  const nat = useNatural(src) || { w: 1600, h: 900 };
  const cur = layers.find((l) => l.id === sel) || null;
  const c = crop || { x: 0, y: 0, w: 1, h: 1 };

  /* --- pointer helpers: normalised 0..1 in the CROPPED space --- */
  const pt = (e) => {
    const r = stage.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    return [Math.min(1, Math.max(0, px)), Math.min(1, Math.max(0, py))];
  };

  const add = (l) => { const n = { id: uid(), ...l }; setLayers((p) => [...p, n]); setSel(n.id); return n; };
  const patch = (id, p) => setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const del = (id) => { setLayers((ls) => ls.filter((l) => l.id !== id)); if (sel === id) setSel(null); };
  const moveZ = (id, d) => setLayers((ls) => {
    const i = ls.findIndex((l) => l.id === id), j = i + d;
    if (j < 0 || j >= ls.length) return ls;
    const c2 = [...ls]; [c2[i], c2[j]] = [c2[j], c2[i]]; return c2;
  });

  /* --- stage interaction --- */
  const onDown = (e) => {
    if (!src) return;
    const [x, y] = pt(e);
    if (tool === "bg") { bgPrepare([x, y]); return; }
    if (tool === "crop") { setCropDraft({ x, y, x2: x, y2: y }); return; }
    if (tool === "select") {
      const hit = hitTest(x, y, layers);
      setSel(hit ? hit.id : null);
      if (hit) drag.current = { id: hit.id, ox: x, oy: y, snap: { ...hit } };
      return;
    }
    if (tool === "pin") {
      const n = layers.filter((l) => l.type === "pin").length + 1;
      add({ type: "pin", x, y, label: String(n), color, size: 16, anim: "" });
      setTool("select"); return;
    }
    if (tool === "text") {
      const t = prompt("Texto:");
      if (t) add({ type: "text", x, y, text: t, color, size: 26, anim: "" });
      setTool("select"); return;
    }
    if (tool === "icon") { setIconPick({ x, y }); return; }
    if (tool === "route") {
      setDraft((d) => d && d.type === "route"
        ? { ...d, pts: [...d.pts, [x, y]] }
        : { type: "route", pts: [[x, y]], color, width: 7, arrow: true, anim: "" });
      return;
    }
    // drag-created shapes
    setDraft({ type: tool, x, y, x2: x, y2: y, color, width: 5, fill: tool !== "arrow", anim: "" });
  };

  const onMove = (e) => {
    if (cropDraft) { const [x, y] = pt(e); setCropDraft((d) => ({ ...d, x2: x, y2: y })); return; }
    if (drag.current) {
      const [x, y] = pt(e);
      const { id, ox, oy, snap } = drag.current;
      const dx = x - ox, dy = y - oy;
      if (snap.type === "route") patch(id, { pts: snap.pts.map(([px, py]) => [px + dx, py + dy]) });
      else if (snap.x2 != null) patch(id, { x: snap.x + dx, y: snap.y + dy, x2: snap.x2 + dx, y2: snap.y2 + dy });
      else patch(id, { x: snap.x + dx, y: snap.y + dy });
      return;
    }
    if (draft && draft.type !== "route") { const [x, y] = pt(e); setDraft((d) => ({ ...d, x2: x, y2: y })); }
  };

  const onUp = () => {
    drag.current = null;
    if (draft && draft.type !== "route") {
      const big = Math.abs(draft.x2 - draft.x) > 0.01 || Math.abs(draft.y2 - draft.y) > 0.01;
      if (big) add(draft);
      setDraft(null); setTool("select");
    }
  };

  const finishRoute = () => {
    if (draft?.type === "route" && draft.pts.length > 1) add(draft);
    setDraft(null); setTool("select");
  };

  const applyCrop = () => {
    if (!cropDraft) return;
    const x = Math.min(cropDraft.x, cropDraft.x2), y = Math.min(cropDraft.y, cropDraft.y2);
    const w = Math.abs(cropDraft.x2 - cropDraft.x), h = Math.abs(cropDraft.y2 - cropDraft.y);
    if (w < 0.03 || h < 0.03) { setCropDraft(null); return; }
    // compose with any existing crop, and re-map layer coords into the new space
    const nx = c.x + x * c.w, ny = c.y + y * c.h, nw = c.w * w, nh = c.h * h;
    setLayers((ls) => ls.map((l) => {
      const mx = (v) => (v - x) / w, my = (v) => (v - y) / h;
      if (l.type === "route") return { ...l, pts: l.pts.map(([px, py]) => [mx(px), my(py)]) };
      if (l.x2 != null) return { ...l, x: mx(l.x), y: my(l.y), x2: mx(l.x2), y2: my(l.y2) };
      return { ...l, x: mx(l.x), y: my(l.y) };
    }));
    setCrop({ x: nx, y: ny, w: nw, h: nh });
    setCropDraft(null); setTool("select");
  };

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("event-assets").upload(path, file, { cacheControl: "31536000" });
      if (error) throw error;
      setSrc(supabase.storage.from("event-assets").getPublicUrl(path).data.publicUrl);
      setCrop(null);
    } catch (e) { console.error(e); alert("Falha no upload."); }
    finally { setBusy(false); }
  };

  /* ---------- background removal ---------- */
  const bgSrcData = useRef(null);   // untouched pixels of the current image

  const bgPrepare = useCallback(async (pickAt) => {
    setBg((b) => ({ ...(b || {}), busy: true, err: "" }));
    try {
      const img = await loadImage(src);
      const cv = document.createElement("canvas");
      cv.width = img.naturalWidth; cv.height = img.naturalHeight;
      const ctx = cv.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, cv.width, cv.height);   // throws if cross-origin blocked
      bgSrcData.current = data;
      const color = pickAt
        ? pickColor(ctx, Math.min(cv.width - 1, Math.round(pickAt[0] * cv.width)),
                         Math.min(cv.height - 1, Math.round(pickAt[1] * cv.height)))
        : autoColor(ctx, cv.width, cv.height);
      setBg({ color, tolerance: 30, mode: "edge", feather: 6, trim: false, busy: false, err: "" });
    } catch (e) {
      console.error(e);
      setBg({ err: "Não consegui ler os pixels desta imagem (bloqueio de origem). Envie-a do aparelho e tente de novo.", busy: false });
    }
  }, [src]);

  const bgPreviewUrl = useMemo(() => {
    if (!bg || bg.err || !bgSrcData.current || !bg.color) return null;
    const d = bgSrcData.current;
    const out = removeBackground(d, bg);
    const cv = document.createElement("canvas");
    cv.width = d.width; cv.height = d.height;
    cv.getContext("2d").putImageData(out, 0, 0);
    return cv.toDataURL("image/png");
  }, [bg]);

  const bgApply = async () => {
    if (!bg || !bgSrcData.current) return;
    setBusy(true);
    try {
      const d = bgSrcData.current;
      let cv = document.createElement("canvas");
      cv.width = d.width; cv.height = d.height;
      cv.getContext("2d").putImageData(removeBackground(d, bg), 0, 0);
      if (bg.trim) cv = trimTransparent(cv);
      const blob = await canvasToBlob(cv);
      const path = `cut/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}.png`;
      const { error } = await supabase.storage.from("event-assets")
        .upload(path, blob, { cacheControl: "31536000", contentType: "image/png" });
      if (error) throw error;
      setSrc(supabase.storage.from("event-assets").getPublicUrl(path).data.publicUrl);
      if (bg.trim) setCrop(null);
      setBg(null); setTool("select");
    } catch (e) { console.error(e); alert("Falha ao aplicar. Tente de novo."); }
    finally { setBusy(false); }
  };

  const save = () => onSave(layers.length || crop ? { src, crop, layers } : src);

  const W = nat.w * c.w, H = nat.h * c.h;
  const X = (x) => x * W, Y = (y) => y * H;

  return (
    <div className="ie-modal" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ie">
        <header className="ie-bar">
          <b>Editor de imagem</b>
          <div className="ie-bar-r">
            <button className="ie-btn" onClick={onClose}>Cancelar</button>
            <button className="ie-btn ie-btn-gold" onClick={save}>Aplicar</button>
          </div>
        </header>

        {!src ? (
          <div className="ie-drop">
            <p>Envie uma imagem ou GIF para começar.</p>
            <button className="ie-btn ie-btn-gold" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? "Enviando…" : "Escolher arquivo"}
            </button>
            <input className="ie-url" placeholder="…ou cole uma URL" onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.value.trim()) { setSrc(e.target.value.trim()); setCrop(null); }
            }} />
          </div>
        ) : (
          <div className="ie-body">
            {/* toolbar */}
            <div className="ie-tools">
              {TOOLS.map((t) => (
                <button key={t.k} className={`ie-tool${tool === t.k ? " on" : ""}`} title={t.l}
                        onClick={() => {
                          setTool(t.k); setDraft(null); setCropDraft(null);
                          if (t.k === "bg") bgPrepare(null); else setBg(null);
                        }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                       strokeLinecap="round" strokeLinejoin="round"><path d={t.d} /></svg>
                </button>
              ))}
              <span className="ie-tool-div" />
              <div className="ie-colors">
                {PALETTE.slice(0, 7).map((p) => (
                  <button key={p.v} className={`ie-col${color === p.v ? " on" : ""}`}
                          style={{ background: p.v }} onClick={() => { setColor(p.v); if (cur) patch(cur.id, { color: p.v }); }} />
                ))}
              </div>
              {draft?.type === "route" && (
                <button className="ie-btn ie-btn-gold ie-finish" onClick={finishRoute}>
                  Concluir rota ({draft.pts.length})
                </button>
              )}
              {cropDraft && <button className="ie-btn ie-btn-gold ie-finish" onClick={applyCrop}>Aplicar corte</button>}
              {crop && !cropDraft && <button className="ie-btn ie-finish" onClick={() => setCrop(null)}>Remover corte</button>}
            </div>

            {/* stage */}
            <div className="ie-stagewrap">
              <div className="ie-stage" ref={stage} onPointerDown={onDown} onPointerMove={onMove}
                   onPointerUp={onUp} onPointerLeave={onUp}
                   style={{ aspectRatio: `${W} / ${H}`, cursor: tool === "select" ? "default" : "crosshair" }}>
                <img src={bgPreviewUrl || src} alt="" draggable="false"
                     style={{ position: "absolute", width: `${100 / c.w}%`, height: `${100 / c.h}%`,
                              left: `${(-c.x * 100) / c.w}%`, top: `${(-c.y * 100) / c.h}%`, objectFit: "cover" }} />
                <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="ie-svg">
                  <defs>
                    {[...layers, draft].filter((l) => l && (l.type === "route" || l.type === "arrow")).map((l, i) => (
                      <marker key={l.id || `d${i}`} id={`eh-${l.id || "draft"}`} viewBox="0 0 10 10" refX="7" refY="5"
                              markerWidth="2.6" markerHeight="2.6" orient="auto-start-reverse" markerUnits="strokeWidth">
                        <path d="M0 0 L10 5 L0 10 z" fill={l.color} />
                      </marker>
                    ))}
                  </defs>
                  {layers.map((l) => <Shape key={l.id} l={l} X={X} Y={Y} selected={l.id === sel} />)}
                  {draft && <Shape l={{ ...draft, id: "draft" }} X={X} Y={Y} ghost />}
                  {cropDraft && (
                    <rect x={X(Math.min(cropDraft.x, cropDraft.x2))} y={Y(Math.min(cropDraft.y, cropDraft.y2))}
                          width={Math.abs(X(cropDraft.x2) - X(cropDraft.x))} height={Math.abs(Y(cropDraft.y2) - Y(cropDraft.y))}
                          fill="#ecc25a22" stroke="#ecc25a" strokeWidth={W / 260} strokeDasharray={`${W / 90} ${W / 130}`} />
                  )}
                </svg>
              </div>
              <div className="ie-hint">
                {tool === "bg" ? "Clique numa área do fundo para escolher a cor · ajuste ao lado"
                  : tool === "route" ? "Clique para adicionar pontos · depois “Concluir rota”"
                  : tool === "crop" ? "Arraste a área que quer manter"
                  : tool === "select" ? "Clique para selecionar · arraste para mover"
                  : "Clique ou arraste sobre a imagem"}
              </div>
            </div>

            {/* inspector */}
            <aside className="ie-side">
              {bg && (
                <div className="ie-bgpanel">
                  <div className="ie-side-h">Remover fundo</div>
                  {bg.err ? <div className="f-err">{bg.err}</div> : bg.busy ? (
                    <div className="ie-none">Lendo a imagem…</div>
                  ) : (
                    <>
                      <div className="ie-f">
                        <span>Cor removida — clique na imagem para trocar</span>
                        <div className="ie-bgcolor">
                          <i style={{ background: `rgb(${bg.color.join(",")})` }} />
                          <code>rgb({bg.color.join(", ")})</code>
                        </div>
                      </div>
                      <div className="ie-f">
                        <span>Alcance {bg.tolerance}</span>
                        <input type="range" min="1" max="100" value={bg.tolerance}
                               onChange={(e) => setBg({ ...bg, tolerance: +e.target.value })} />
                      </div>
                      <div className="ie-f">
                        <span>Suavizar borda {bg.feather}</span>
                        <input type="range" min="0" max="20" value={bg.feather}
                               onChange={(e) => setBg({ ...bg, feather: +e.target.value })} />
                      </div>
                      <div className="ie-f">
                        <span>Modo</span>
                        <select value={bg.mode} onChange={(e) => setBg({ ...bg, mode: e.target.value })}>
                          <option value="edge">Só o fundo em volta</option>
                          <option value="all">Essa cor em toda a imagem</option>
                        </select>
                      </div>
                      <label className="ie-f ie-f-row">
                        <span>Cortar sobras vazias</span>
                        <input type="checkbox" checked={!!bg.trim}
                               onChange={(e) => setBg({ ...bg, trim: e.target.checked })} />
                      </label>
                      <div className="ie-bgacts">
                        <button className="ie-btn" onClick={() => { setBg(null); setTool("select"); }}>Cancelar</button>
                        <button className="ie-btn ie-btn-gold" onClick={bgApply} disabled={busy}>
                          {busy ? "Aplicando…" : "Aplicar (PNG)"}
                        </button>
                      </div>
                      <div className="ie-bghint">Vira um PNG transparente. GIF animado perde a animação.</div>
                    </>
                  )}
                </div>
              )}

              <div className="ie-side-h">Camadas</div>
              <div className="ie-layers">
                {layers.length === 0 && <div className="ie-none">Nenhuma anotação ainda.</div>}
                {layers.map((l, i) => (
                  <div key={l.id} className={`ie-layer${l.id === sel ? " on" : ""}`} onClick={() => setSel(l.id)}>
                    <i style={{ background: l.color }} />
                    <span>{labelOf(l)}</span>
                    <button onClick={(e) => { e.stopPropagation(); moveZ(l.id, -1); }} disabled={i === 0}>↑</button>
                    <button onClick={(e) => { e.stopPropagation(); moveZ(l.id, 1); }} disabled={i === layers.length - 1}>↓</button>
                    <button className="x" onClick={(e) => { e.stopPropagation(); del(l.id); }}>×</button>
                  </div>
                ))}
              </div>

              {cur && (
                <div className="ie-props">
                  <div className="ie-side-h">Propriedades</div>
                  {cur.type === "text" && (
                    <label className="ie-f"><span>Texto</span>
                      <input value={cur.text || ""} onChange={(e) => patch(cur.id, { text: e.target.value })} /></label>
                  )}
                  {cur.type === "pin" && (
                    <label className="ie-f"><span>Rótulo</span>
                      <input value={cur.label || ""} onChange={(e) => patch(cur.id, { label: e.target.value })} /></label>
                  )}
                  {(cur.type === "pin" || cur.type === "text" || cur.type === "icon") && (
                    <label className="ie-f"><span>Tamanho</span>
                      <input type="range" min="8" max="90" value={cur.size || 20}
                             onChange={(e) => patch(cur.id, { size: +e.target.value })} /></label>
                  )}
                  {(cur.type === "route" || cur.type === "arrow" || cur.type === "rect" || cur.type === "circle") && (
                    <label className="ie-f"><span>Espessura</span>
                      <input type="range" min="2" max="24" value={cur.width || 6}
                             onChange={(e) => patch(cur.id, { width: +e.target.value })} /></label>
                  )}
                  {(cur.type === "rect" || cur.type === "circle") && (
                    <label className="ie-f ie-f-row"><span>Preenchido</span>
                      <input type="checkbox" checked={!!cur.fill} onChange={(e) => patch(cur.id, { fill: e.target.checked })} /></label>
                  )}
                  {cur.type === "route" && (
                    <label className="ie-f ie-f-row"><span>Ponta de seta</span>
                      <input type="checkbox" checked={cur.arrow !== false} onChange={(e) => patch(cur.id, { arrow: e.target.checked })} /></label>
                  )}
                  <label className="ie-f"><span>Animação</span>
                    <select value={cur.anim || ""} onChange={(e) => patch(cur.id, { anim: e.target.value })}>
                      {ANIMS.map((a) => <option key={a.v} value={a.v}>{a.l}</option>)}
                    </select></label>
                  {cur.anim && (
                    <>
                      <label className="ie-f"><span>Duração {cur.dur || 2}s</span>
                        <input type="range" min="0.4" max="8" step="0.2" value={cur.dur || 2}
                               onChange={(e) => patch(cur.id, { dur: +e.target.value })} /></label>
                      <label className="ie-f"><span>Atraso {cur.delay || 0}s</span>
                        <input type="range" min="0" max="6" step="0.2" value={cur.delay || 0}
                               onChange={(e) => patch(cur.id, { delay: +e.target.value })} /></label>
                    </>
                  )}
                  <div className="ie-swatches">
                    {PALETTE.map((p) => (
                      <button key={p.v} className={`ie-col${cur.color === p.v ? " on" : ""}`}
                              style={{ background: p.v }} onClick={() => patch(cur.id, { color: p.v })} />
                    ))}
                  </div>
                </div>
              )}

              <button className="ie-btn ie-replace" onClick={() => fileRef.current?.click()} disabled={busy}>
                {busy ? "Enviando…" : "Trocar imagem"}
              </button>
            </aside>
          </div>
        )}

        {iconPick && (
          <AssetPicker title="Escolha um ícone"
            onClose={() => { setIconPick(false); setTool("select"); }}
            onPick={(url) => {
              add({ type: "icon", x: iconPick.x, y: iconPick.y, src: url, size: 44, anim: "" });
              setIconPick(false); setTool("select");
            }} />
        )}

        <input ref={fileRef} type="file" accept="image/*" hidden
               onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
    </div>
  );
}

const labelOf = (l) => ({
  pin: `Pino ${l.label || ""}`, route: `Rota (${(l.pts || []).length} pts)`, arrow: "Seta",
  rect: "Retângulo", circle: "Círculo", text: `Texto “${(l.text || "").slice(0, 14)}”`, icon: "Ícone",
}[l.type] || l.type);

function hitTest(x, y, layers) {
  const near = (a, b, t = 0.035) => Math.abs(a - b) < t;
  for (let i = layers.length - 1; i >= 0; i--) {
    const l = layers[i];
    if (l.type === "route") { if ((l.pts || []).some(([px, py]) => near(px, x) && near(py, y))) return l; }
    else if (l.x2 != null) {
      const x0 = Math.min(l.x, l.x2), x1 = Math.max(l.x, l.x2);
      const y0 = Math.min(l.y, l.y2), y1 = Math.max(l.y, l.y2);
      if (x >= x0 - 0.02 && x <= x1 + 0.02 && y >= y0 - 0.02 && y <= y1 + 0.02) return l;
    } else if (near(l.x, x, 0.05) && near(l.y, y, 0.05)) return l;
  }
  return null;
}

/* editor-side shape drawing (no animation, plus selection halo) */
function Shape({ l, X, Y, selected, ghost }) {
  const c = l.color || "#ecc25a";
  const o = ghost ? 0.75 : 1;
  const halo = selected ? { filter: "drop-shadow(0 0 6px #ecc25a)" } : undefined;
  switch (l.type) {
    case "pin": {
      const r = l.size || 16;
      return (
        <g transform={`translate(${X(l.x)} ${Y(l.y)})`} opacity={o} style={halo}>
          <circle r={r + 4} fill="#0d1218" opacity="0.55" />
          <circle r={r} fill={c} stroke="#0d1218" strokeWidth="2.5" />
          {l.label && <text y={r * 0.36} textAnchor="middle" fill="#0d1218"
                            style={{ font: `800 ${r * 1.05}px system-ui, sans-serif` }}>{l.label}</text>}
        </g>
      );
    }
    case "icon":
      return <image href={l.src} x={X(l.x) - (l.size || 32) / 2} y={Y(l.y) - (l.size || 32) / 2}
                    width={l.size || 32} height={l.size || 32} opacity={o} style={halo} />;
    case "text": {
      const s = l.size || 26;
      return <text x={X(l.x)} y={Y(l.y)} fill={c} stroke="#0d1218" strokeWidth={s * 0.22} paintOrder="stroke"
                   opacity={o} style={{ font: `800 ${s}px system-ui, sans-serif`, ...halo }}>{l.text}</text>;
    }
    case "route": {
      const pts = (l.pts || []).map(([x, y]) => `${X(x)},${Y(y)}`).join(" ");
      if (!pts) return null;
      return (
        <g opacity={o} style={halo}>
          <polyline points={pts} fill="none" stroke="#0d1218" strokeWidth={(l.width || 6) + 5} strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          <polyline points={pts} fill="none" stroke={c} strokeWidth={l.width || 6} strokeLinecap="round" strokeLinejoin="round"
                    markerEnd={l.arrow === false ? undefined : `url(#eh-${l.id})`} />
          {(l.pts || []).map(([x, y], i) => <circle key={i} cx={X(x)} cy={Y(y)} r={(l.width || 6) * 0.9} fill={c} stroke="#0d1218" strokeWidth="2" />)}
        </g>
      );
    }
    case "arrow":
      return (
        <g opacity={o} style={halo}>
          <line x1={X(l.x)} y1={Y(l.y)} x2={X(l.x2)} y2={Y(l.y2)} stroke="#0d1218" strokeWidth={(l.width || 6) + 5} strokeLinecap="round" opacity="0.5" />
          <line x1={X(l.x)} y1={Y(l.y)} x2={X(l.x2)} y2={Y(l.y2)} stroke={c} strokeWidth={l.width || 6} strokeLinecap="round" markerEnd={`url(#eh-${l.id})`} />
        </g>
      );
    case "rect":
      return <rect x={X(Math.min(l.x, l.x2))} y={Y(Math.min(l.y, l.y2))}
                   width={Math.abs(X(l.x2) - X(l.x))} height={Math.abs(Y(l.y2) - Y(l.y))} rx={l.radius ?? 4}
                   fill={l.fill ? c : "none"} fillOpacity={l.fill ? 0.22 : 0} stroke={c} strokeWidth={l.width || 5}
                   opacity={o} style={halo} />;
    case "circle": {
      const rx = Math.abs(X(l.x2) - X(l.x)) / 2, ry = Math.abs(Y(l.y2) - Y(l.y)) / 2;
      return <ellipse cx={X(l.x) + (X(l.x2) - X(l.x)) / 2} cy={Y(l.y) + (Y(l.y2) - Y(l.y)) / 2} rx={rx} ry={ry}
                      fill={l.fill ? c : "none"} fillOpacity={l.fill ? 0.22 : 0} stroke={c} strokeWidth={l.width || 5}
                      opacity={o} style={halo} />;
    }
    default: return null;
  }
}
