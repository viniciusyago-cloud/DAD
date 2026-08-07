import React, { useState, useEffect } from "react";
import { BattlePlan, Phases, Buildings, Rules, Marches, HowWeWin, BattleCd } from "./TriBlocks.jsx";

/* ============================================================
   BLOCK RENDERER — draws any block from the registry.
   Used by both the public page and the editor preview.
   ============================================================ */

/* --- markdown-lite: **bold** *italic* [link](url) - lists --- */
function inline(s = "") {
  const out = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<strong key={m.index}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("[")) {
      const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(t);
      out.push(<a key={m.index} href={mm[2]} target="_blank" rel="noreferrer">{mm[1]}</a>);
    } else out.push(<em key={m.index}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

export function Rich({ children }) {
  const text = children || "";
  const lines = String(text).split("\n");
  const nodes = [];
  let list = null;
  lines.forEach((ln, i) => {
    const li = /^\s*[-•]\s+(.*)$/.exec(ln);
    if (li) { (list ||= []).push(<li key={i}>{inline(li[1])}</li>); return; }
    if (list) { nodes.push(<ul key={`u${i}`}>{list}</ul>); list = null; }
    if (ln.trim()) nodes.push(<p key={i}>{inline(ln)}</p>);
  });
  if (list) nodes.push(<ul key="ul-last">{list}</ul>);
  return <>{nodes}</>;
}

/* --- live countdown --- */
function Countdown({ target, label, done }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const end = target ? new Date(target).getTime() : 0;
  const diff = end - now;
  if (!target || Number.isNaN(end)) return <div className="cd-done">Defina a data do evento</div>;
  if (diff <= 0) return <div className="cd-done">{done || "Começou!"}</div>;
  const s = Math.floor(diff / 1000);
  const parts = [
    { v: Math.floor(s / 86400), l: "dias" },
    { v: Math.floor((s % 86400) / 3600), l: "horas" },
    { v: Math.floor((s % 3600) / 60), l: "min" },
    { v: s % 60, l: "seg" },
  ];
  return (
    <>
      {label && <div className="cd-label">{label}</div>}
      <div className="cd-grid">
        {parts.map((p) => (
          <div className="cd-cell" key={p.l}>
            <b>{String(p.v).padStart(2, "0")}</b><span>{p.l}</span>
          </div>
        ))}
      </div>
    </>
  );
}

const ytId = (u = "") => (/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{6,})/.exec(u) || [])[1];
const vimeoId = (u = "") => (/vimeo\.com\/(\d+)/.exec(u) || [])[1];

/* --- the renderer --- */
export default function BlockView({ b }) {
  const A = b._accent || "#ecc25a";
  const cls = `blk blk-${b.type} bg-${b._bg || "none"} pad-${b._pad || "md"} al-${b._align || "left"}`;
  const style = { "--a": A };

  const wrap = (inner) => <section className={cls} style={style}>{inner}</section>;

  /* specialised battle blocks bring their own markup + styles */
  switch (b.type) {
    case "battleplan": return <BattlePlan b={b} />;
    case "phases":     return <Phases b={b} />;
    case "buildings":  return <Buildings b={b} />;
    case "rules":      return <Rules b={b} />;
    case "marches":    return <Marches b={b} />;
    case "howwewin":   return <HowWeWin b={b} />;
    case "battlecd":   return <BattleCd b={b} />;
    default: break;
  }

  switch (b.type) {
    case "hero":
      return (
        <section className={`blk blk-hero al-${b._align || "center"}`} style={{ ...style, height: b.height || 280 }}>
          {b.image && <img className="hero-bg" src={b.image} alt="" />}
          <div className="hero-scrim" style={{ opacity: (b.overlay ?? 60) / 100 }} />
          <div className="hero-in">
            {b.eyebrow && <div className="hero-eyebrow">{b.eyebrow}</div>}
            {b.title && <h1 className="hero-title metal">{b.title}</h1>}
            {b.subtitle && <div className="hero-sub">{b.subtitle}</div>}
          </div>
        </section>
      );

    case "heading": {
      const T = b.level === "h1" ? "h1" : b.level === "h3" ? "h3" : "h2";
      return wrap(<T className={`hd ${b.level} ${b.metal ? "metal" : ""}`}>{b.text}</T>);
    }

    case "text":
      return wrap(<div className={`rich sz-${b.size || "md"}`}><Rich>{b.body}</Rich></div>);

    case "divider":
      return wrap(<div className={`divi divi-${b.style || "glow"}`} />);

    case "spacer":
      return <div style={{ height: b.height || 32 }} />;

    case "image":
      return wrap(
        <figure className={b.full ? "fig full" : "fig"}>
          {b.src ? <img src={b.src} alt={b.caption || ""} style={{ borderRadius: b.radius ?? 12 }} />
                 : <div className="ph">Sem imagem</div>}
          {b.caption && <figcaption>{b.caption}</figcaption>}
        </figure>,
      );

    case "gallery":
      return wrap(
        <div className="grid" style={{ "--c": b.cols || 2 }}>
          {(b.items || []).map((it, i) => (
            <figure className="fig" key={i}>
              {it.src ? <img src={it.src} alt={it.caption || ""} /> : <div className="ph">Imagem</div>}
              {it.caption && <figcaption>{it.caption}</figcaption>}
            </figure>
          ))}
        </div>,
      );

    case "video": {
      const y = ytId(b.url), v = vimeoId(b.url);
      return wrap(
        <figure className="fig">
          {y ? <div className="embed"><iframe src={`https://www.youtube.com/embed/${y}`} title="video"
                 allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture" allowFullScreen /></div>
           : v ? <div className="embed"><iframe src={`https://player.vimeo.com/video/${v}`} title="video" allowFullScreen /></div>
           : b.url ? <video src={b.url} controls playsInline style={{ width: "100%", borderRadius: 12 }} />
           : <div className="ph">Cole o link do vídeo</div>}
          {b.caption && <figcaption>{b.caption}</figcaption>}
        </figure>,
      );
    }

    case "countdown":
      return wrap(<div className="cd"><Countdown target={b.target} label={b.label} done={b.done} /></div>);

    case "kpis":
      return wrap(
        <div className="grid" style={{ "--c": b.cols || 3 }}>
          {(b.items || []).map((it, i) => (
            <div className="kpi" key={i} style={{ "--k": it.color || A }}>
              {it.icon && <img src={it.icon} alt="" />}
              <div className="kpi-v">{it.value}</div>
              <div className="kpi-l">{it.label}</div>
            </div>
          ))}
        </div>,
      );

    case "cards":
      return wrap(
        <div className="grid" style={{ "--c": b.cols || 2 }}>
          {(b.items || []).map((it, i) => {
            const inner = (
              <>
                {it.image && <img className="card-img" src={it.image} alt="" />}
                <div className="card-bd">
                  {it.badge && <span className="card-badge" style={{ "--k": it.color || A }}>{it.badge}</span>}
                  {it.title && <div className="card-t">{it.title}</div>}
                  {it.text && <div className="rich sz-sm"><Rich>{it.text}</Rich></div>}
                </div>
              </>
            );
            return it.link
              ? <a className="card" key={i} href={it.link} target="_blank" rel="noreferrer" style={{ "--k": it.color || A }}>{inner}</a>
              : <div className="card" key={i} style={{ "--k": it.color || A }}>{inner}</div>;
          })}
        </div>,
      );

    case "teams":
      return wrap(
        <div className="teams">
          {(b.items || []).map((t, i) => (
            <div className="team" key={i} style={{ "--k": t.color || A }}>
              <div className="team-logo">{t.logo ? <img src={t.logo} alt="" /> : (t.tag || t.name || "?").slice(0, 3)}</div>
              <div className="team-bd">
                <div className="team-n">{t.name}{t.tag && <span className="team-tag">{t.tag}</span>}</div>
                {t.note && <div className="team-note">{t.note}</div>}
              </div>
              {t.score !== "" && t.score != null && <div className="team-score">{t.score}</div>}
            </div>
          ))}
        </div>,
      );

    case "roster":
      return wrap(
        <div className="grid" style={{ "--c": b.cols || 2 }}>
          {(b.items || []).map((m, i) => (
            <div className="mem" key={i}>
              <div className="mem-av">{m.avatar ? <img src={m.avatar} alt="" /> : (m.name || "?").slice(0, 1)}</div>
              <div className="mem-bd">
                <div className="mem-n">{m.name}</div>
                {m.role && <div className="mem-r">{m.role}</div>}
                {m.note && <div className="mem-note">{m.note}</div>}
              </div>
            </div>
          ))}
        </div>,
      );

    case "timeline":
      return wrap(
        <div className="tl">
          {(b.items || []).map((it, i) => (
            <div className={`tl-i tl-${it.state || "next"}`} key={i}>
              <span className="tl-dot" />
              <div className="tl-bd">
                <div className="tl-h">{it.time && <span className="tl-time">{it.time}</span>}<span className="tl-t">{it.title}</span></div>
                {it.text && <div className="rich sz-sm"><Rich>{it.text}</Rich></div>}
              </div>
            </div>
          ))}
        </div>,
      );

    case "steps":
      return wrap(
        <div className="steps">
          {(b.items || []).map((it, i) => (
            <div className="step" key={i}>
              <div className="step-n">{i + 1}</div>
              <div className="step-bd">
                {it.title && <div className="step-t">{it.title}</div>}
                {it.text && <div className="rich sz-sm"><Rich>{it.text}</Rich></div>}
                {it.image && <img className="step-img" src={it.image} alt="" />}
              </div>
            </div>
          ))}
        </div>,
      );

    case "resources":
      return wrap(
        <div className="grid" style={{ "--c": b.cols || 4 }}>
          {(b.items || []).map((r, i) => (
            <div className="res" key={i} style={{ "--k": r.color || A }}>
              {r.icon ? <img src={r.icon} alt="" /> : <div className="res-ph" />}
              <div className="res-a">{r.amount}</div>
              <div className="res-n">{r.name}</div>
            </div>
          ))}
        </div>,
      );

    case "table": {
      const heads = String(b.headers || "").split(",").map((s) => s.trim()).filter(Boolean);
      return wrap(
        <div className="tbl-wrap">
          <table className="tbl">
            {heads.length > 0 && <thead><tr>{heads.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>}
            <tbody>
              {(b.rows || []).map((r, i) => (
                <tr key={i}>
                  {String(r.cells || "").split(",").map((c, j) => <td key={j}>{c.trim()}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
    }

    case "callout":
      return wrap(
        <div className={`callout co-${b.variant || "info"}`}>
          {b.title && <div className="co-t">{b.title}</div>}
          {b.text && <div className="rich sz-sm"><Rich>{b.text}</Rich></div>}
        </div>,
      );

    case "button":
      return wrap(
        <a className={`ebtn ebtn-${b.variant || "gold"}`} href={b.url || "#"}
           target={b.url ? "_blank" : undefined} rel="noreferrer">{b.label || "Botão"}</a>,
      );

    default:
      return wrap(<div className="ph">Bloco desconhecido: {b.type}</div>);
  }
}
