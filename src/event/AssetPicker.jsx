import React, { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../supabaseClient.js";

/* ============================================================
   SITE-WIDE ASSET LIBRARY
   Upload an icon once, reuse it in any image field: cards,
   KPIs, squads, section titles, the image editor…
   Add · rename · re-categorise · delete, all from here.
   ============================================================ */

export const CATEGORIES = [
  { v: "icon", l: "Ícones" },
  { v: "troop", l: "Tropas" },
  { v: "hero", l: "Heróis" },
  { v: "building", l: "Prédios" },
  { v: "other", l: "Outros" },
];

export function useAssets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("assets").select("*").order("category").order("sort").order("id");
    if (!error) setAssets(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel("assets-lib")
      .on("postgres_changes", { event: "*", schema: "public", table: "assets" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  return { assets, loading, reload: load };
}

export default function AssetPicker({ onPick, onClose, title = "Biblioteca de ícones" }) {
  const { assets, loading } = useAssets();
  const [cat, setCat] = useState("icon");
  const [busy, setBusy] = useState(false);
  const [manage, setManage] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);

  const shown = assets.filter((a) => a.category === cat);

  const addFiles = async (files) => {
    if (!files?.length) return;
    setBusy(true); setErr("");
    try {
      for (const file of files) {
        const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
        const path = `lib/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error } = await supabase.storage.from("event-assets")
          .upload(path, file, { cacheControl: "31536000", contentType: file.type || undefined });
        if (error) throw error;
        const url = supabase.storage.from("event-assets").getPublicUrl(path).data.publicUrl;
        const name = file.name.replace(/\.[^.]+$/, "").slice(0, 40) || "Novo ícone";
        const { error: e2 } = await supabase.from("assets").insert({ name, url, category: cat, sort: 999 });
        if (e2) throw e2;
      }
    } catch (e) { console.error(e); setErr("Falha ao enviar. Tente de novo."); }
    finally { setBusy(false); }
  };

  const addUrl = async () => {
    const url = prompt("Cole a URL da imagem:");
    if (!url?.trim()) return;
    const name = prompt("Nome do ícone:", "Novo ícone") || "Novo ícone";
    await supabase.from("assets").insert({ name: name.trim(), url: url.trim(), category: cat, sort: 999 });
  };

  const rename = async (a) => {
    const name = prompt("Nome do ícone:", a.name);
    if (name == null) return;
    await supabase.from("assets").update({ name: name.trim() || a.name }).eq("id", a.id);
  };
  const recat = async (a) => {
    const list = CATEGORIES.map((c, i) => `${i + 1}. ${c.l}`).join("\n");
    const pick = prompt(`Mover para qual categoria?\n${list}`, "1");
    const c = CATEGORIES[Number(pick) - 1];
    if (c) await supabase.from("assets").update({ category: c.v }).eq("id", a.id);
  };
  const remove = async (a) => {
    if (!confirm(`Remover "${a.name}" da biblioteca?`)) return;
    await supabase.from("assets").delete().eq("id", a.id);
  };

  return (
    <div className="ie-modal ie-sub" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="al">
        <header className="al-h">
          <b>{title}</b>
          <div className="al-h-r">
            <button className={`ie-btn${manage ? " ie-btn-gold" : ""}`} onClick={() => setManage((m) => !m)}>
              {manage ? "Concluir" : "Gerenciar"}
            </button>
            <button className="ie-btn" onClick={onClose}>Fechar</button>
          </div>
        </header>

        <div className="al-cats">
          {CATEGORIES.map((c) => (
            <button key={c.v} className={`al-cat${cat === c.v ? " on" : ""}`} onClick={() => setCat(c.v)}>
              {c.l} <span>{assets.filter((a) => a.category === c.v).length}</span>
            </button>
          ))}
        </div>

        <div className="al-body">
          {loading && <div className="ie-none">Carregando…</div>}
          {!loading && shown.length === 0 && <div className="ie-none">Nenhum ícone nesta categoria ainda.</div>}
          <div className="al-grid">
            {shown.map((a) => (
              <div className={`al-item${manage ? " managing" : ""}`} key={a.id}>
                <button className="al-pick" onClick={() => !manage && onPick(a.url)} title={a.name}>
                  <img src={a.url} alt={a.name} loading="lazy" />
                </button>
                <span className="al-name">{a.name}</span>
                {manage && (
                  <div className="al-acts">
                    <button onClick={() => rename(a)} title="Renomear">✎</button>
                    <button onClick={() => recat(a)} title="Mudar categoria">⇄</button>
                    <button className="x" onClick={() => remove(a)} title="Excluir">×</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {err && <div className="f-err">{err}</div>}
        </div>

        <footer className="al-f">
          <button className="ie-btn ie-btn-gold" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? "Enviando…" : "Enviar do aparelho"}
          </button>
          <button className="ie-btn" onClick={addUrl}>Adicionar por URL</button>
          <span className="al-hint">Vai para “{CATEGORIES.find((c) => c.v === cat)?.l}”</span>
        </footer>

        <input ref={fileRef} type="file" accept="image/*" multiple hidden
               onChange={(e) => { addFiles([...e.target.files]); e.target.value = ""; }} />
      </div>
    </div>
  );
}
