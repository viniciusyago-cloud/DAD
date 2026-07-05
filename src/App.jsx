import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient.js";

/* ============================================================
   BigDaddys — TROOPS INTELLIGENCE BOARD  (Vercel + Supabase)
   Public shared board. Anyone with the link can view and edit.
   Realtime sync via Supabase channels.
   ============================================================ */

const AVATARS = ["panther", "cheetah", "lynx", "elephant", "wolf"];
const avatarSrc = (a) => `/avatars/${AVATARS.includes(a) ? a : "panther"}.png`;
const TROOP_ICON = { inf: "/troops/infantry.png", cav: "/troops/cavalry.png", arch: "/troops/archer.png" };

// Quick presets for the "pick a range" dropdown in the editor
const PRESETS = [
  { label: "< 200k", v: 150000 },
  { label: "200–300k", v: 250000 },
  { label: "300–400k", v: 350000 },
  { label: "400–500k", v: 450000 },
  { label: "500–600k", v: 550000 },
  { label: "600–700k", v: 650000 },
  { label: "700–800k", v: 750000 },
  { label: "> 800k", v: 850000 },
];

// Fallback: derive an exact count from a legacy range label (pre-migration safety)
const RANGE_MID = {
  "<200": 150000, "200-300": 250000, "300-400": 350000, "400-500": 450000,
  "500-600": 550000, "600-700": 650000, "700-800": 750000, ">800": 850000,
};

const countOf = (m, base) => {
  const ck = base === "arch" ? "arch_count" : `${base}_count`;
  const c = m[ck];
  if (c && c > 0) return c;
  const rk = base === "arch" ? "arc" : base; // legacy range column
  return RANGE_MID[m[rk]] || 0;
};

const totalOf = (m) => countOf(m, "inf") + countOf(m, "cav") + countOf(m, "arch");

const classify = (i, c, a) => {
  if (!i || !c || !a) return "Incomplete";
  const mx = Math.max(i, c, a), mn = Math.min(i, c, a);
  if (mx === 0) return "Incomplete";
  if ((mx - mn) / mx < 0.12) return "Balanced";
  if (a === mx) return "Archer";
  if (c === mx) return "Cavalry";
  return "Infantry";
};

const ringClass = (p) =>
  p === "Archer" ? "archer" : p === "Cavalry" ? "cavalry" : p === "Infantry" ? "infantry" : p === "Balanced" ? "balanced" : "";

// Compact number formatter — 548000 -> "548k", 1750000 -> "1.75M"
const fmt = (n) => {
  if (!n) return "0";
  if (n >= 1e6) return `${parseFloat((n / 1e6).toFixed(2))}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
};
const trim1 = (x) => parseFloat(x.toFixed(1));

export default function App() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [sortBy, setSortBy] = useState("total"); // total | name
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [menuId, setMenuId] = useState(null);
  const [form, setForm] = useState(null); // null = closed; else {mode,id,name,avatar,inf,cav,arch}
  const toastTimer = useRef(null);

  // Fetch + realtime
  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        const { data, error } = await supabase.from("members").select("*");
        if (error) throw error;
        if (mounted) { setMembers(data || []); setLoading(false); }
      } catch (e) {
        console.error(e);
        if (mounted) {
          setErrorMsg("Couldn't connect to the database. Check the Supabase env vars and that migration_v2 has been run.");
          setLoading(false);
        }
      }
    };
    fetchAll();
    const channel = supabase
      .channel("members-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, () => fetchAll())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  // Close row menu on any outside click
  useEffect(() => {
    const close = () => setMenuId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }, []);

  const rows = useMemo(
    () => members.map((m) => {
      const inf = countOf(m, "inf"), cav = countOf(m, "cav"), arch = countOf(m, "arch");
      return { ...m, inf, cav, arch, total: inf + cav + arch, profile: classify(inf, cav, arch) };
    }),
    [members],
  );

  const stats = useMemo(() => {
    const totalInf = rows.reduce((s, r) => s + r.inf, 0);
    const totalCav = rows.reduce((s, r) => s + r.cav, 0);
    const totalArch = rows.reduce((s, r) => s + r.arch, 0);
    const combined = totalInf + totalCav + totalArch;
    return { totalInf, totalCav, totalArch, combined, count: rows.length };
  }, [rows]);

  const view = useMemo(() => {
    let v = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      v = v.filter((r) => (r.name || "").toLowerCase().includes(q));
    }
    v = [...v].sort((a, b) => {
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      return b.total - a.total; // total = army size (troops)
    });
    return v;
  }, [rows, search, sortBy]);

  const pct = (part) => (stats.combined ? Math.round((part / stats.combined) * 100) : 0);

  // ---- CRUD ----
  const saveMember = async () => {
    if (!form || !form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      avatar: form.avatar,
      inf_count: Number(form.inf) || 0,
      cav_count: Number(form.cav) || 0,
      arch_count: Number(form.arch) || 0,
    };
    try {
      if (form.mode === "edit") {
        setMembers((prev) => prev.map((m) => (m.id === form.id ? { ...m, ...payload } : m)));
        const { error } = await supabase.from("members").update(payload).eq("id", form.id);
        if (error) throw error;
        showToast("Member updated");
      } else {
        const { data, error } = await supabase.from("members").insert(payload).select().single();
        if (error) throw error;
        setMembers((prev) => [...prev, data]);
        showToast("Member added");
      }
      setForm(null);
    } catch (e) {
      console.error(e);
      showToast("Save failed");
    }
  };

  const removeById = async (id, name) => {
    if (!confirm(`Remove ${name} from the alliance?`)) return;
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setForm(null);
    try {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
      showToast("Member removed");
    } catch (e) {
      console.error(e);
      showToast("Remove failed");
    }
  };

  const openAdd = () => setForm({ mode: "add", id: null, name: "", avatar: "panther", inf: 0, cav: 0, arch: 0 });
  const openEdit = (r) => setForm({ mode: "edit", id: r.id, name: r.name, avatar: r.avatar || "panther", inf: r.inf, cav: r.cav, arch: r.arch });

  if (loading) {
    return (
      <div className="app">
        <div className="state-card">
          <div className="eyebrow">Alliance Command</div>
          <h1 className="metal">Loading intel…</h1>
        </div>
      </div>
    );
  }
  if (errorMsg) {
    return (
      <div className="app">
        <div className="state-card">
          <div className="eyebrow err">Connection error</div>
          <p>{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="app">
        {/* Hero banner */}
        <header className="banner">
          <img src="/hero.jpg" alt="BigDaddys alliance" />
          <div className="scrim"></div>
          <div className="b-in">
            <div className="eyebrow">Alliance Command</div>
            <div className="b-name metal">BigDaddys</div>
          </div>
        </header>

        {/* Intel */}
        <section className="intel">
          <div className="intel-head">
            <div>
              <div className="lbl">Combined Might</div>
              <div className="hero-num metal">{trim1(stats.combined / 1e6)}<span className="u">M</span></div>
            </div>
            <div className="intel-side">
              <div className="num metal">{stats.count}</div>
              <div className="cap">Members</div>
            </div>
          </div>
          <div className="ttiles">
            <Tile icon={TROOP_ICON.arch} label="Archers" value={stats.totalArch} pct={pct(stats.totalArch)} color="var(--arch)" />
            <Tile icon={TROOP_ICON.inf} label="Infantry" value={stats.totalInf} pct={pct(stats.totalInf)} color="var(--inf)" />
            <Tile icon={TROOP_ICON.cav} label="Cavalry" value={stats.totalCav} pct={pct(stats.totalCav)} color="var(--cav)" />
          </div>
        </section>

        {/* Controls */}
        <div className="controls-row">
          <div className="searchbar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="seg">
            <button className={sortBy === "total" ? "on" : ""} onClick={() => setSortBy("total")}>Total</button>
            <button className={sortBy === "name" ? "on" : ""} onClick={() => setSortBy("name")}>Name</button>
          </div>
        </div>

        {/* Roster */}
        <div className="roster">
          {view.map((r) => (
            <div className="row" key={r.id}>
              <div className={`avatar ${ringClass(r.profile)}`}>
                <img src={avatarSrc(r.avatar)} alt="" />
              </div>
              <div className="r-body">
                <div className="r-top">
                  <span className="r-name">{r.name}</span>
                  <span className="r-total">~{fmt(r.total)}</span>
                  <button
                    className="kebab"
                    aria-label="Options"
                    onClick={(e) => { e.stopPropagation(); setMenuId(menuId === r.id ? null : r.id); }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" /></svg>
                  </button>
                </div>
                <div className="troops">
                  <TChip cls="inf" icon={TROOP_ICON.inf} value={r.inf} />
                  <TChip cls="cav" icon={TROOP_ICON.cav} value={r.cav} />
                  <TChip cls="arch" icon={TROOP_ICON.arch} value={r.arch} />
                </div>
              </div>
              {menuId === r.id && (
                <div className="row-menu" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { setMenuId(null); openEdit(r); }}>Edit member</button>
                  <button className="danger" onClick={() => { setMenuId(null); removeById(r.id, r.name); }}>Remove</button>
                </div>
              )}
            </div>
          ))}
          {view.length === 0 && <div className="empty">No members match your search.</div>}
        </div>

        <div className="foot">Tap ⋮ to edit troops or remove a member · every edit syncs live.</div>
      </div>

      <button className="fab" onClick={openAdd} aria-label="Add new member">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M12 5v14M5 12h14" /></svg>
      </button>

      {/* Add / edit sheet */}
      <div className={`overlay${form ? " open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) setForm(null); }}>
        {form && (
          <div className={`sheet${form.mode === "edit" ? " edit" : ""}`}>
            <div className="grip"></div>
            <h3 className="metal">{form.mode === "edit" ? "Edit member" : "New member"}</h3>
            <div className="sheet-sub">Type the exact troop counts, or pick a range from the list.</div>

            <label className="field-lbl">Name</label>
            <input className="field" placeholder="Member name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

            <label className="field-lbl">Avatar</label>
            <div className="av-picker">
              {AVATARS.map((a) => (
                <button key={a} className={`av-opt${form.avatar === a ? " sel" : ""}`} onClick={() => setForm({ ...form, avatar: a })} aria-label={a}>
                  <img src={avatarSrc(a)} alt="" />
                </button>
              ))}
            </div>

            <label className="field-lbl">Troops — exact count</label>
            <div className="sheet-troops">
              <TroopField cls="inf" icon={TROOP_ICON.inf} label="Infantry" value={form.inf} onSet={(v) => setForm({ ...form, inf: v })} />
              <TroopField cls="cav" icon={TROOP_ICON.cav} label="Cavalry" value={form.cav} onSet={(v) => setForm({ ...form, cav: v })} />
              <TroopField cls="arch" icon={TROOP_ICON.arch} label="Archery" value={form.arch} onSet={(v) => setForm({ ...form, arch: v })} />
            </div>

            <div className="sheet-actions">
              <button className="btn-ghost" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn-gold" onClick={saveMember} disabled={!form.name.trim()}>Save member</button>
            </div>
            {form.mode === "edit" && <button className="sheet-remove" onClick={() => removeById(form.id, form.name)}>Remove from alliance</button>}
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

function Tile({ icon, label, value, pct, color }) {
  return (
    <div className="ttile">
      <div className="tt-head"><img src={icon} alt="" /><span className="k">{label}</span></div>
      <div className="tt-body">
        <div className="tt-val"><b>{fmt(value)}</b><small>{pct}%</small></div>
        <div className="tt-bar"><i style={{ width: `${pct}%`, background: color }}></i></div>
      </div>
    </div>
  );
}

function TChip({ cls, icon, value }) {
  return (
    <div className={`tchip ${cls}`}>
      <img src={icon} alt="" />
      <span className="rng">{fmt(value)}</span>
    </div>
  );
}

function TroopField({ cls, icon, label, value, onSet }) {
  return (
    <div className="st-row">
      <span className={`st-lbl ${cls}`}><img src={icon} alt="" />{label}</span>
      <div className="st-in">
        <input
          className="st-num"
          inputMode="numeric"
          value={value ? Number(value).toLocaleString("en-US") : ""}
          placeholder="0"
          onChange={(e) => onSet(parseInt(e.target.value.replace(/\D/g, ""), 10) || 0)}
          aria-label={`${label} count`}
        />
        <select className="st-preset" value="" onChange={(e) => { if (e.target.value) onSet(Number(e.target.value)); }} aria-label="Pick a range">
          <option value="">Range</option>
          {PRESETS.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
        </select>
      </div>
    </div>
  );
}
