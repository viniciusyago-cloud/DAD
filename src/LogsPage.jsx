import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient.js";

/* ============================================================
   /dados — CHANGE LOG (audit history)
   Read-only view of every add / edit / remove, newest first.
   Link-only route; not linked from the board.
   ============================================================ */

const FIELD = {
  name: { label: "Name", kind: "text" },
  avatar: { label: "Avatar", kind: "text" },
  inf_count: { label: "Infantry", kind: "count", cls: "inf" },
  cav_count: { label: "Cavalry", kind: "count", cls: "cav" },
  arch_count: { label: "Archery", kind: "count", cls: "arch" },
};
const ORDER = ["name", "avatar", "inf_count", "cav_count", "arch_count"];

const fmt = (n) => {
  if (n === null || n === undefined || n === "") return "—";
  const v = Number(n);
  if (Number.isNaN(v)) return String(n);
  if (v >= 1e6) return `${parseFloat((v / 1e6).toFixed(2))}M`;
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return String(v);
};

const ACTION = {
  insert: { label: "Added", cls: "add" },
  update: { label: "Edited", cls: "edit" },
  delete: { label: "Removed", cls: "del" },
};

function relTime(iso) {
  const then = new Date(iso).getTime();
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
const fullTime = (iso) => new Date(iso).toLocaleString();

function Changes({ action, changes }) {
  if (action === "insert" || action === "delete") {
    const parts = ["inf_count", "cav_count", "arch_count"]
      .filter((k) => k in (changes || {}))
      .map((k) => (
        <span key={k} className={`chg-pill ${FIELD[k].cls}`}>{FIELD[k].label} {fmt(changes[k])}</span>
      ));
    return <div className="log-changes">{parts}</div>;
  }
  // update
  const keys = ORDER.filter((k) => changes && k in changes);
  return (
    <div className="log-changes">
      {keys.map((k) => {
        const f = FIELD[k];
        const { old: o, new: n } = changes[k];
        const isCount = f.kind === "count";
        return (
          <div key={k} className={`chg-row ${isCount ? f.cls : ""}`}>
            <span className="chg-field">{f.label}</span>
            <span className="chg-old">{isCount ? fmt(o) : (o ?? "—")}</span>
            <span className="chg-arrow">→</span>
            <span className="chg-new">{isCount ? fmt(n) : (n ?? "—")}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from("member_logs")
          .select("*")
          .order("at", { ascending: false })
          .limit(500);
        if (error) throw error;
        if (mounted) { setLogs(data || []); setLoading(false); }
      } catch (e) {
        console.error(e);
        if (mounted) { setError("Couldn't load the change log. Make sure migration_v3 has been run in Supabase."); setLoading(false); }
      }
    };
    fetchLogs();
    const channel = supabase
      .channel("member-logs-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "member_logs" }, () => fetchLogs())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="app logs">
      <header className="log-header">
        <div>
          <div className="eyebrow">BigDaddys · Alliance Command</div>
          <h1 className="log-title metal">Change Log</h1>
        </div>
        <a className="log-back" href="/">← Board</a>
      </header>

      {loading && <div className="empty">Loading history…</div>}
      {error && <div className="empty" style={{ color: "var(--arch)" }}>{error}</div>}

      {!loading && !error && logs.length === 0 && (
        <div className="empty">No changes recorded yet.</div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="log-list">
          {logs.map((l) => {
            const a = ACTION[l.action] || { label: l.action, cls: "edit" };
            return (
              <div className="log" key={l.id}>
                <span className={`log-dot ${a.cls}`}></span>
                <div className="log-body">
                  <div className="log-head">
                    <span className="log-name">{l.member_name || "Unknown"}</span>
                    <span className={`log-badge ${a.cls}`}>{a.label}</span>
                    <span className="log-time" title={fullTime(l.at)}>{relTime(l.at)}</span>
                  </div>
                  <Changes action={l.action} changes={l.changes} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="foot">Read-only audit trail · updates live. {logs.length} recent entries.</div>
    </div>
  );
}
