import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient.js";

/* ============================================================
   /paginas — every page of the site in one place.
   Create a new one, jump straight into its editor, rename its
   menu button, reorder it, or hide it from the menu.
   ============================================================ */

const RESERVED = new Set(["paginas", "dados", "editar", "tri-alliance", "e", "p", "evento"]);

const slugify = (s) =>
  s.toLowerCase().trim()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);

export default function PagesIndex() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const nav = useNavigate();

  const load = async () => {
    const { data, error } = await supabase.from("event_pages")
      .select("id, slug, title, nav_label, nav_order, in_nav, updated_at")
      .order("nav_order").order("id");
    if (!error) setPages(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    const t = name.trim();
    if (!t) return;
    const slug = slugify(t);
    if (!slug) { setErr("Escolha um nome com letras ou números."); return; }
    if (RESERVED.has(slug)) { setErr(`"${slug}" é um endereço reservado. Escolha outro nome.`); return; }
    setBusy(true); setErr("");
    try {
      const { error } = await supabase.from("event_pages").insert({
        slug, title: t, nav_label: t, nav_order: 100,
        doc: { theme: {}, header: [], tabs: [{ id: `t${Date.now().toString(36)}`, label: "Overview", blocks: [] }] },
      });
      if (error) throw error;
      nav(`/${slug}/editar`);
    } catch (e) {
      console.error(e);
      setErr(e.code === "23505" ? "Já existe uma página com esse endereço." : "Não consegui criar a página.");
      setBusy(false);
    }
  };

  const patch = async (id, p) => { await supabase.from("event_pages").update(p).eq("id", id); load(); };
  const rename = async (p) => {
    const v = prompt("Nome do botão no menu:", p.nav_label || p.title);
    if (v != null) patch(p.id, { nav_label: v.trim() || p.title });
  };
  const move = async (p, dir) => {
    const i = pages.findIndex((x) => x.id === p.id), j = i + dir;
    if (j < 0 || j >= pages.length) return;
    await patch(p.id, { nav_order: (pages[j].nav_order ?? 100) + (dir > 0 ? 1 : -1) });
  };
  const remove = async (p) => {
    if (!confirm(`Excluir a página "${p.title}" e todo o conteúdo dela?\n\nIsso não pode ser desfeito.`)) return;
    await supabase.from("event_pages").delete().eq("id", p.id);
    load();
  };

  return (
    <div className="app pages-idx">
      <header className="pi-head">
        <div>
          <div className="eyebrow">Alliance Command</div>
          <h1 className="pi-title metal">Páginas</h1>
        </div>
      </header>

      <section className="pi-new">
        <label className="field-lbl">Criar uma página nova</label>
        <div className="pi-new-row">
          <input className="field" placeholder="Ex.: Tri-Alliance Agosto"
                 value={name} onChange={(e) => { setName(e.target.value); setErr(""); }}
                 onKeyDown={(e) => e.key === "Enter" && create()} />
          <button className="btn-gold" onClick={create} disabled={busy || !name.trim()}>
            {busy ? "Criando…" : "Criar"}
          </button>
        </div>
        {name.trim() && <div className="f-hint">Endereço: <code>/{slugify(name) || "…"}</code></div>}
        {err && <div className="f-err">{err}</div>}
      </section>

      <section className="pi-list">
        <label className="field-lbl">Páginas do site</label>

        <div className="pi-row pi-fixed">
          <div className="pi-info"><b>Troops Intel</b><code>/</code></div>
          <span className="pi-tag">fixa</span>
        </div>
        {loading && <div className="ie-none">Carregando…</div>}
        {pages.map((p, i) => (
          <div className="pi-row" key={p.id}>
            <div className="pi-info">
              <b>{p.nav_label || p.title}</b>
              <code>/{p.slug}</code>
            </div>
            <div className="pi-acts">
              <button onClick={() => move(p, -1)} disabled={i === 0} title="Subir no menu">↑</button>
              <button onClick={() => move(p, 1)} disabled={i === pages.length - 1} title="Descer no menu">↓</button>
              <button onClick={() => rename(p)} title="Renomear o botão">✎</button>
              <button onClick={() => patch(p.id, { in_nav: !p.in_nav })}
                      title={p.in_nav ? "Esconder do menu" : "Mostrar no menu"}>
                {p.in_nav ? "◉" : "○"}
              </button>
              <button className="x" onClick={() => remove(p)} title="Excluir">×</button>
            </div>
            <div className="pi-links">
              <a href={`/${p.slug}`}>Ver</a>
              <a className="gold" href={`/${p.slug}/editar`}>Editar</a>
            </div>
          </div>
        ))}
        {!loading && pages.length === 0 && (
          <div className="ie-none">Nenhuma página criada ainda.</div>
        )}
      </section>

      <div className="foot">
        Para editar qualquer página, acrescente <b>/editar</b> ao endereço dela.
      </div>
    </div>
  );
}
