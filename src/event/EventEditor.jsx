import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabaseClient.js";
import { BLOCKS, GROUPS, STYLE_FIELDS, newBlock, DEFAULT_THEME } from "./blocks.js";
import BlockView from "./BlockView.jsx";
import Field from "./Fields.jsx";

/* ============================================================
   EVENT PAGE BUILDER — /evento/editar
   Doc shape: { theme, header: [blocks], tabs: [{id,label,blocks}] }
   "header" holds what sits above the tab menu (hero, countdown).
   ============================================================ */

const SLUG = "tri-alliance";
const uid = () => `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function normalize(doc) {
  const d = doc && typeof doc === "object" ? doc : {};
  return {
    theme: { ...DEFAULT_THEME, ...(d.theme || {}) },
    header: Array.isArray(d.header) ? d.header : (Array.isArray(d.blocks) ? d.blocks : []),
    tabs: Array.isArray(d.tabs) && d.tabs.length ? d.tabs : [{ id: uid(), label: "Visão geral", blocks: [] }],
  };
}

export default function EventEditor() {
  const [doc, setDoc] = useState(null);
  const [pageId, setPageId] = useState(null);
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("header");     // "header" | tab id
  const [sel, setSel] = useState(null);
  const [tab, setTab] = useState("content");
  const [picker, setPicker] = useState(false);
  const [insertAt, setInsertAt] = useState(null);
  const [tabMenu, setTabMenu] = useState(null);
  const [status, setStatus] = useState("loading");
  const [err, setErr] = useState("");
  const history = useRef([]);
  const timer = useRef(null);
  const skip = useRef(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from("event_pages").select("*").eq("slug", SLUG).maybeSingle();
        if (error) throw error;
        if (data) { setPageId(data.id); setTitle(data.title || ""); setDoc(normalize(data.doc)); }
        else {
          const fresh = normalize(null);
          const { data: made, error: e2 } = await supabase.from("event_pages")
            .insert({ slug: SLUG, title: "Tri-Alliance Clash", doc: fresh }).select().single();
          if (e2) throw e2;
          setPageId(made.id); setTitle(made.title); setDoc(fresh);
        }
        setStatus("saved");
      } catch (e) { console.error(e); setErr("Não consegui carregar. A migration v4 foi aplicada?"); setStatus("error"); }
    })();
  }, []);

  const save = useCallback(async (d, t) => {
    if (!pageId) return;
    setStatus("saving");
    try {
      const { error } = await supabase.from("event_pages").update({ doc: d, title: t }).eq("id", pageId);
      if (error) throw error;
      setStatus("saved");
    } catch (e) { console.error(e); setStatus("error"); setErr("Falha ao salvar."); }
  }, [pageId]);

  useEffect(() => {
    if (!doc || !pageId) return;
    if (skip.current) { skip.current = false; return; }
    setStatus("dirty");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => save(doc, title), 900);
    return () => clearTimeout(timer.current);
  }, [doc, title, pageId, save]);

  useEffect(() => {
    const close = () => setTabMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  if (status === "loading") return <div className="ev-state">Carregando editor…</div>;
  if (!doc) return <div className="ev-state err">{err}</div>;

  /* ---- area helpers ---- */
  const tabIndex = doc.tabs.findIndex((t) => t.id === area);
  const blocks = area === "header" ? doc.header : (doc.tabs[tabIndex]?.blocks || []);

  const snapshot = () => {
    history.current.push(structuredClone(doc));
    if (history.current.length > 30) history.current.shift();
  };
  const setBlocks = (next, keep) => {
    if (!keep) snapshot();
    setDoc((d) => area === "header"
      ? { ...d, header: next }
      : { ...d, tabs: d.tabs.map((t) => (t.id === area ? { ...t, blocks: next } : t)) });
  };

  const patch = (id, p) => setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...p } : b)), true);
  const addBlock = (type) => {
    const b = newBlock(type);
    const at = insertAt ?? blocks.length;
    const next = [...blocks]; next.splice(at, 0, b);
    setBlocks(next); setPicker(false); setInsertAt(null); setSel(b.id); setTab("content");
  };
  const move = (id, d) => {
    const i = blocks.findIndex((b) => b.id === id), j = i + d;
    if (j < 0 || j >= blocks.length) return;
    const c = [...blocks]; [c[i], c[j]] = [c[j], c[i]]; setBlocks(c);
  };
  const dup = (id) => {
    const i = blocks.findIndex((b) => b.id === id);
    const c = [...blocks];
    c.splice(i + 1, 0, { ...structuredClone(blocks[i]), id: newBlock(blocks[i].type).id });
    setBlocks(c);
  };
  const del = (id) => {
    if (!confirm("Remover este bloco?")) return;
    setBlocks(blocks.filter((b) => b.id !== id));
    if (sel === id) setSel(null);
  };
  const undo = () => { const p = history.current.pop(); if (p) { setDoc(p); setSel(null); } };

  /* ---- tab ops ---- */
  const addTab = () => {
    snapshot();
    const t = { id: uid(), label: "Nova aba", blocks: [] };
    setDoc((d) => ({ ...d, tabs: [...d.tabs, t] }));
    setArea(t.id); setSel(null);
  };
  const renameTab = (id) => {
    const t = doc.tabs.find((x) => x.id === id);
    const label = prompt("Nome da aba:", t.label);
    if (label == null) return;
    snapshot();
    setDoc((d) => ({ ...d, tabs: d.tabs.map((x) => (x.id === id ? { ...x, label: label.trim() || x.label } : x)) }));
  };
  const moveTab = (id, dir) => {
    const i = doc.tabs.findIndex((t) => t.id === id), j = i + dir;
    if (j < 0 || j >= doc.tabs.length) return;
    snapshot();
    const c = [...doc.tabs]; [c[i], c[j]] = [c[j], c[i]];
    setDoc((d) => ({ ...d, tabs: c }));
  };
  const delTab = (id) => {
    if (doc.tabs.length === 1) { alert("Deixe pelo menos uma aba."); return; }
    const t = doc.tabs.find((x) => x.id === id);
    if (!confirm(`Remover a aba "${t.label}" e todo o conteúdo dela?`)) return;
    snapshot();
    const rest = doc.tabs.filter((x) => x.id !== id);
    setDoc((d) => ({ ...d, tabs: rest }));
    if (area === id) setArea(rest[0].id);
  };

  const current = blocks.find((b) => b.id === sel);
  const schema = current ? BLOCKS[current.type] : null;

  return (
    <div className="ev-editor">
      <header className="ev-bar">
        <input className="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do evento" />
        <span className={`ev-status s-${status}`}>
          {status === "saving" ? "Salvando…" : status === "dirty" ? "Alterado" : status === "error" ? "Erro" : "Salvo"}
        </span>
        <button className="ev-ico" onClick={undo} title="Desfazer">↺</button>
        <a className="ev-ico" href="/evento" title="Ver página">◱</a>
      </header>

      {/* area switcher: header + tabs */}
      <div className="ev-areas">
        <button className={`ev-area${area === "header" ? " on" : ""}`} onClick={() => { setArea("header"); setSel(null); }}>
          Topo <span className="ev-area-h">fixo</span>
        </button>
        <span className="ev-area-div" />
        {doc.tabs.map((t) => (
          <span className="ev-area-wrap" key={t.id}>
            <button className={`ev-area${area === t.id ? " on" : ""}`}
                    onClick={() => { setArea(t.id); setSel(null); }}
                    onDoubleClick={() => renameTab(t.id)}>
              {t.label}
              {area === t.id && (
                <span className="ev-area-dots" onClick={(e) => { e.stopPropagation(); setTabMenu(tabMenu === t.id ? null : t.id); }}>⋯</span>
              )}
            </button>
            {tabMenu === t.id && (
              <div className="ev-tabmenu" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => { setTabMenu(null); renameTab(t.id); }}>Renomear</button>
                <button onClick={() => { setTabMenu(null); moveTab(t.id, -1); }}>Mover ←</button>
                <button onClick={() => { setTabMenu(null); moveTab(t.id, 1); }}>Mover →</button>
                <button className="x" onClick={() => { setTabMenu(null); delTab(t.id); }}>Excluir aba</button>
              </div>
            )}
          </span>
        ))}
        <button className="ev-area ev-area-add" onClick={addTab} title="Nova aba">+</button>
      </div>

      <div className="ev-body">
        <div className="ev-canvas">
          {area === "header" && (
            <div className="ev-note">Blocos aqui aparecem <b>acima do menu de abas</b>, em todas as abas — ideal para a capa e a contagem regressiva.</div>
          )}
          <AddHere onClick={() => { setInsertAt(0); setPicker(true); }} />
          {blocks.map((b, i) => (
            <React.Fragment key={b.id}>
              <div className={`ev-blk${sel === b.id ? " sel" : ""}`} onClick={() => { setSel(b.id); setTab("content"); }}>
                <div className="ev-blk-tag">{BLOCKS[b.type]?.label || b.type}</div>
                <div className="ev-blk-acts" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => move(b.id, -1)} disabled={i === 0}>↑</button>
                  <button onClick={() => move(b.id, 1)} disabled={i === blocks.length - 1}>↓</button>
                  <button onClick={() => dup(b.id)} title="Duplicar">⧉</button>
                  <button className="x" onClick={() => del(b.id)}>×</button>
                </div>
                <div className="ev-blk-in"><BlockView b={b} /></div>
              </div>
              <AddHere onClick={() => { setInsertAt(i + 1); setPicker(true); }} />
            </React.Fragment>
          ))}
          {blocks.length === 0 && (
            <div className="ev-empty">
              <div className="ev-empty-t">{area === "header" ? "Topo vazio" : "Aba vazia"}</div>
              <p>Toque em <b>+</b> para adicionar um bloco.</p>
            </div>
          )}
        </div>

        {current && (
          <aside className="ev-insp">
            <div className="ev-insp-h">
              <span className="ev-insp-t">{schema?.label}</span>
              <button className="ev-ico" onClick={() => setSel(null)}>×</button>
            </div>
            {!schema?.raw && (
              <div className="ev-tabs">
                <button className={tab === "content" ? "on" : ""} onClick={() => setTab("content")}>Conteúdo</button>
                <button className={tab === "style" ? "on" : ""} onClick={() => setTab("style")}>Estilo</button>
              </div>
            )}
            <div className="ev-insp-b">
              {(tab === "style" && !schema?.raw ? STYLE_FIELDS : schema.fields).map((f) => (
                <Field key={f.key} field={f} value={current[f.key]}
                       onChange={(v) => patch(current.id, { [f.key]: v })} />
              ))}
            </div>
          </aside>
        )}
      </div>

      {picker && (
        <div className="ev-modal" onClick={(e) => { if (e.target === e.currentTarget) { setPicker(false); setInsertAt(null); } }}>
          <div className="ev-picker">
            <div className="ev-picker-h"><b>Adicionar bloco</b>
              <button className="ev-ico" onClick={() => { setPicker(false); setInsertAt(null); }}>×</button></div>
            <div className="ev-picker-b">
              {GROUPS.map((g) => (
                <div className="ev-grp" key={g}>
                  <div className="ev-grp-t">{g}</div>
                  <div className="ev-grp-l">
                    {Object.entries(BLOCKS).filter(([, v]) => v.group === g).map(([k, v]) => (
                      <button className="ev-pick" key={k} onClick={() => addBlock(k)}>{v.label}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddHere({ onClick }) {
  return <button className="ev-add" onClick={onClick} aria-label="Adicionar bloco aqui"><span>+</span></button>;
}
