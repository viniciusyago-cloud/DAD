import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import { BLOCKS, GROUPS, STYLE_FIELDS, TITLE_FIELD, newBlock, DEFAULT_THEME } from "./blocks.js";
import BlockView from "./BlockView.jsx";
import Field from "./Fields.jsx";
import { PageCtx } from "./MemberBlocks.jsx";

/* ============================================================
   EVENT PAGE BUILDER — /e/:slug/editar
   Doc: { theme, header:[blocks], tabs:[{id,label,blocks}] }
   Blocks can nest via container blocks (children[]).
   ============================================================ */

const RESERVED_SLUGS = ["paginas", "dados", "editar", "tri-alliance", "e", "p", "evento"];

const uid = (p = "t") => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const normalize = (doc) => {
  const d = doc && typeof doc === "object" ? doc : {};
  return {
    theme: { ...DEFAULT_THEME, ...(d.theme || {}) },
    header: Array.isArray(d.header) ? d.header : (Array.isArray(d.blocks) ? d.blocks : []),
    tabs: Array.isArray(d.tabs) && d.tabs.length ? d.tabs : [{ id: uid(), label: "Overview", blocks: [] }],
  };
};

/* find a block anywhere in a (mutable) tree */
function findIn(blocks, id) {
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].id === id) return { arr: blocks, i, block: blocks[i] };
    const ch = blocks[i].children;
    if (Array.isArray(ch)) { const r = findIn(ch, id); if (r) return r; }
  }
  return null;
}

export default function EventEditor() {
  const { slug } = useParams();

  const [doc, setDoc] = useState(null);
  const [pageId, setPageId] = useState(null);
  const [title, setTitle] = useState("");
  const [newSlug, setNewSlug] = useState(slug);
  const [navLabel, setNavLabel] = useState("");
  const [inNav, setInNav] = useState(true);
  const [area, setArea] = useState("header");
  const [sel, setSel] = useState(null);
  const [tab, setTab] = useState("content");
  const [picker, setPicker] = useState(null);   // { parentId, index }
  const [tabMenu, setTabMenu] = useState(null);
  const [settings, setSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("loading");
  const [err, setErr] = useState("");
  const history = useRef([]);
  const timer = useRef(null);
  const skip = useRef(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from("event_pages").select("*").eq("slug", slug).maybeSingle();
        if (error) throw error;
        if (data) { setPageId(data.id); setTitle(data.title || ""); setNewSlug(data.slug);
          setNavLabel(data.nav_label || data.title || ""); setInNav(data.in_nav !== false);
          setDoc(normalize(data.doc)); }
        else if (RESERVED_SLUGS.includes(slug)) {
          setErr(`"${slug}" é um endereço reservado do site — não dá para criar uma página aqui.`);
          setStatus("error"); return;
        } else {
          const fresh = normalize(null);
          const { data: made, error: e2 } = await supabase.from("event_pages")
            .insert({ slug, title: "New event", doc: fresh }).select().single();
          if (e2) throw e2;
          setPageId(made.id); setTitle(made.title); setDoc(fresh);
        }
        setStatus("saved");
      } catch (e) { console.error(e); setErr("Não consegui carregar. A migration v4 foi aplicada?"); setStatus("error"); }
    })();
  }, [slug]);

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

  const tabIdx = doc.tabs.findIndex((t) => t.id === area);
  const blocks = area === "header" ? doc.header : (doc.tabs[tabIdx]?.blocks || []);

  /* ---- tree mutation ---- */
  const mutate = (fn, snapshot = true) => {
    if (snapshot) {
      history.current.push(structuredClone(doc));
      if (history.current.length > 30) history.current.shift();
    }
    setDoc((d) => {
      const c = structuredClone(d);
      const list = area === "header" ? c.header : c.tabs.find((t) => t.id === area).blocks;
      fn(list, c);
      return c;
    });
  };

  const patch = (id, p) => mutate((list) => { const f = findIn(list, id); if (f) Object.assign(f.block, p); }, false);
  const addBlock = (type) => {
    const b = newBlock(type);
    const { parentId, index } = picker;
    mutate((list) => {
      const target = parentId ? (findIn(list, parentId)?.block.children ?? null) : list;
      if (!target) return;
      target.splice(index ?? target.length, 0, b);
    });
    setPicker(null); setSel(b.id); setTab("content");
  };
  const move = (id, d) => mutate((list) => {
    const f = findIn(list, id); if (!f) return;
    const j = f.i + d; if (j < 0 || j >= f.arr.length) return;
    [f.arr[f.i], f.arr[j]] = [f.arr[j], f.arr[f.i]];
  });
  const dup = (id) => mutate((list) => {
    const f = findIn(list, id); if (!f) return;
    const clone = structuredClone(f.block);
    const reId = (b) => { b.id = uid("b"); (b.children || []).forEach(reId); };
    reId(clone);
    f.arr.splice(f.i + 1, 0, clone);
  });
  const del = (id) => {
    if (!confirm("Remover este bloco?")) return;
    mutate((list) => { const f = findIn(list, id); if (f) f.arr.splice(f.i, 1); });
    if (sel === id) setSel(null);
  };
  const undo = () => { const p = history.current.pop(); if (p) { setDoc(p); setSel(null); } };

  /* ---- tabs ---- */
  const addTab = () => {
    history.current.push(structuredClone(doc));
    const t = { id: uid(), label: "New tab", blocks: [] };
    setDoc((d) => ({ ...d, tabs: [...d.tabs, t] })); setArea(t.id); setSel(null);
  };
  const renameTab = (id) => {
    const t = doc.tabs.find((x) => x.id === id);
    const label = prompt("Nome da aba (aparece em inglês na página):", t.label);
    if (label == null) return;
    setDoc((d) => ({ ...d, tabs: d.tabs.map((x) => (x.id === id ? { ...x, label: label.trim() || x.label } : x)) }));
  };
  const moveTab = (id, dir) => setDoc((d) => {
    const i = d.tabs.findIndex((t) => t.id === id), j = i + dir;
    if (j < 0 || j >= d.tabs.length) return d;
    const c = [...d.tabs]; [c[i], c[j]] = [c[j], c[i]]; return { ...d, tabs: c };
  });
  const delTab = (id) => {
    if (doc.tabs.length === 1) { alert("Deixe pelo menos uma aba."); return; }
    const t = doc.tabs.find((x) => x.id === id);
    if (!confirm(`Remover a aba "${t.label}" e todo o conteúdo dela?`)) return;
    const rest = doc.tabs.filter((x) => x.id !== id);
    setDoc((d) => ({ ...d, tabs: rest }));
    if (area === id) setArea(rest[0].id);
  };

  /* ---- settings: slug + share ---- */
  const publicUrl = `${window.location.origin}/${slug}`;
  const saveSettings = async () => {
    const s = newSlug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!s) { alert("Escolha um endereço válido."); return; }
    if (s !== slug && RESERVED_SLUGS.includes(s)) { alert(`"${s}" é um endereço reservado.`); return; }
    const { error } = await supabase.from("event_pages")
      .update({ slug: s, nav_label: navLabel.trim() || title, in_nav: inNav }).eq("id", pageId);
    if (error) { alert("Esse endereço já existe. Escolha outro."); return; }
    if (s !== slug) window.location.href = `/${s}/editar`;
    else setSettings(false);
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(publicUrl); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { prompt("Copie o link:", publicUrl); }
  };

  const found = sel ? findIn(structuredClone(blocks), sel) : null;
  const current = found?.block || null;
  const schema = current ? BLOCKS[current.type] : null;
  const contentFields = schema ? (schema.raw ? schema.fields : [TITLE_FIELD, ...schema.fields]) : [];

  return (
    <PageCtx.Provider value={{ slug, doc, preview: true }}>
    <div className="ev-editor">
      <header className="ev-bar">
        <input className="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do evento" />
        <span className={`ev-status s-${status}`}>
          {status === "saving" ? "Salvando…" : status === "dirty" ? "Alterado" : status === "error" ? "Erro" : "Salvo"}
        </span>
        <button className="ev-ico" onClick={() => setSettings(true)} title="Configurações e link">⚙</button>
        <button className="ev-ico" onClick={undo} title="Desfazer">↺</button>
        <a className="ev-ico" href={`/${slug}`} title="Ver página">◱</a>
      </header>

      <div className="ev-areas">
        <button className={`ev-area${area === "header" ? " on" : ""}`} onClick={() => { setArea("header"); setSel(null); }}>
          Topo <span className="ev-area-h">fixo</span>
        </button>
        <span className="ev-area-div" />
        {doc.tabs.map((t) => (
          <span className="ev-area-wrap" key={t.id}>
            <button className={`ev-area${area === t.id ? " on" : ""}`}
                    onClick={() => { setArea(t.id); setSel(null); }} onDoubleClick={() => renameTab(t.id)}>
              {t.label}
              {area === t.id && <span className="ev-area-dots"
                onClick={(e) => { e.stopPropagation(); setTabMenu(tabMenu === t.id ? null : t.id); }}>⋯</span>}
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

      <div className={`ev-body${current ? " has-insp" : ""}`}>
        <div className="ev-canvas">
          {area === "header" && (
            <div className="ev-note">Blocos aqui aparecem <b>acima do menu de abas</b>, em todas as abas.</div>
          )}
          <Canvas blocks={blocks} parentId={null} sel={sel} setSel={setSel} setTab={setTab}
                  onAdd={(parentId, index) => setPicker({ parentId, index })}
                  move={move} dup={dup} del={del} />
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
              {(tab === "style" && !schema?.raw
                ? [...STYLE_FIELDS, ...(schema.styleFields || [])]
                : contentFields).map((f) => (
                <Field key={f.key || `h-${f.label}`} field={f} value={current[f.key]}
                       onChange={(v) => patch(current.id, { [f.key]: v })} />
              ))}
              {schema?.container && (
                <div className="f-hint" style={{ marginTop: 4 }}>
                  Adicione blocos <b>dentro</b> desta seção usando os <b>+</b> que aparecem na área pontilhada.
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {picker && (
        <div className="ev-modal" onClick={(e) => { if (e.target === e.currentTarget) setPicker(null); }}>
          <div className="ev-picker">
            <div className="ev-picker-h"><b>Adicionar bloco</b>
              <button className="ev-ico" onClick={() => setPicker(null)}>×</button></div>
            <div className="ev-picker-b">
              {GROUPS.map((g) => (
                <div className="ev-grp" key={g}>
                  <div className="ev-grp-t">{g}</div>
                  <div className="ev-grp-l">
                    {Object.entries(BLOCKS).filter(([, v]) => v.group === g && !v.hidden).map(([k, v]) => (
                      <button className="ev-pick" key={k} onClick={() => addBlock(k)}>{v.label}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {settings && (
        <div className="ev-modal" onClick={(e) => { if (e.target === e.currentTarget) setSettings(false); }}>
          <div className="ev-picker ev-settings">
            <div className="ev-picker-h"><b>Configurações do evento</b>
              <button className="ev-ico" onClick={() => setSettings(false)}>×</button></div>
            <div className="ev-picker-b">
              <label className="f-lbl">Nome do evento</label>
              <input className="f-in" value={title} onChange={(e) => setTitle(e.target.value)} />

              <label className="f-lbl" style={{ marginTop: 16 }}>Endereço da página</label>
              <div className="ev-slug">
                <span>/e/</span>
                <input className="f-in" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="tri-alliance" />
              </div>
              <div className="f-hint">Só letras, números e hífen. Mudar o endereço quebra links antigos.</div>

              <label className="f-lbl" style={{ marginTop: 16 }}>Botão no menu da aliança</label>
              <input className="f-in" value={navLabel} onChange={(e) => setNavLabel(e.target.value)}
                     placeholder="Nome que aparece no menu" />
              <div className="f f-row" style={{ marginTop: 10 }}>
                <span className="f-lbl" style={{ marginBottom: 0 }}>Mostrar no menu</span>
                <button type="button" className={`f-tog${inNav ? " on" : ""}`}
                        onClick={() => setInNav((v) => !v)}><span /></button>
              </div>

              <label className="f-lbl" style={{ marginTop: 16 }}>Link para compartilhar</label>
              <div className="ev-share">
                <code>{publicUrl}</code>
                <button className="f-btn" onClick={copyLink}>{copied ? "Copiado!" : "Copiar"}</button>
              </div>

              <div className="sheet-actions">
                <button className="btn-ghost" onClick={() => setSettings(false)}>Fechar</button>
                <button className="btn-gold" onClick={saveSettings}>Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </PageCtx.Provider>
  );
}

/* ---- recursive canvas ---- */
function Canvas({ blocks, parentId, sel, setSel, setTab, onAdd, move, dup, del, depth = 0 }) {
  return (
    <>
      <AddHere onClick={() => onAdd(parentId, 0)} />
      {blocks.map((b, i) => {
        const schema = BLOCKS[b.type];
        return (
          <React.Fragment key={b.id}>
            <div className={`ev-blk${sel === b.id ? " sel" : ""}`}
                 onClick={(e) => { e.stopPropagation(); setSel(b.id); setTab("content"); }}>
              <div className="ev-blk-tag">{schema?.label || b.type}</div>
              <div className="ev-blk-acts" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => move(b.id, -1)} disabled={i === 0}>↑</button>
                <button onClick={() => move(b.id, 1)} disabled={i === blocks.length - 1}>↓</button>
                <button onClick={() => dup(b.id)} title="Duplicar">⧉</button>
                <button className="x" onClick={() => del(b.id)}>×</button>
              </div>
              <div className="ev-blk-in">
                <BlockView b={b} slot={schema?.container ? (
                  <div className="ev-group-in">
                    <Canvas blocks={b.children || []} parentId={b.id} sel={sel} setSel={setSel} setTab={setTab}
                            onAdd={onAdd} move={move} dup={dup} del={del} depth={depth + 1} />
                  </div>
                ) : undefined} />
              </div>
            </div>
            <AddHere onClick={() => onAdd(parentId, i + 1)} />
          </React.Fragment>
        );
      })}
      {blocks.length === 0 && depth > 0 && <div className="ev-group-empty">Seção vazia — use o + acima</div>}
    </>
  );
}

function AddHere({ onClick }) {
  return (
    <button className="ev-add" onClick={(e) => { e.stopPropagation(); onClick(); }} aria-label="Adicionar bloco aqui">
      <span>+</span>
    </button>
  );
}
