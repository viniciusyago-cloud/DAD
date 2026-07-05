import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabaseClient.js";

/* ============================================================
   DAD — TROOPS INTELLIGENCE BOARD (Vercel + Supabase)
   Public shared board. Anyone with the link can view and edit.
   Realtime sync via Supabase channels — edits appear live for
   every open device.
   ============================================================ */

const gold = "#c9a94a";
const goldLt = "#e6c86a";
const goldDk = "#8a7226";
const bg = "#0f0a04";
const panel = "#1a1208";
const panelLt = "#221a0f";
const border = "#3a2d18";
const borderLt = "#4a3a1e";
const text = "#f4ecd9";
const textDim = "#a8966f";
const textMute = "#7d6c48";
const archColor = "#c9a94a";
const cavColor = "#b08560";
const infColor = "#8a9a6a";

const RANGES = [
  { key: "-", label: "—", mid: 0 },
  { key: "<200", label: "< 200k", mid: 150 },
  { key: "200-300", label: "200–300k", mid: 250 },
  { key: "300-400", label: "300–400k", mid: 350 },
  { key: "400-500", label: "400–500k", mid: 450 },
  { key: "500-600", label: "500–600k", mid: 550 },
  { key: "600-700", label: "600–700k", mid: 650 },
  { key: "700-800", label: "700–800k", mid: 750 },
  { key: ">800", label: "> 800k", mid: 850 },
];

const midOf = (k) => RANGES.find((r) => r.key === k)?.mid ?? 0;

const classify = (inf, cav, arc) => {
  if (inf === "-" || cav === "-" || arc === "-") return "Incomplete";
  const i = midOf(inf), c = midOf(cav), a = midOf(arc);
  const max = Math.max(i, c, a);
  const min = Math.min(i, c, a);
  if (max - min === 0) return "Balanced";
  if (a > i && a > c) return a - Math.max(i, c) >= 100 ? "Archer" : "Arch-lean";
  if (c > i && c > a) return "Cavalry";
  if (i > c && i > a) return "Infantry";
  return "Balanced";
};

const profileColor = (p) => {
  if (p === "Archer") return "#d97a4a";
  if (p === "Arch-lean") return "#c9a94a";
  if (p === "Balanced") return "#8a9a6a";
  if (p === "Cavalry") return "#b08560";
  if (p === "Infantry") return "#8a9a6a";
  return "#6a5a3a";
};

export default function App() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [sortBy, setSortBy] = useState("total");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("connecting"); // connecting | live | offline | saving
  const [toast, setToast] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", power: "", inf: "-", cav: "-", arc: "-" });

  // Initial fetch + realtime subscription
  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      try {
        const { data, error } = await supabase
          .from("members")
          .select("*")
          .order("power", { ascending: false });
        if (error) throw error;
        if (mounted) {
          setMembers(data || []);
          setLoading(false);
          setStatus("live");
        }
      } catch (e) {
        console.error(e);
        if (mounted) {
          setErrorMsg(
            "Could not connect to the database. Check your Supabase env vars and the SQL init script.",
          );
          setLoading(false);
          setStatus("offline");
        }
      }
    };

    fetchAll();

    // Realtime — refetch whenever any change happens
    const channel = supabase
      .channel("members-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members" },
        () => fetchAll(),
      )
      .subscribe((s) => {
        if (s === "SUBSCRIBED" && mounted) setStatus("live");
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }, []);

  // Update a single field (optimistic + server)
  const updateMember = async (id, field, value) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
    setStatus("saving");
    try {
      const { error } = await supabase.from("members").update({ [field]: value }).eq("id", id);
      if (error) throw error;
      setStatus("live");
    } catch (e) {
      console.error(e);
      showToast("Save failed — retrying next edit");
      setStatus("offline");
    }
  };

  const removeMember = async (id, name) => {
    if (!confirm(`Remove ${name}?`)) return;
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setStatus("saving");
    try {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
      setStatus("live");
      showToast("Member removed");
    } catch (e) {
      console.error(e);
      showToast("Remove failed");
      setStatus("offline");
    }
  };

  const addMember = async () => {
    if (!newMember.name.trim()) return;
    const power = parseFloat(newMember.power) || 0;
    const payload = {
      name: newMember.name.trim(),
      power,
      inf: newMember.inf,
      cav: newMember.cav,
      arc: newMember.arc,
    };
    setStatus("saving");
    try {
      const { data, error } = await supabase.from("members").insert(payload).select().single();
      if (error) throw error;
      setMembers((prev) => [...prev, data]);
      setNewMember({ name: "", power: "", inf: "-", cav: "-", arc: "-" });
      setShowAdd(false);
      showToast("Member added");
      setStatus("live");
    } catch (e) {
      console.error(e);
      showToast("Add failed");
      setStatus("offline");
    }
  };

  const refresh = async () => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("power", { ascending: false });
      if (error) throw error;
      setMembers(data || []);
      showToast("Refreshed");
      setStatus("live");
    } catch (e) {
      showToast("Refresh failed");
    }
  };

  const rows = useMemo(() => {
    return members.map((m) => {
      const total = midOf(m.inf) + midOf(m.cav) + midOf(m.arc);
      const profile = classify(m.inf, m.cav, m.arc);
      return { ...m, total, profile };
    });
  }, [members]);

  const view = useMemo(() => {
    let v = rows;
    if (filter === "archer") v = v.filter((r) => r.profile === "Archer" || r.profile === "Arch-lean");
    if (filter === "balanced") v = v.filter((r) => r.profile === "Balanced");
    if (filter === "top") v = v.filter((r) => Number(r.power) >= 130);
    if (filter === "incomplete") v = v.filter((r) => r.profile === "Incomplete");
    if (search.trim()) {
      const q = search.toLowerCase();
      v = v.filter((r) => r.name.toLowerCase().includes(q));
    }
    v = [...v].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "power") return Number(b.power) - Number(a.power);
      if (sortBy === "profile") return a.profile.localeCompare(b.profile);
      return b.total - a.total;
    });
    return v;
  }, [rows, filter, search, sortBy]);

  const stats = useMemo(() => {
    const total = rows.length;
    const totalInf = rows.reduce((s, r) => s + midOf(r.inf), 0);
    const totalCav = rows.reduce((s, r) => s + midOf(r.cav), 0);
    const totalArc = rows.reduce((s, r) => s + midOf(r.arc), 0);
    const balanced = rows.filter((r) => r.profile === "Balanced").length;
    const archer = rows.filter((r) => r.profile === "Archer" || r.profile === "Arch-lean").length;
    return { total, totalInf, totalCav, totalArc, balanced, archer };
  }, [rows]);

  if (loading) {
    return (
      <div style={styles.root}>
        <div style={styles.loadingCard}>
          <div style={styles.eyebrow}>Alliance Command</div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "Georgia, serif" }}>Loading intel…</div>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={styles.root}>
        <div style={styles.loadingCard}>
          <div style={{ fontSize: 12, color: "#e07a5a", fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>
            CONNECTION ERROR
          </div>
          <div style={{ fontSize: 14, color: text, lineHeight: 1.6 }}>{errorMsg}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <style>{`
        .dad-select {
          background: ${panel};
          color: ${text};
          border: 1px solid ${border};
          border-radius: 6px;
          padding: 6px 8px;
          font-size: 13px;
          font-family: inherit;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          -webkit-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%23c9a94a' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 8px center;
          padding-right: 24px;
        }
        .dad-select:focus { outline: none; border-color: ${gold}; }
        .dad-input {
          background: ${panel};
          color: ${text};
          border: 1px solid ${border};
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          font-family: inherit;
          width: 100%;
        }
        .dad-input:focus { outline: none; border-color: ${gold}; }
        .dad-input::placeholder { color: ${textMute}; }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <svg viewBox="0 0 100 120" width="42" height="52" style={{ filter: `drop-shadow(0 4px 12px ${gold}44)`, flexShrink: 0 }}>
            <defs>
              <linearGradient id="crestG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={goldLt} />
                <stop offset="0.5" stopColor={gold} />
                <stop offset="1" stopColor={goldDk} />
              </linearGradient>
            </defs>
            <path d="M50 5 L90 20 L90 65 Q90 95 50 115 Q10 95 10 65 L10 20 Z"
              fill="url(#crestG)" stroke={goldDk} strokeWidth="1.5" />
            <path d="M50 15 L82 27 L82 63 Q82 88 50 105 Q18 88 18 63 L18 27 Z"
              fill="none" stroke={bg} strokeWidth="1" opacity="0.5" />
            <text x="50" y="68" textAnchor="middle" fill={bg}
              fontSize="26" fontWeight="900" fontFamily="Georgia, serif"
              letterSpacing="1">DAD</text>
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.eyebrow}>Alliance Command</div>
            <h1 style={styles.title}>Troops Intel</h1>
          </div>
          <button style={styles.statusPill(status)} onClick={refresh} title="Refresh">
            <span style={styles.dot(status)}></span>
            {status === "live" ? "LIVE" : status === "saving" ? "SYNC" : status === "connecting" ? "…" : "OFF"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <StatBox label="Members" value={stats.total} accent={gold} />
        <StatBox label="Balanced" value={stats.balanced} accent="#8a9a6a" />
        <StatBox label="Archers" value={stats.archer} accent="#d97a4a" />
        <StatBox label="Total Arch" value={`~${(stats.totalArc / 1000).toFixed(1)}M`} accent={archColor} highlight />
        <StatBox label="Total Cav" value={`~${(stats.totalCav / 1000).toFixed(1)}M`} accent={cavColor} />
        <StatBox label="Total Inf" value={`~${(stats.totalInf / 1000).toFixed(1)}M`} accent={infColor} />
      </div>

      {/* Search */}
      <div style={{ marginBottom: 10 }}>
        <input
          className="dad-input"
          placeholder="🔍 Search member..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div style={styles.filterRow}>
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>All · {rows.length}</FilterChip>
        <FilterChip active={filter === "top"} onClick={() => setFilter("top")}>🐋 Whales</FilterChip>
        <FilterChip active={filter === "archer"} onClick={() => setFilter("archer")}>🏹 Archers</FilterChip>
        <FilterChip active={filter === "balanced"} onClick={() => setFilter("balanced")}>⚖️ Balanced</FilterChip>
        <FilterChip active={filter === "incomplete"} onClick={() => setFilter("incomplete")}>❓ Incomplete</FilterChip>
      </div>

      {/* Sort */}
      <div style={styles.sortRow}>
        <span style={styles.sortLabel}>Sort by:</span>
        <SortChip active={sortBy === "total"} onClick={() => setSortBy("total")}>Total</SortChip>
        <SortChip active={sortBy === "power"} onClick={() => setSortBy("power")}>Power</SortChip>
        <SortChip active={sortBy === "name"} onClick={() => setSortBy("name")}>Name</SortChip>
        <SortChip active={sortBy === "profile"} onClick={() => setSortBy("profile")}>Profile</SortChip>
      </div>

      {/* Add */}
      {!showAdd ? (
        <button style={styles.addBtn} onClick={() => setShowAdd(true)}>
          + Add new member
        </button>
      ) : (
        <div style={styles.addForm}>
          <div style={styles.addFormTitle}>New member</div>
          <input
            className="dad-input"
            placeholder="Member name"
            value={newMember.name}
            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
          />
          <input
            className="dad-input"
            placeholder="Power (M) — e.g. 95.4"
            value={newMember.power}
            onChange={(e) => setNewMember({ ...newMember, power: e.target.value })}
            inputMode="decimal"
          />
          <div style={styles.addFormLabel}>Infantry</div>
          <RangeSelect value={newMember.inf} onChange={(v) => setNewMember({ ...newMember, inf: v })} />
          <div style={styles.addFormLabel}>Cavalry</div>
          <RangeSelect value={newMember.cav} onChange={(v) => setNewMember({ ...newMember, cav: v })} />
          <div style={styles.addFormLabel}>Archery</div>
          <RangeSelect value={newMember.arc} onChange={(v) => setNewMember({ ...newMember, arc: v })} />
          <div style={styles.addFormBtns}>
            <button style={styles.btnGhost} onClick={() => setShowAdd(false)}>Cancel</button>
            <button style={styles.btnPrimary} onClick={addMember}>Save member</button>
          </div>
        </div>
      )}

      {/* Cards */}
      <div style={styles.cardsList}>
        {view.map((r) => (
          <div key={r.id} style={styles.card}>
            <div style={styles.cardHead}>
              <div style={styles.cardName}>{r.name}</div>
              <button style={styles.btnX} onClick={() => removeMember(r.id, r.name)} title="Remove">×</button>
            </div>
            <div style={styles.cardMeta}>
              <span style={styles.cardPower}>{Number(r.power).toFixed(1)}M</span>
              <span style={{
                ...styles.badge,
                background: profileColor(r.profile) + "22",
                color: profileColor(r.profile),
                border: `1px solid ${profileColor(r.profile)}55`,
              }}>
                {r.profile}
              </span>
            </div>

            <div style={styles.divider}></div>

            <div style={styles.troopRow}>
              <span style={{ ...styles.troopLabel, color: infColor }}>🛡️ Inf.</span>
              <div style={{ flex: 1 }}>
                <RangeSelect value={r.inf} onChange={(v) => updateMember(r.id, "inf", v)} />
              </div>
            </div>
            <div style={styles.troopRow}>
              <span style={{ ...styles.troopLabel, color: cavColor }}>🏇 Cav.</span>
              <div style={{ flex: 1 }}>
                <RangeSelect value={r.cav} onChange={(v) => updateMember(r.id, "cav", v)} />
              </div>
            </div>
            <div style={styles.troopRow}>
              <span style={{ ...styles.troopLabel, color: archColor }}>🏹 Arch.</span>
              <div style={{ flex: 1 }}>
                <RangeSelect value={r.arc} onChange={(v) => updateMember(r.id, "arc", v)} />
              </div>
            </div>

            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>Total troops</span>
              <span style={styles.totalValue}>~{r.total}k</span>
            </div>
          </div>
        ))}
        {view.length === 0 && (
          <div style={styles.empty}>No members match this filter.</div>
        )}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.foot}>
          Every edit auto-syncs live to all devices. Tap the LIVE badge to force-refresh.
        </div>
      </div>

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}

function RangeSelect({ value, onChange }) {
  return (
    <select className="dad-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {RANGES.map((r) => (
        <option key={r.key} value={r.key}>{r.label}</option>
      ))}
    </select>
  );
}

function StatBox({ label, value, accent, highlight }) {
  return (
    <div style={{
      ...styles.statBox,
      borderColor: highlight ? accent : border,
      background: highlight ? `linear-gradient(180deg, ${accent}18, ${panel})` : panel,
    }}>
      <div style={{ ...styles.statLabel, color: accent }}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 12px",
        fontSize: 12,
        fontWeight: 700,
        color: active ? bg : textDim,
        background: active ? `linear-gradient(180deg, ${goldLt}, ${gold})` : "transparent",
        border: `1px solid ${active ? gold : border}`,
        borderRadius: 20,
        cursor: "pointer",
        letterSpacing: "0.3px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function SortChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 10px",
        fontSize: 11,
        fontWeight: 600,
        color: active ? goldLt : textMute,
        background: active ? panelLt : "transparent",
        border: `1px solid ${active ? borderLt : border}`,
        borderRadius: 6,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: `radial-gradient(ellipse at top, #1a1208 0%, ${bg} 60%)`,
    color: text,
    padding: "16px 12px 40px",
    maxWidth: 500,
    margin: "0 auto",
  },
  loadingCard: {
    padding: "40px 24px",
    textAlign: "center",
    background: panel,
    border: `1px solid ${border}`,
    borderRadius: 14,
    marginTop: 40,
  },
  header: {
    background: `linear-gradient(180deg, ${panelLt}, ${panel})`,
    border: `1px solid ${border}`,
    borderRadius: 14,
    padding: "14px 14px",
    marginBottom: 14,
    boxShadow: `inset 0 1px 0 ${borderLt}, 0 4px 20px #0006`,
  },
  headerTop: { display: "flex", alignItems: "center", gap: 12 },
  eyebrow: {
    fontSize: 10, fontWeight: 700, color: gold,
    letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 2,
  },
  title: {
    fontSize: 22, fontWeight: 800, color: text, margin: 0,
    fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: "-0.5px",
  },
  statusPill: (s) => ({
    display: "flex", alignItems: "center", gap: 5,
    padding: "5px 9px", fontSize: 9, fontWeight: 800, letterSpacing: "0.8px",
    color: s === "live" ? "#8fd97a" : s === "saving" ? goldLt : s === "connecting" ? textDim : "#e07a5a",
    background: s === "live" ? "#1a2a1a" : s === "saving" ? "#2a2013" : s === "connecting" ? "#181208" : "#2a1010",
    border: `1px solid ${s === "live" ? "#3a5a3a" : s === "saving" ? borderLt : s === "connecting" ? border : "#5a2020"}`,
    borderRadius: 20, flexShrink: 0, cursor: "pointer",
  }),
  dot: (s) => ({
    width: 5, height: 5, borderRadius: "50%",
    background: s === "live" ? "#8fd97a" : s === "saving" ? goldLt : s === "connecting" ? textDim : "#e07a5a",
    boxShadow: s === "live" ? "0 0 6px #8fd97a" : "none",
  }),
  statsRow: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14,
  },
  statBox: { padding: "10px 12px", border: `1px solid ${border}`, borderRadius: 10 },
  statLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: "1.2px",
    textTransform: "uppercase", marginBottom: 3,
  },
  statValue: {
    fontSize: 20, fontWeight: 800, color: text, fontFamily: 'Georgia, serif',
  },
  filterRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  sortRow: {
    display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14, alignItems: "center",
  },
  sortLabel: { fontSize: 11, color: textMute, fontWeight: 600, letterSpacing: "0.5px" },
  addBtn: {
    width: "100%", padding: "12px", fontSize: 13, fontWeight: 700, color: gold,
    background: panel, border: `1.5px dashed ${gold}55`, borderRadius: 10, cursor: "pointer",
    marginBottom: 14, letterSpacing: "0.3px",
  },
  addForm: {
    display: "flex", flexDirection: "column", gap: 10, padding: 14,
    background: panelLt, border: `1.5px solid ${gold}`, borderRadius: 12,
    marginBottom: 14, boxShadow: `0 0 30px ${gold}22`,
  },
  addFormTitle: {
    fontSize: 12, fontWeight: 800, color: gold, letterSpacing: "1.5px",
    textTransform: "uppercase", marginBottom: 4,
  },
  addFormLabel: {
    fontSize: 11, fontWeight: 700, color: textDim, letterSpacing: "0.5px",
    marginTop: 4, marginBottom: -4, textTransform: "uppercase",
  },
  addFormBtns: { display: "flex", gap: 8, marginTop: 6 },
  btnPrimary: {
    flex: 1, padding: "12px", fontSize: 13, fontWeight: 700, color: bg,
    background: `linear-gradient(180deg, ${goldLt}, ${gold})`, border: "none",
    borderRadius: 8, cursor: "pointer", letterSpacing: "0.3px",
  },
  btnGhost: {
    flex: 1, padding: "12px", fontSize: 13, fontWeight: 600, color: textMute,
    background: "transparent", border: `1px solid ${border}`, borderRadius: 8, cursor: "pointer",
  },
  btnX: {
    width: 30, height: 30, fontSize: 17, fontWeight: 700, color: "#b07a6a",
    background: "#241410", border: "1px solid #4a2a22", borderRadius: 6,
    cursor: "pointer", lineHeight: 1, flexShrink: 0,
  },
  cardsList: { display: "flex", flexDirection: "column", gap: 10 },
  card: {
    background: panel, border: `1px solid ${border}`, borderRadius: 12,
    padding: 12, boxShadow: `inset 0 1px 0 ${borderLt}88`,
  },
  cardHead: {
    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    gap: 8, marginBottom: 4,
  },
  cardName: {
    fontSize: 15, fontWeight: 700, color: text, flex: 1, minWidth: 0,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  cardMeta: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  cardPower: { fontSize: 13, fontWeight: 700, color: goldLt, fontFamily: 'Georgia, serif' },
  badge: {
    display: "inline-block", padding: "3px 10px", fontSize: 10, fontWeight: 700,
    borderRadius: 12, letterSpacing: "0.3px",
  },
  divider: {
    height: 1,
    background: `linear-gradient(90deg, transparent, ${border}, transparent)`,
    marginBottom: 10,
  },
  troopRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  troopLabel: {
    fontSize: 12, fontWeight: 700, letterSpacing: "0.3px", width: 70, flexShrink: 0,
  },
  totalRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginTop: 10, paddingTop: 10, borderTop: `1px solid ${border}88`,
  },
  totalLabel: {
    fontSize: 11, fontWeight: 700, color: textDim,
    letterSpacing: "1px", textTransform: "uppercase",
  },
  totalValue: {
    fontSize: 16, fontWeight: 800, color: goldLt, fontFamily: 'Georgia, serif',
  },
  empty: {
    padding: "40px 20px", textAlign: "center", color: textMute, fontSize: 13,
    background: panel, border: `1px dashed ${border}`, borderRadius: 12,
  },
  footer: { marginTop: 20 },
  foot: {
    marginTop: 12, fontSize: 10.5, color: textMute, textAlign: "center", lineHeight: 1.6,
  },
  toast: {
    position: "fixed", left: "50%", bottom: 20, transform: "translateX(-50%)",
    background: "#2a2013", color: text, padding: "10px 18px", borderRadius: 20,
    fontSize: 12, fontWeight: 600, border: `1px solid ${gold}66`,
    boxShadow: "0 8px 30px #000a", animation: "rise .2s ease", zIndex: 50,
  },
};
