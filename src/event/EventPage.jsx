import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import BlockView from "./BlockView.jsx";
import { DEFAULT_THEME } from "./blocks.js";

/* ============================================================
   EVENT PAGE (public) — /evento
   Header blocks, then the tab menu, then the active tab.
   ============================================================ */

const SLUG = "tri-alliance";

export default function EventPage() {
  const [doc, setDoc] = useState(null);
  const [state, setState] = useState("loading");
  const [active, setActive] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data, error } = await supabase.from("event_pages").select("doc").eq("slug", SLUG).maybeSingle();
        if (error) throw error;
        if (!mounted) return;
        const d = data?.doc;
        const header = Array.isArray(d?.header) ? d.header : (Array.isArray(d?.blocks) ? d.blocks : []);
        const tabs = Array.isArray(d?.tabs) ? d.tabs : [];
        if (!header.length && !tabs.some((t) => t.blocks?.length)) { setState("empty"); return; }
        setDoc({ theme: { ...DEFAULT_THEME, ...(d.theme || {}) }, header, tabs });
        setState("ok");
      } catch (e) { console.error(e); if (mounted) setState("error"); }
    };
    load();
    const ch = supabase.channel("event-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "event_pages" }, () => load())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  if (state === "loading") return <div className="ev-state">Carregando…</div>;
  if (state === "error") return <div className="ev-state err">Não consegui carregar o evento.</div>;
  if (state === "empty") return (
    <div className="ev-state">Esta página ainda não foi montada.
      <div style={{ marginTop: 10, fontSize: 12 }}>Abra <b>/evento/editar</b> para construí-la.</div></div>
  );

  const tabs = doc.tabs.filter((t) => t.blocks?.length);
  const cur = tabs[Math.min(active, Math.max(0, tabs.length - 1))];

  return (
    <div className="app ev-page">
      {doc.header.map((b) => <BlockView key={b.id} b={b} />)}

      {tabs.length > 1 && (
        <nav className="ev-tabbar" role="tablist">
          {tabs.map((t, i) => (
            <button key={t.id} role="tab" aria-selected={i === active}
                    className={`ev-tabchip${i === active ? " on" : ""}`}
                    onClick={() => setActive(i)}>{t.label}</button>
          ))}
        </nav>
      )}

      {cur?.blocks.map((b) => <BlockView key={b.id} b={b} />)}

      <div className="ev-foot">BigDaddys · Alliance Command</div>
    </div>
  );
}
