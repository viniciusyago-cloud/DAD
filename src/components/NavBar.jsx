import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient.js";

/* ============================================================
   Alliance menu — a slim bar, not a row of buttons.

   Two reasons it is a dropdown. It has to stay one line however
   many pages the builder produces; and the event pages already
   carry their own tab strip, so a second row of pills at the top
   left no way to tell which level you were looking at.

   Troops Intel is always there. Every other page joins once it is
   marked "show in menu" — pages are created at /paginas, which is
   reachable only by typing the address.
   ============================================================ */

const HOME = { to: "/", label: "Troops Intel", end: true };

export default function NavBar() {
  const [pages, setPages] = useState([]);
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data, error } = await supabase
        .from("event_pages")
        .select("slug, title, nav_label, nav_order, in_nav")
        .eq("in_nav", true)
        .order("nav_order")
        .order("id");
      if (!error && alive) setPages(data || []);
    };
    load();
    const ch = supabase.channel("nav-pages")
      .on("postgres_changes", { event: "*", schema: "public", table: "event_pages" }, () => load())
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const away = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  const items = [HOME, ...pages.map((p) => ({ to: `/${p.slug}`, label: p.nav_label || p.title || p.slug }))];
  const here = items.find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to)));

  return (
    <nav className="topnav">
      <NavLink to="/" className="topnav-brand">BigDaddys</NavLink>
      <span className="topnav-div" />

      <div className="topnav-menu" ref={box}>
        <button className={`topnav-cur${open ? " on" : ""}`} onClick={() => setOpen((v) => !v)}
                aria-expanded={open} aria-haspopup="menu">
          <span>{here?.label || "Páginas"}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={open ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} />
          </svg>
        </button>

        {open && (
          <div className="topnav-list" role="menu">
            {items.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.end} role="menuitem"
                       className={({ isActive }) => `topnav-item${isActive ? " on" : ""}`}>
                <span>{i.label}</span>
                {i.to === here?.to && <b aria-hidden="true">✓</b>}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
