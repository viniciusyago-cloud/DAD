import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import BlockView from "./BlockView.jsx";
import { DEFAULT_THEME } from "./blocks.js";
import { PageCtx } from "./MemberBlocks.jsx";

/* ============================================================
   EVENT PAGE (public) — /e/:slug
   Header blocks, then the tab menu, then the active tab.
   All player-facing copy is English.
   ============================================================ */

export default function EventPage() {
  const { slug } = useParams();

  const [doc, setDoc] = useState(null);
  const [state, setState] = useState("loading");
  const [active, setActive] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data, error } = await supabase.from("event_pages").select("doc, title").eq("slug", slug).maybeSingle();
        if (error) throw error;
        if (!mounted) return;
        const d = data?.doc;
        const header = Array.isArray(d?.header) ? d.header : (Array.isArray(d?.blocks) ? d.blocks : []);
        const tabs = Array.isArray(d?.tabs) ? d.tabs : [];
        if (!data) { setState("missing"); return; }
        if (!header.length && !tabs.some((t) => t.blocks?.length)) { setState("empty"); return; }
        setDoc({ theme: { ...DEFAULT_THEME, ...(d.theme || {}) }, header, tabs, title: data.title });
        setState("ok");
      } catch (e) { console.error(e); if (mounted) setState("error"); }
    };
    load();
    const ch = supabase.channel(`event-page-${slug}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_pages" }, () => load())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [slug]);

  useEffect(() => { if (doc?.title) document.title = `${doc.title} · BigDaddys`; }, [doc]);

  if (state === "loading") return <div className="ev-state">Loading…</div>;
  if (state === "error") return <div className="ev-state err">Couldn’t load this event.</div>;
  if (state === "empty") return (
    <div className="ev-state">This page hasn’t been built yet.
      <div style={{ marginTop: 10, fontSize: 12 }}>Open <b>/e/{slug}/editar</b> to build it.</div></div>
  );

  const tabs = doc.tabs.filter((t) => t.blocks?.length);
  const cur = tabs[Math.min(active, Math.max(0, tabs.length - 1))];

  return (
    <PageCtx.Provider value={{ slug, doc, preview: false }}>
    <div className="app ev-page">
      {doc.header.map((b) => <BlockView key={b.id} b={b} />)}

      {tabs.length > 1 && (
        <TabBar tabs={tabs} active={active} onPick={setActive} />
      )}

      {cur?.blocks.map((b) => <BlockView key={b.id} b={b} />)}
    </div>
    </PageCtx.Provider>
  );
}

/* ------------------------------------------------------------------
   Tab strip. It scrolls sideways, and a strip that simply stops at the
   edge reads as missing content rather than more content — so each side
   fades only while there is something past it. The active tab also pulls
   itself into view, since landing on a page whose tab starts off-screen
   looks like the wrong tab is selected.
   ------------------------------------------------------------------ */
function TabBar({ tabs, active, onPick }) {
  const strip = useRef(null);
  const [edge, setEdge] = useState({ left: false, right: false });

  const measure = () => {
    const el = strip.current; if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdge({ left: el.scrollLeft > 2, right: el.scrollLeft < max - 2 });
  };

  useEffect(() => {
    measure();
    const el = strip.current; if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tabs.length]);

  useEffect(() => {
    strip.current?.children[active]?.scrollIntoView({ block: "nearest", inline: "nearest" });
    measure();
  }, [active]);

  return (
    <div className={`ev-tabwrap${edge.left ? " fade-l" : ""}${edge.right ? " fade-r" : ""}`}>
      <nav className="ev-tabbar" role="tablist" ref={strip} onScroll={measure}>
        {tabs.map((t, i) => (
          <button key={t.id} role="tab" aria-selected={i === active}
                  className={`ev-tabchip${i === active ? " on" : ""}`}
                  onClick={() => onPick(i)}>{t.label}</button>
        ))}
      </nav>
    </div>
  );
}
