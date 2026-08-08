import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { supabase } from "../../supabaseClient.js";
import { normImg, ANIMS, useNatural } from "./Pic.jsx";
import { PALETTE } from "../blocks.js";
import AssetPicker from "../AssetPicker.jsx";
import { loadImage, autoColor, pickColor, removeBackground, trimTransparent, canvasToBlob } from "./bgremove.js";

/* ============================================================
   IMAGE / TACTICAL ANNOTATION EDITOR
   Crop, background removal, and layers you can place, move,
   resize and animate. Saved as vector data, never baked pixels.

   Confirm actions ("Aplicar corte", "Concluir rota") live in
   their own bar, NOT in the horizontally scrolling toolbar —
   there, `margin-left:auto` parked them past the visible area
   and the crop tool looked broken because you could not reach
   the button that commits it.
   ============================================================ */

const TOOLS = [
  { k: "select",    l: "Selecionar",    d: "M4 3l14 7-6 2-2 6z" },
  { k: "pan",       l: "Mover a imagem (mão)", d: "M8 13V5.5a1.5 1.5 0 0 1 3 0V12m0-1V4.5a1.5 1.5 0 0 1 3 0V12m0-1.5a1.5 1.5 0 0 1 3 0V12m0-.5a1.5 1.5 0 0 1 3 0V16a5 5 0 0 1-5 5h-2a6 6 0 0 1-6-6v-3a1.5 1.5 0 0 1 3 0" },
  { k: "pin",       l: "Pino",          d: "M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z M12 10h.01" },
  { k: "text",      l: "Texto",         d: "M5 6h14M12 6v13" },
  { k: "icon",      l: "Ícone da biblioteca", d: "M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.7 6.7 19.6l1.1-6L3.4 9.4l6-.8z" },
  { k: "route",     l: "Rota",          d: "M3 20l6-7 4 4 8-11" },
  { k: "arrow",     l: "Seta",          d: "M4 20L20 4M20 4h-7M20 4v7" },
  { k: "line",      l: "Linha",         d: "M4 20 20 4" },
  { k: "rect",      l: "Retângulo",     d: "M4 5h16v14H4z" },
  { k: "circle",    l: "Círculo",       d: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z" },
  { k: "highlight", l: "Marca-texto",   d: "M3 17h18M6 13l6-9 6 9z" },
  { k: "blur",      l: "Borrar",        d: "M5 5h4v4H5zM15 5h4v4h-4zM10 10h4v4h-4zM5 15h4v4H5zM15 15h4v4h-4z" },
  { k: "crop",      l: "Cortar",        d: "M6 2v14a2 2 0 0 0 2 2h14M2 6h14a2 2 0 0 1 2 2v14" },
  { k: "bg",        l: "Remover fundo", d: "M4 4h7v7H4zM13 13h7v7h-7zM13 4h7v7h-7zM4 13h7v7H4z" },
];

/* tools committed by dragging a rectangle */
const DRAG_TOOLS = new Set(["arrow", "line", "rect", "circle", "highlight", "blur"]);

const uid = () => `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/* Sizes are a fraction of the image's short side, so an annotation that
   looks right on a banner is not a monster on a 64px icon. */
const DEF = { pin: 0.055, text: 0.09, icon: 0.14, stroke: 0.02, hl: 0.07 };

/** Palette shortcuts plus a free colour — the nine presets are a starting
    point, not the limit of what you can draw with. */
function Swatches({ value, onChange, few }) {
  const list = few ? PALETTE.slice(0, 7) : PALETTE;
  return (
    <div className="ie-swatches">
      {list.map((p) => (
        <button key={p.v} type="button" title={p.name}
                className={`ie-col${value === p.v ? " on" : ""}`}
                style={{ background: p.v }} onClick={() => onChange(p.v)} />
      ))}
      <label className={`ie-col ie-col-any${list.some((p) => p.v === value) ? "" : " on"}`}
             title="Cor personalizada" style={{ background: value || "#ecc25a" }}>
        <input type="color" value={value || "#ecc25a"} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}

const LABELS = {
  pin: "Pino", route: "Rota", arrow: "Seta", line: "Linha", rect: "Retângulo",
  circle: "Círculo", highlight: "Marca-texto", blur: "Borrão", text: "Texto", icon: "Ícone",
};

export default function ImageEditor({ value, onSave, onClose }) {
  const base = normImg(value);
  const [src, setSrc] = useState(base.src);
  const [crop, setCrop] = useState(base.crop);
  const [layers, setLayers] = useState(base.layers.map((l) => ({ ...l })));
  const [tool, setTool] = useState("select");
  const [sel, setSel] = useState(null);
  const [color, setColor] = useState("#ecc25a");
  const [draft, setDraft] = useState(null);
  const [cropDraft, setCropDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [iconAt, setIconAt] = useState(null);
  const [bg, setBg] = useState(null);
  const [textEdit, setTextEdit] = useState(null);

  const [zoom, setZoom] = useState(1);

  const stage = useRef(null);
  const wrap = useRef(null);
  const drag = useRef(null);
  const cropping = useRef(false);
  const fileRef = useRef(null);
  const past = useRef([]);
  const future = useRef([]);

  /* Until the real size is known any stage aspect is a guess, and a guess
     plus object-fit crops the user's image. Wait instead of guessing. */
  const natReady = useNatural(src);
  const nat = natReady || { w: 1600, h: 900 };
  const c = crop || { x: 0, y: 0, w: 1, h: 1 };
  const W = nat.w * c.w, H = nat.h * c.h;
  const S = Math.min(W, H);
  const X = (x) => x * W, Y = (y) => y * H;
  const cur = layers.find((l) => l.id === sel) || null;

  /* ---------------- history ---------------- */
  const snap = useCallback(() => {
    past.current.push(JSON.stringify({ layers, crop }));
    if (past.current.length > 60) past.current.shift();
    future.current = [];
  }, [layers, crop]);

  const apply = (raw) => { const s = JSON.parse(raw); setLayers(s.layers); setCrop(s.crop); setSel(null); };
  const undo = () => {
    if (!past.current.length) return;
    future.current.push(JSON.stringify({ layers, crop }));
    apply(past.current.pop());
  };
  const redo = () => {
    if (!future.current.length) return;
    past.current.push(JSON.stringify({ layers, crop }));
    apply(future.current.pop());
  };

  /* ---------------- layers ---------------- */
  const add = (l) => { snap(); const n = { id: uid(), ...l }; setLayers((p) => [...p, n]); setSel(n.id); return n; };
  const patch = (id, p) => setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const del = (id) => { snap(); setLayers((ls) => ls.filter((l) => l.id !== id)); if (sel === id) setSel(null); };
  const dup = (id) => {
    const l = layers.find((x) => x.id === id); if (!l) return;
    snap();
    const n = { ...JSON.parse(JSON.stringify(l)), id: uid() };
    const d = 0.04;
    if (n.pts) n.pts = n.pts.map(([a, b]) => [a + d, b + d]);
    else { n.x += d; n.y += d; if (n.x2 != null) { n.x2 += d; n.y2 += d; } }
    setLayers((ls) => [...ls, n]); setSel(n.id);
  };
  const moveZ = (id, dir) => {
    snap();
    setLayers((ls) => {
      const i = ls.findIndex((l) => l.id === id), j = i + dir;
      if (i < 0 || j < 0 || j >= ls.length) return ls;
      const copy = [...ls]; [copy[i], copy[j]] = [copy[j], copy[i]]; return copy;
    });
  };

  /* -------- keyboard: nudge, delete, undo/redo -------- */
  useEffect(() => {
    const onKey = (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if (!cur) return;
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); del(cur.id); return; }
      const step = e.shiftKey ? 0.02 : 0.004;
      const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (!d) return;
      e.preventDefault();
      if (cur.pts) patch(cur.id, { pts: cur.pts.map(([x, y]) => [x + d[0], y + d[1]]) });
      else if (cur.x2 != null) patch(cur.id, { x: cur.x + d[0], y: cur.y + d[1], x2: cur.x2 + d[0], y2: cur.y2 + d[1] });
      else patch(cur.id, { x: cur.x + d[0], y: cur.y + d[1] });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cur, layers, crop]);

  /* ---------------- pointer ---------------- */
  const pt = (e) => {
    const r = stage.current.getBoundingClientRect();
    return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
            Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))];
  };

  const onDown = (e) => {
    if (!src) return;
    const [x, y] = pt(e);

    if (tool === "pan" || e.button === 1) {
      const w = wrap.current;
      drag.current = { mode: "pan", sx: e.clientX, sy: e.clientY, sl: w.scrollLeft, st: w.scrollTop };
      return;
    }
    if (tool === "bg") { bgPrepare([x, y]); return; }
    if (tool === "crop") {
      /* Starting a fresh rectangle only when there isn't one waiting to be
         applied — otherwise a click meant to confirm wipes the selection. */
      if (cropDraft) return;
      cropping.current = true;
      setCropDraft({ x, y, x2: x, y2: y });
      return;
    }

    if (tool === "select") {
      const h = e.target?.dataset?.handle;
      if (h && cur) { snap(); drag.current = { mode: "size", id: cur.id, h, from: { ...cur } }; return; }
      const hit = hitTest(x, y, layers);
      setSel(hit ? hit.id : null);
      if (hit) { snap(); drag.current = { mode: "move", id: hit.id, ox: x, oy: y, from: { ...hit } }; }
      return;
    }
    if (tool === "pin") {
      const n = layers.filter((l) => l.type === "pin").length + 1;
      add({ type: "pin", x, y, label: String(n), color, size: DEF.pin, anim: "" });
      setTool("select"); return;
    }
    if (tool === "text") {
      setTextEdit({ x, y, text: "", color, size: DEF.text, weight: 800, font: "sans",
                    align: "start", rot: 0, box: false, outline: true, anim: "" });
      return;
    }
    if (tool === "icon") { setIconAt({ x, y }); return; }
    if (tool === "route") {
      setDraft((d) => (d && d.type === "route"
        ? { ...d, pts: [...d.pts, [x, y]] }
        : { type: "route", pts: [[x, y]], color, width: DEF.stroke, arrow: true, anim: "" }));
      return;
    }
    if (DRAG_TOOLS.has(tool)) {
      setDraft({
        type: tool, x, y, x2: x, y2: y, color, anim: "",
        width: tool === "highlight" ? DEF.hl : DEF.stroke,
        fill: tool === "rect" || tool === "circle" ? false : undefined,
        ...(tool === "blur" ? { amount: 8, round: true } : null),
      });
    }
  };

  const onMove = (e) => {
    /* Only while the button is actually down — the rectangle used to keep
       chasing the pointer after release, so it could never be finished. */
    if (cropping.current) { const [x, y] = pt(e); setCropDraft((d) => ({ ...d, x2: x, y2: y })); return; }
    const d = drag.current;
    if (d?.mode === "pan") {
      wrap.current.scrollLeft = d.sl - (e.clientX - d.sx);
      wrap.current.scrollTop  = d.st - (e.clientY - d.sy);
      return;
    }
    if (d) {
      const [x, y] = pt(e);
      const f = d.from;
      if (d.mode === "size") {
        if (f.x2 != null) {
          patch(d.id, d.h === "se" ? { x2: x, y2: y } : d.h === "nw" ? { x, y }
            : d.h === "ne" ? { x2: x, y } : { x, y2: y });
        } else {
          patch(d.id, { size: Math.max(0.02, Math.min(0.7, Math.hypot(x - f.x, y - f.y) * 1.7)) });
        }
        return;
      }
      const dx = x - d.ox, dy = y - d.oy;
      if (f.pts) patch(d.id, { pts: f.pts.map(([px, py]) => [px + dx, py + dy]) });
      else if (f.x2 != null) patch(d.id, { x: f.x + dx, y: f.y + dy, x2: f.x2 + dx, y2: f.y2 + dy });
      else patch(d.id, { x: f.x + dx, y: f.y + dy });
      return;
    }
    if (draft && draft.type !== "route") { const [x, y] = pt(e); setDraft((v) => ({ ...v, x2: x, y2: y })); }
  };

  const onUp = () => {
    drag.current = null;
    if (cropping.current) {
      cropping.current = false;
      /* A stray click leaves a rectangle too small to mean anything; drop it
         so the tool is ready for a real drag instead of looking stuck. */
      setCropDraft((d) => (d && (Math.abs(d.x2 - d.x) < 0.02 || Math.abs(d.y2 - d.y) < 0.02) ? null : d));
      return;
    }
    if (draft && draft.type !== "route") {
      const big = Math.abs(draft.x2 - draft.x) > 0.012 || Math.abs(draft.y2 - draft.y) > 0.012;
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
    snap();
    const mx = (v) => (v - x) / w, my = (v) => (v - y) / h;
    setLayers((ls) => ls.map((l) => {
      if (l.pts) return { ...l, pts: l.pts.map(([px, py]) => [mx(px), my(py)]) };
      if (l.x2 != null) return { ...l, x: mx(l.x), y: my(l.y), x2: mx(l.x2), y2: my(l.y2) };
      return { ...l, x: mx(l.x), y: my(l.y) };
    }));
    setCrop({ x: c.x + x * c.w, y: c.y + y * c.h, w: c.w * w, h: c.h * h });
    setCropDraft(null); setTool("select");
  };

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
      const path = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("event-assets")
        .upload(path, file, { cacheControl: "31536000", contentType: file.type || undefined });
      if (error) throw error;
      setSrc(supabase.storage.from("event-assets").getPublicUrl(path).data.publicUrl);
      setCrop(null);
    } catch (e) { console.error(e); alert("Falha no upload."); }
    finally { setBusy(false); }
  };

  /* ---------------- background removal ---------------- */
  const bgData = useRef(null);
  const bgPrepare = useCallback(async (pickAt) => {
    setBg((b) => ({ ...(b || {}), busy: true, err: "" }));
    try {
      const img = await loadImage(src);
      const cv = document.createElement("canvas");
      cv.width = img.naturalWidth; cv.height = img.naturalHeight;
      const ctx = cv.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      bgData.current = ctx.getImageData(0, 0, cv.width, cv.height);
      const col = pickAt
        ? pickColor(ctx, Math.min(cv.width - 1, Math.round(pickAt[0] * cv.width)),
                         Math.min(cv.height - 1, Math.round(pickAt[1] * cv.height)))
        : autoColor(ctx, cv.width, cv.height);
      setBg({ color: col, tolerance: 30, mode: "edge", feather: 6, trim: false, busy: false, err: "" });
    } catch (e) {
      console.error(e);
      setBg({ err: "Não consegui ler os pixels desta imagem (bloqueio de origem). Envie-a do aparelho e tente de novo.", busy: false });
    }
  }, [src]);

  const bgPreview = useMemo(() => {
    if (!bg || bg.err || bg.busy || !bgData.current || !bg.color) return null;
    const d = bgData.current;
    const cv = document.createElement("canvas");
    cv.width = d.width; cv.height = d.height;
    cv.getContext("2d").putImageData(removeBackground(d, bg), 0, 0);
    return cv.toDataURL("image/png");
  }, [bg]);

  const bgApply = async () => {
    if (!bg || !bgData.current) return;
    setBusy(true);
    try {
      const d = bgData.current;
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
    } catch (e) { console.error(e); alert("Falha ao aplicar."); }
    finally { setBusy(false); }
  };

  const save = () => onSave(layers.length || crop ? { src, crop, layers } : src);

  const hint = tool === "pan" ? "Arraste para percorrer a imagem · Ctrl+roda também dá zoom"
    : tool === "bg" ? "Clique numa área do fundo para escolher a cor"
    : tool === "crop" ? (cropDraft ? "Área marcada — “Aplicar corte” confirma, “Refazer seleção” recomeça"
                                   : "Arraste a área que quer manter, depois “Aplicar corte”")
    : tool === "route" ? "Clique para adicionar pontos, depois “Concluir rota”"
    : tool === "select" ? "Clique para selecionar · arraste para mover · setas ajustam · Delete apaga"
    : "Clique ou arraste sobre a imagem";

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
              <Swatches value={color} few
                        onChange={(v) => { setColor(v); if (cur) patch(cur.id, { color: v }); }} />
            </div>

            {/* Never inside .ie-tools — that bar scrolls and would hide these. */}
            <div className="ie-acts">
              <button className="ie-mini" onClick={undo} title="Desfazer (Ctrl+Z)">↺</button>
              <button className="ie-mini" onClick={redo} title="Refazer (Ctrl+Shift+Z)">↻</button>
              <span className="ie-zoom">
                <button className="ie-mini" onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}
                        disabled={zoom <= 1} title="Menos zoom">−</button>
                <button className="ie-zval" onClick={() => setZoom(1)} title="Voltar a 100%">{Math.round(zoom * 100)}%</button>
                <button className="ie-mini" onClick={() => setZoom((z) => Math.min(6, +(z + 0.25).toFixed(2)))}
                        disabled={zoom >= 6} title="Mais zoom">+</button>
              </span>
              <span className="ie-hint">{hint}</span>
              {draft?.type === "route" && (
                <button className="ie-btn ie-btn-gold" onClick={finishRoute}>Concluir rota ({draft.pts.length})</button>
              )}
              {cropDraft && <button className="ie-btn" onClick={() => setCropDraft(null)}>Refazer seleção</button>}
              {cropDraft && <button className="ie-btn ie-btn-gold" onClick={applyCrop}>Aplicar corte</button>}
              {crop && !cropDraft && (
                <button className="ie-btn" onClick={() => { snap(); setCrop(null); }}>Remover corte</button>
              )}
            </div>

            {!natReady ? (
              <div className="ie-stagewrap"><div className="ie-loading">Carregando a imagem…</div></div>
            ) : (
            <div className="ie-stagewrap" ref={wrap}
                 onWheel={(e) => {
                   if (!(e.ctrlKey || e.metaKey)) return;      /* plain wheel keeps scrolling */
                   e.preventDefault();
                   setZoom((z) => Math.min(6, Math.max(1, +(z - Math.sign(e.deltaY) * 0.25).toFixed(2))));
                 }}>
              <div className="ie-stage" ref={stage} onPointerDown={onDown} onPointerMove={onMove}
                   onPointerUp={onUp} onPointerLeave={onUp}
                   style={{ aspectRatio: `${W} / ${H}`, width: `${zoom * 100}%`,
                            maxWidth: zoom > 1 ? "none" : undefined,
                            cursor: tool === "pan" ? "grab" : tool === "select" ? "default" : "crosshair" }}>
                {/* `fill`, not `cover`: the box above is already the image
                    scaled to the crop, so filling it is exact and can never
                    shave off an edge. */}
                <img src={bgPreview || src} alt="" draggable="false"
                     style={{ position: "absolute", width: `${100 / c.w}%`, height: `${100 / c.h}%`,
                              left: `${(-c.x * 100) / c.w}%`, top: `${(-c.y * 100) / c.h}%`, objectFit: "fill" }} />

                {layers.filter((l) => l.type === "blur").map((l) => (
                  <span key={l.id} className="ie-blur" style={{
                    left: `${Math.min(l.x, l.x2) * 100}%`, top: `${Math.min(l.y, l.y2) * 100}%`,
                    width: `${Math.abs(l.x2 - l.x) * 100}%`, height: `${Math.abs(l.y2 - l.y) * 100}%`,
                    backdropFilter: `blur(${l.amount || 8}px)`,
                    WebkitBackdropFilter: `blur(${l.amount || 8}px)`,
                    borderRadius: l.round ? 8 : 0,
                  }} />
                ))}

                <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="ie-svg">
                  <defs>
                    {[...layers, draft].filter((l) => l && (l.type === "route" || l.type === "arrow")).map((l, i) => (
                      <marker key={l.id || `d${i}`} id={`eh-${l.id || "draft"}`} viewBox="0 0 10 10" refX="7" refY="5"
                              markerWidth="2.6" markerHeight="2.6" orient="auto-start-reverse" markerUnits="strokeWidth">
                        <path d="M0 0 L10 5 L0 10 z" fill={l.color} />
                      </marker>
                    ))}
                  </defs>
                  {layers.filter((l) => l.type !== "blur").map((l) => (
                    <Shape key={l.id} l={l} X={X} Y={Y} S={S} selected={l.id === sel} />
                  ))}
                  {draft && draft.type !== "blur" && <Shape l={{ ...draft, id: "draft" }} X={X} Y={Y} S={S} ghost />}
                  {(draft?.type === "blur" || cropDraft) && (() => {
                    const d = cropDraft || draft;
                    return <rect x={X(Math.min(d.x, d.x2))} y={Y(Math.min(d.y, d.y2))}
                                 width={Math.abs(X(d.x2) - X(d.x))} height={Math.abs(Y(d.y2) - Y(d.y))}
                                 fill="#ecc25a22" stroke="#ecc25a" strokeWidth={S * 0.006}
                                 strokeDasharray={`${S * 0.02} ${S * 0.015}`} />;
                  })()}
                  {cur && <Handles l={cur} X={X} Y={Y} S={S} />}
                </svg>
              </div>
            </div>
            )}

            <aside className="ie-side">
              {bg && <BgPanel bg={bg} setBg={setBg} onApply={bgApply}
                              onCancel={() => { setBg(null); setTool("select"); }} busy={busy} />}

              <div className="ie-side-h">Camadas</div>
              <div className="ie-layers">
                {layers.length === 0 && <div className="ie-none">Nenhuma anotação ainda.</div>}
                {layers.map((l, i) => (
                  <div className={`ie-layer${l.id === sel ? " on" : ""}`} key={l.id} onClick={() => setSel(l.id)}>
                    <i style={{ background: l.color || "#8aa" }} />
                    <span>{l.type === "text" ? `Texto “${(l.text || "").slice(0, 12)}”`
                      : l.type === "pin" ? `Pino ${l.label || ""}`
                      : l.type === "route" ? `Rota (${(l.pts || []).length})` : LABELS[l.type] || l.type}</span>
                    <button onClick={(e) => { e.stopPropagation(); moveZ(l.id, -1); }} disabled={i === 0} title="Para trás">↑</button>
                    <button onClick={(e) => { e.stopPropagation(); moveZ(l.id, 1); }} disabled={i === layers.length - 1} title="Para frente">↓</button>
                    <button onClick={(e) => { e.stopPropagation(); dup(l.id); }} title="Duplicar">⧉</button>
                    <button className="x" onClick={(e) => { e.stopPropagation(); del(l.id); }} title="Apagar">×</button>
                  </div>
                ))}
              </div>

              {cur && <Props l={cur} patch={patch} onEditText={() => setTextEdit({ ...cur, editing: true })} />}

              <button className="ie-btn ie-replace" onClick={() => fileRef.current?.click()} disabled={busy}>
                {busy ? "Enviando…" : "Trocar imagem"}
              </button>
            </aside>
          </div>
        )}

        {iconAt && (
          <AssetPicker title="Escolha um ícone"
            onClose={() => { setIconAt(null); setTool("select"); }}
            onPick={(url) => {
              add({ type: "icon", x: iconAt.x, y: iconAt.y, src: url, size: DEF.icon, anim: "" });
              setIconAt(null); setTool("select");
            }} />
        )}

        {textEdit && (
          <TextDialog t={textEdit}
            onCancel={() => { setTextEdit(null); setTool("select"); }}
            onSave={(t) => {
              if (t.editing) { snap(); patch(t.id, t); }
              else if (t.text.trim()) add({ ...t, type: "text" });
              setTextEdit(null); setTool("select");
            }} />
        )}

        <input ref={fileRef} type="file" accept="image/*" hidden
               onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
    </div>
  );
}

/* ---------------- text dialog (replaces window.prompt) ---------------- */
function TextDialog({ t, onSave, onCancel }) {
  const [v, setV] = useState(t);
  const set = (p) => setV((s) => ({ ...s, ...p }));
  return (
    <div className="ie-modal ie-sub" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="ie-textdlg">
        <b>Texto</b>
        <textarea className="ie-ta" rows={3} autoFocus placeholder="Escreva aqui… (Enter quebra linha)"
                  value={v.text} onChange={(e) => set({ text: e.target.value })} />
        <div className="ie-td-grid">
          <label className="ie-f"><span>Fonte</span>
            <select value={v.font || "sans"} onChange={(e) => set({ font: e.target.value })}>
              <option value="sans">Sem serifa</option>
              <option value="display">Serifada</option>
              <option value="mono">Monoespaçada</option>
            </select></label>
          <label className="ie-f"><span>Peso</span>
            <select value={v.weight || 800} onChange={(e) => set({ weight: +e.target.value })}>
              <option value={400}>Normal</option><option value={700}>Negrito</option><option value={800}>Extra</option>
            </select></label>
          <label className="ie-f"><span>Alinhamento</span>
            <select value={v.align || "start"} onChange={(e) => set({ align: e.target.value })}>
              <option value="start">Esquerda</option><option value="middle">Centro</option><option value="end">Direita</option>
            </select></label>
        </div>
        <label className="ie-f"><span>Tamanho — {Math.round((v.size ?? DEF.text) * 100)}</span>
          <input type="range" min="2" max="45" value={Math.round((v.size ?? DEF.text) * 100)}
                 onChange={(e) => set({ size: +e.target.value / 100 })} /></label>
        <label className="ie-f"><span>Rotação — {v.rot || 0}°</span>
          <input type="range" min="-90" max="90" value={v.rot || 0}
                 onChange={(e) => set({ rot: +e.target.value })} /></label>
        <div className="ie-td-togs">
          <label><input type="checkbox" checked={v.outline !== false}
                        onChange={(e) => set({ outline: e.target.checked })} /> Contorno escuro</label>
          <label><input type="checkbox" checked={!!v.box}
                        onChange={(e) => set({ box: e.target.checked })} /> Caixa de fundo</label>
        </div>
        <div className="ie-f"><span>Cor</span>
          <Swatches value={v.color} onChange={(c) => set({ color: c })} />
        </div>
        <div className="ie-bgacts">
          <button className="ie-btn" onClick={onCancel}>Cancelar</button>
          <button className="ie-btn ie-btn-gold" onClick={() => onSave(v)} disabled={!v.text.trim()}>
            {t.editing ? "Salvar" : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- per-layer properties ---------------- */
function Props({ l, patch, onEditText }) {
  const stroky = ["route", "arrow", "line", "rect", "circle", "highlight"].includes(l.type);
  return (
    <div className="ie-props">
      <div className="ie-side-h">Propriedades</div>

      {l.type === "text" && (
        <button className="ie-btn ie-full" onClick={onEditText}>Editar texto e formatação</button>
      )}
      {l.type === "pin" && (
        <label className="ie-f"><span>Rótulo</span>
          <input value={l.label || ""} onChange={(e) => patch(l.id, { label: e.target.value })} /></label>
      )}
      {["pin", "icon", "text"].includes(l.type) && (
        <label className="ie-f"><span>Tamanho — {Math.round((l.size ?? DEF.text) * 100)}</span>
          <input type="range" min="2" max="45" value={Math.round((l.size ?? DEF.text) * 100)}
                 onChange={(e) => patch(l.id, { size: +e.target.value / 100 })} /></label>
      )}
      {stroky && (
        <label className="ie-f"><span>Espessura — {Math.round((l.width ?? DEF.stroke) * 100)}</span>
          <input type="range" min="1" max="22" value={Math.round((l.width ?? DEF.stroke) * 100)}
                 onChange={(e) => patch(l.id, { width: +e.target.value / 100 })} /></label>
      )}
      {l.type === "blur" && (
        <>
          <label className="ie-f"><span>Intensidade — {l.amount || 8}</span>
            <input type="range" min="2" max="30" value={l.amount || 8}
                   onChange={(e) => patch(l.id, { amount: +e.target.value })} /></label>
          <label className="ie-f ie-row"><span>Cantos arredondados</span>
            <input type="checkbox" checked={!!l.round}
                   onChange={(e) => patch(l.id, { round: e.target.checked })} /></label>
        </>
      )}
      {(l.type === "rect" || l.type === "circle") && (
        <label className="ie-f ie-row"><span>Preenchido</span>
          <input type="checkbox" checked={!!l.fill}
                 onChange={(e) => patch(l.id, { fill: e.target.checked })} /></label>
      )}
      {l.type === "route" && (
        <label className="ie-f ie-row"><span>Ponta de seta</span>
          <input type="checkbox" checked={l.arrow !== false}
                 onChange={(e) => patch(l.id, { arrow: e.target.checked })} /></label>
      )}
      {l.type !== "blur" && (
        <label className="ie-f"><span>Opacidade — {Math.round((l.opacity ?? 1) * 100)}%</span>
          <input type="range" min="10" max="100" value={Math.round((l.opacity ?? 1) * 100)}
                 onChange={(e) => patch(l.id, { opacity: +e.target.value / 100 })} /></label>
      )}

      <label className="ie-f"><span>Animação</span>
        <select value={l.anim || ""} onChange={(e) => patch(l.id, { anim: e.target.value })}>
          {ANIMS.map((a) => <option key={a.v} value={a.v}>{a.l}</option>)}
        </select></label>
      {l.anim && (
        <>
          <label className="ie-f"><span>Duração — {l.dur || 2}s</span>
            <input type="range" min="0.4" max="8" step="0.2" value={l.dur || 2}
                   onChange={(e) => patch(l.id, { dur: +e.target.value })} /></label>
          <label className="ie-f"><span>Atraso — {l.delay || 0}s</span>
            <input type="range" min="0" max="6" step="0.2" value={l.delay || 0}
                   onChange={(e) => patch(l.id, { delay: +e.target.value })} /></label>
        </>
      )}
      {l.type !== "blur" && l.type !== "icon" && (
        <Swatches value={l.color} onChange={(v) => patch(l.id, { color: v })} />
      )}
    </div>
  );
}

function BgPanel({ bg, setBg, onApply, onCancel, busy }) {
  return (
    <div className="ie-bgpanel">
      <div className="ie-side-h">Remover fundo</div>
      {bg.err ? <div className="ie-err">{bg.err}</div> : bg.busy ? <div className="ie-none">Lendo a imagem…</div> : (
        <>
          <div className="ie-f"><span>Cor removida — clique na imagem para trocar</span>
            <div className="ie-bgcolor">
              <i style={{ background: `rgb(${bg.color.join(",")})` }} />
              <code>rgb({bg.color.join(", ")})</code>
            </div>
          </div>
          <label className="ie-f"><span>Alcance — {bg.tolerance}</span>
            <input type="range" min="1" max="100" value={bg.tolerance}
                   onChange={(e) => setBg({ ...bg, tolerance: +e.target.value })} /></label>
          <label className="ie-f"><span>Suavizar borda — {bg.feather}</span>
            <input type="range" min="0" max="20" value={bg.feather}
                   onChange={(e) => setBg({ ...bg, feather: +e.target.value })} /></label>
          <label className="ie-f"><span>Modo</span>
            <select value={bg.mode} onChange={(e) => setBg({ ...bg, mode: e.target.value })}>
              <option value="edge">Só o fundo em volta</option>
              <option value="all">Essa cor em toda a imagem</option>
            </select></label>
          <label className="ie-f ie-row"><span>Cortar sobras vazias</span>
            <input type="checkbox" checked={!!bg.trim}
                   onChange={(e) => setBg({ ...bg, trim: e.target.checked })} /></label>
          <div className="ie-bgacts">
            <button className="ie-btn" onClick={onCancel}>Cancelar</button>
            <button className="ie-btn ie-btn-gold" onClick={onApply} disabled={busy}>
              {busy ? "Aplicando…" : "Aplicar (PNG)"}
            </button>
          </div>
          <div className="ie-bghint">Vira um PNG transparente. GIF animado perde a animação.</div>
        </>
      )}
    </div>
  );
}

/* ---------------- resize handles ---------------- */
function Handles({ l, X, Y, S }) {
  const r = S * 0.016;
  /* A route is moved by its points, not by corners; everything else with an
     x2 (blur included — it is a rectangle even though it paints in HTML)
     gets four corner handles, and point layers get one to scale by. */
  const pts = l.pts ? []
    : l.x2 != null
      ? [["nw", l.x, l.y], ["ne", l.x2, l.y], ["sw", l.x, l.y2], ["se", l.x2, l.y2]]
      : [["se", (l.x || 0) + (l.size ?? DEF.text) * 0.75, (l.y || 0) + (l.size ?? DEF.text) * 0.75]];
  return (
    <g>
      {pts.map(([k, x, y]) => (
        <circle key={k} data-handle={k} cx={X(x)} cy={Y(y)} r={r} className="ie-handle"
                fill="#ecc25a" stroke="#0d1218" strokeWidth={r * 0.35} />
      ))}
    </g>
  );
}

function hitTest(x, y, layers) {
  const near = (a, b, t) => Math.abs(a - b) < t;
  for (let i = layers.length - 1; i >= 0; i--) {
    const l = layers[i];
    if (l.pts) { if (l.pts.some(([px, py]) => near(px, x, 0.035) && near(py, y, 0.035))) return l; }
    else if (l.x2 != null) {
      const x0 = Math.min(l.x, l.x2) - 0.02, x1 = Math.max(l.x, l.x2) + 0.02;
      const y0 = Math.min(l.y, l.y2) - 0.02, y1 = Math.max(l.y, l.y2) + 0.02;
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return l;
    } else if (near(l.x, x, 0.07) && near(l.y, y, 0.07)) return l;
  }
  return null;
}

/* Editor-side drawing. Mirrors Pic.jsx, plus a halo on the selected layer. */
function Shape({ l, X, Y, S, selected, ghost }) {
  const col = l.color || "#ecc25a";
  const o = (ghost ? 0.75 : 1) * (l.opacity ?? 1);
  const halo = selected ? { filter: "drop-shadow(0 0 6px #ecc25a)" } : undefined;
  /* values > 1 are legacy absolute pixels; <= 1 are fractions of the short side */
  const abs = (v, def) => { const n = v == null || v === "" ? def : Number(v); return n > 1 ? n : n * S; };

  switch (l.type) {
    case "pin": {
      const r = abs(l.size, DEF.pin);
      return (
        <g transform={`translate(${X(l.x)} ${Y(l.y)})`} opacity={o} style={halo}>
          <circle r={r + S * 0.012} fill="#0d1218" opacity="0.55" />
          <circle r={r} fill={col} stroke="#0d1218" strokeWidth={r * 0.16} />
          {l.label && <text y={r * 0.36} textAnchor="middle" fill="#0d1218"
                            style={{ font: `800 ${r * 1.05}px system-ui, sans-serif` }}>{l.label}</text>}
        </g>
      );
    }
    case "icon": {
      const s = abs(l.size, DEF.icon);
      return <image href={l.src} x={X(l.x) - s / 2} y={Y(l.y) - s / 2} width={s} height={s}
                    opacity={o} style={halo} preserveAspectRatio="xMidYMid meet" />;
    }
    case "text": {
      const s = abs(l.size, DEF.text);
      const fam = l.font === "display" ? "Georgia, 'Times New Roman', serif"
        : l.font === "mono" ? "ui-monospace, Menlo, monospace" : "system-ui, sans-serif";
      const lines = String(l.text || "").split("\n");
      const wide = Math.max(...lines.map((t) => t.length), 1);
      return (
        <g opacity={o} style={halo}
           transform={l.rot ? `rotate(${l.rot} ${X(l.x)} ${Y(l.y)})` : undefined}>
          {l.box && (
            <rect x={X(l.x) - s * 0.35} y={Y(l.y) - s * 0.95}
                  width={wide * s * 0.56 + s * 0.7} height={lines.length * s * 1.25 + s * 0.3}
                  rx={s * 0.25} fill="#0d1218" fillOpacity={0.72} />
          )}
          <text x={X(l.x)} y={Y(l.y)} textAnchor={l.align || "start"} fill={col}
                stroke={l.outline === false ? "none" : "#0d1218"}
                strokeWidth={l.outline === false ? 0 : s * 0.22} paintOrder="stroke"
                style={{ font: `${l.weight || 800} ${s}px ${fam}` }}>
            {lines.map((t, i) => <tspan key={i} x={X(l.x)} dy={i === 0 ? 0 : s * 1.25}>{t}</tspan>)}
          </text>
        </g>
      );
    }
    case "route": {
      const pts = (l.pts || []).map(([x, y]) => `${X(x)},${Y(y)}`).join(" ");
      if (!pts) return null;
      const w = abs(l.width, DEF.stroke);
      return (
        <g opacity={o} style={halo}>
          <polyline points={pts} fill="none" stroke="#0d1218" strokeWidth={w + S * 0.012}
                    strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          <polyline points={pts} fill="none" stroke={col} strokeWidth={w}
                    strokeLinecap="round" strokeLinejoin="round"
                    markerEnd={l.arrow === false ? undefined : `url(#eh-${l.id})`} />
          {(l.pts || []).map(([x, y], i) => (
            <circle key={i} cx={X(x)} cy={Y(y)} r={w * 0.9} fill={col} stroke="#0d1218" strokeWidth={w * 0.3} />
          ))}
        </g>
      );
    }
    case "arrow": case "line": {
      const w = abs(l.width, DEF.stroke);
      return (
        <g opacity={o} style={halo}>
          <line x1={X(l.x)} y1={Y(l.y)} x2={X(l.x2)} y2={Y(l.y2)} stroke="#0d1218"
                strokeWidth={w + S * 0.012} strokeLinecap="round" opacity="0.5" />
          <line x1={X(l.x)} y1={Y(l.y)} x2={X(l.x2)} y2={Y(l.y2)} stroke={col} strokeWidth={w}
                strokeLinecap="round" markerEnd={l.type === "arrow" ? `url(#eh-${l.id})` : undefined} />
        </g>
      );
    }
    case "highlight":
      return <line x1={X(l.x)} y1={Y(l.y)} x2={X(l.x2)} y2={Y(l.y2)} stroke={col}
                   strokeWidth={abs(l.width, DEF.hl)} strokeLinecap="round"
                   opacity={(l.opacity ?? 0.42) * (ghost ? 0.7 : 1)} style={halo} />;
    case "rect":
      return <rect x={X(Math.min(l.x, l.x2))} y={Y(Math.min(l.y, l.y2))}
                   width={Math.abs(X(l.x2) - X(l.x))} height={Math.abs(Y(l.y2) - Y(l.y))} rx={S * 0.012}
                   fill={l.fill ? col : "none"} fillOpacity={l.fill ? 0.22 : 0} stroke={col}
                   strokeWidth={abs(l.width, DEF.stroke)} opacity={o} style={halo} />;
    case "circle":
      return <ellipse cx={X(l.x) + (X(l.x2) - X(l.x)) / 2} cy={Y(l.y) + (Y(l.y2) - Y(l.y)) / 2}
                      rx={Math.abs(X(l.x2) - X(l.x)) / 2} ry={Math.abs(Y(l.y2) - Y(l.y)) / 2}
                      fill={l.fill ? col : "none"} fillOpacity={l.fill ? 0.22 : 0} stroke={col}
                      strokeWidth={abs(l.width, DEF.stroke)} opacity={o} style={halo} />;
    default: return null;
  }
}
