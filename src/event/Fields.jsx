import React, { useRef, useState } from "react";
import { supabase } from "../supabaseClient.js";
import { PALETTE } from "./blocks.js";
import ImageEditor from "./imgedit/ImageEditor.jsx";
import { imgSrc, hasAnno } from "./imgedit/Pic.jsx";
import AssetPicker from "./AssetPicker.jsx";

/* ============================================================
   SCHEMA-DRIVEN FIELD EDITORS
   Renders the right control for each field type declared in
   the block registry.
   ============================================================ */

/* ---------- image: upload from device (drag / paste / pick) or URL ---------- */
function ImageField({ value, onChange }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [edit, setEdit] = useState(false);
  const [drag, setDrag] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [lib, setLib] = useState(false);

  const upload = async (file) => {
    if (!file) return;
    if (!/^(image|video)\//.test(file.type)) { setErr("Escolha uma imagem, GIF ou vídeo."); return; }
    if (file.size > 25 * 1024 * 1024) { setErr("Arquivo muito grande (máx. 25 MB)."); return; }
    setBusy(true); setErr("");
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
      const path = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("event-assets").upload(path, file, {
        cacheControl: "31536000", upsert: false, contentType: file.type || undefined,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("event-assets").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (e) {
      console.error(e);
      setErr("Falha no upload. Tente de novo ou cole uma URL.");
    } finally { setBusy(false); }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) upload(f);
  };
  const onPaste = (e) => {
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"));
    if (item) { e.preventDefault(); upload(item.getAsFile()); }
  };

  const url = imgSrc(value);

  return (
    <div className="f-img">
      <div
        className={`f-drop${drag ? " over" : ""}${url ? " has" : ""}`}
        tabIndex={0}
        onClick={() => !busy && fileRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileRef.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onPaste={onPaste}
        role="button"
        aria-label="Enviar imagem do aparelho"
      >
        {url ? (
          <>
            <img className="f-drop-img" src={url} alt="" />
            {hasAnno(value) && <span className="f-img-badge">anotada</span>}
            <span className="f-drop-over">Trocar imagem</span>
          </>
        ) : (
          <div className="f-drop-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4M12 4 7 9M12 4l5 5" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
            </svg>
            <b>{busy ? "Enviando…" : "Enviar do aparelho"}</b>
            <span>toque para escolher · arraste · ou cole (Ctrl+V)</span>
          </div>
        )}
        {busy && <span className="f-drop-busy">Enviando…</span>}
      </div>

      <div className="f-img-btns">
        <button type="button" className="f-btn f-btn-edit" onClick={() => setEdit(true)}>
          {hasAnno(value) ? "Editar anotações" : "Editar imagem"}
        </button>
        <button type="button" className="f-btn f-btn-lib" onClick={() => setLib(true)}>Biblioteca</button>
        <button type="button" className="f-btn" onClick={() => setShowUrl((v) => !v)}>
          {showUrl ? "Ocultar URL" : "URL"}
        </button>
        {url && <button type="button" className="f-btn f-btn-x" onClick={() => onChange("")}>Limpar</button>}
      </div>

      {showUrl && (
        <input className="f-in" style={{ marginTop: 7 }} placeholder="https://… (imagem, GIF ou vídeo)"
               value={typeof value === "string" ? value : url}
               onChange={(e) => onChange(e.target.value)} />
      )}

      {err && <div className="f-err">{err}</div>}
      <input ref={fileRef} type="file" accept="image/*,video/mp4" hidden
             onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
      {edit && (
        <ImageEditor value={value} onClose={() => setEdit(false)}
                     onSave={(v) => { onChange(v); setEdit(false); }} />
      )}
      {lib && <AssetPicker onClose={() => setLib(false)}
                           onPick={(url) => { onChange(url); setLib(false); }} />}
    </div>
  );
}

/* ---------- color: palette + custom hex ---------- */
function ColorField({ value, onChange }) {
  return (
    <div className="f-color">
      <div className="f-swatches">
        {PALETTE.map((p) => (
          <button type="button" key={p.v} title={p.name}
            className={`f-sw${value === p.v ? " on" : ""}`}
            style={{ background: p.v }} onClick={() => onChange(p.v)} />
        ))}
      </div>
      <div className="f-color-hex">
        <input type="color" value={value || "#ecc25a"} onChange={(e) => onChange(e.target.value)} />
        <input className="f-in" value={value || ""} placeholder="#ecc25a"
               onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

/* ---------- datetime: local input, stored as ISO (UTC-safe) ---------- */
function DateTimeField({ value, onChange }) {
  const toLocal = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const utcLabel = value && !Number.isNaN(new Date(value).getTime())
    ? new Date(value).toUTCString().replace("GMT", "UTC") : "";
  return (
    <div className="f-dt">
      <input className="f-in" type="datetime-local" value={toLocal(value)}
             onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : "")} />
      {utcLabel && <div className="f-hint">Em UTC: {utcLabel}</div>}
    </div>
  );
}

/* ---------- list: repeating group of sub-fields ---------- */
function ListField({ field, value, onChange }) {
  const items = value || [];
  const [open, setOpen] = useState(0);

  const set = (i, patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const add = () => {
    const blank = {};
    field.item.forEach((f) => { blank[f.key] = f.type === "toggle" ? false : ""; });
    onChange([...items, blank]);
    setOpen(items.length);
  };
  const del = (i) => onChange(items.filter((_, j) => j !== i));
  const dup = (i) => { const c = [...items]; c.splice(i + 1, 0, structuredClone(items[i])); onChange(c); };
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const c = [...items];
    [c[i], c[j]] = [c[j], c[i]];
    onChange(c);
    setOpen(j);
  };

  return (
    <div className="f-list">
      {items.map((it, i) => (
        <div className={`f-item${open === i ? " open" : ""}`} key={i}>
          <div className="f-item-h" onClick={() => setOpen(open === i ? -1 : i)}>
            <span className="f-item-n">{i + 1}</span>
            <span className="f-item-t">{it[field.titleKey] || `Item ${i + 1}`}</span>
            <span className="f-item-acts" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Subir">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} title="Descer">↓</button>
              <button type="button" onClick={() => dup(i)} title="Duplicar">⧉</button>
              <button type="button" className="x" onClick={() => del(i)} title="Remover">×</button>
            </span>
          </div>
          {open === i && (
            <div className="f-item-b">
              {field.item.map((f) => (
                <Field key={f.key} field={f} value={it[f.key]} onChange={(v) => set(i, { [f.key]: v })} />
              ))}
            </div>
          )}
        </div>
      ))}
      <button type="button" className="f-add" onClick={add}>+ {field.addLabel || "Adicionar"}</button>
    </div>
  );
}

/* ---------- dispatcher ---------- */
export default function Field({ field, value, onChange }) {
  if (field.type === "heading") return <div className="f-sec">{field.label}</div>;
  const label = field.label && <label className="f-lbl">{field.label}</label>;

  switch (field.type) {
    case "textarea":
    case "richtext":
      return (
        <div className="f">{label}
          <textarea className="f-in f-ta" rows={field.type === "richtext" ? 5 : 3}
            value={value || ""} onChange={(e) => onChange(e.target.value)} />
          {field.type === "richtext" && <div className="f-hint">**negrito** · *itálico* · [link](url) · - lista</div>}
        </div>
      );

    case "number":
      return (
        <div className="f">{label}
          <input className="f-in" type="number" min={field.min} max={field.max}
            value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
      );

    case "select":
      return (
        <div className="f">{label}
          <select className="f-in f-sel" value={value ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              const opt = field.options.find((o) => String(o.v) === raw);
              onChange(opt ? opt.v : raw);
            }}>
            {field.options.map((o) => <option key={String(o.v)} value={String(o.v)}>{o.l}</option>)}
          </select>
        </div>
      );

    case "toggle":
      return (
        <div className="f f-row">
          <label className="f-lbl">{field.label}</label>
          <button type="button" className={`f-tog${value ? " on" : ""}`} onClick={() => onChange(!value)}>
            <span />
          </button>
        </div>
      );

    case "color":
      return <div className="f">{label}<ColorField value={value} onChange={onChange} /></div>;

    case "image":
      return <div className="f">{label}<ImageField value={value} onChange={onChange} /></div>;

    case "datetime":
      return <div className="f">{label}<DateTimeField value={value} onChange={onChange} /></div>;

    case "list":
      return <div className="f">{label}<ListField field={field} value={value} onChange={onChange} /></div>;

    default:
      return (
        <div className="f">{label}
          <input className="f-in" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
  }
}
