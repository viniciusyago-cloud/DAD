import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { supabase } from "../supabaseClient.js";

/* ============================================================
   Alliance menu. Troops Intel is always first; every page created
   in the builder joins it automatically once it is marked
   "show in menu". Page management lives at /paginas — reachable
   only by typing the address, so it stays out of players' way.
   ============================================================ */

const BUILT_IN = [
  { to: "/", label: "Troops Intel", end: true },
];

export default function NavBar() {
  const [pages, setPages] = useState([]);

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
    </nav>
  );
}
