import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient.js";

/* ============================================================
   Alliance menu. The two built-in pages are always there; every
   page created in the builder joins them automatically once it
   is marked "show in menu".
   ============================================================ */

const BUILT_IN = [
  { to: "/", label: "Troops Intel", end: true },
  { to: "/tri-alliance", label: "Tri-Alliance" },
];

export default function NavBar() {
  const [pages, setPages] = useState([]);
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

  const cls = ({ isActive }) => `nav-chip${isActive ? " on" : ""}`;
  const editing = pathname.endsWith("/editar");

  return (
    <nav className="topnav">
      {BUILT_IN.map((b) => (
        <NavLink key={b.to} to={b.to} end={b.end} className={cls}>{b.label}</NavLink>
      ))}
      {pages.map((p) => (
        <NavLink key={p.slug} to={`/${p.slug}`} className={cls}>
          {p.nav_label || p.title || p.slug}
        </NavLink>
      ))}
      <NavLink to="/paginas" className={({ isActive }) => `nav-chip nav-manage${isActive || editing ? " on" : ""}`}
               title="Páginas e edição">+</NavLink>
    </nav>
  );
}
