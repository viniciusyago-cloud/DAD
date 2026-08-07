import React, { useState, useEffect } from "react";
import { BattlePlan, Phases, Buildings, Rules, Marches, HowWeWin, BattleCd } from "./TriBlocks.jsx";
import Pic, { imgSrc, hasAnno } from "./imgedit/Pic.jsx";

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
  if (!target || Number.isNaN(end)) return <div className="cd-done">Set the event date</div>;
  if (diff <= 0) return <div className="cd-done">{done || "It has started!"}</div>;
  const s = Math.floor(diff / 1000);
  const parts = [
    { v: Math.floor(s / 86400), l: "days" },
    { v: Math.floor((s % 86400) / 3600), l: "hours" },
    { v: Math.floor((s % 3600) / 60), l: "min" },
    { v: s % 60, l: "sec" },
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


/* --- reveal on scroll --- */
function useReveal(enabled) {
  const ref = React.useRef(null);
  const [seen, setSeen] = React.useState(!enabled);
  React.useEffect(() => {
    if (!enabled || seen || !ref.current) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } },
      { rootMargin: "0px 0px -8% 0px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [enabled, seen]);
  return [ref, seen];
}

/* --- turn the _* style props into classes + inline vars --- */
const FONT_STACK = {
  display: "var(--font-display)",
  sans: "var(--font-sans)",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

function chrome(b) {
  const A = b._accent || "#ecc25a";
  const cls = [
    "blk", `blk-${b.type}`,
    `bg-${b._bg || "none"}`, `pad-${b._pad || "md"}`, `al-${b._align || "left"}`,
    `fr-${b._frame || "none"}`, `sh-${b._shadow || "none"}`, `sc-${b._scale || "md"}`,
    b._full ? "blk-full" : "",
    b._loop ? `lp-${b._loop}` : "",
  ].filter(Boolean);

  const style = {
    "--a": A,
    "--fr": b._frameColor || A,
    "--rad": `${b._radius ?? 14}px`,
    "--delay": `${b._animDelay || 0}ms`,
  };
  if (b._bg === "solid" && b._bgColor) style.background = b._bgColor;
  if (b._bg === "grad") style.background =
    `linear-gradient(${b._bgAngle ?? 180}deg, ${b._bgColor || A}, ${b._bgColor2 || "transparent"})`;

  return { cls: cls.join(" "), style, A };
}

function Title({ b }) {
  const text = b._title || b.label || "";
  if (!text && !imgSrc(b._titleIcon)) return null;
  const st = {
    color: b._titleColor || undefined,
    fontFamily: FONT_STACK[b._titleFont || "sans"],
    fontSize: b._titleSize ? `${b._titleSize}px` : undefined,
    fontWeight: b._titleWeight || undefined,
    textTransform: b._titleCase === "none" ? "none" : "uppercase",
    letterSpacing: b._titleTrack != null ? `${b._titleTrack / 100}em` : undefined,
    justifyContent: b._titleAlign === "center" ? "center" : b._titleAlign === "right" ? "flex-end" : "flex-start",
  };
  return (
    <div className={`blk-title${b._titleRule ? " has-rule" : ""}`} style={st}>
      {imgSrc(b._titleIcon) && <Pic v={b._titleIcon} alt="" />}
      {text && <span>{text}</span>}
    </div>
  );
}

/* --- the renderer --- */
const PANEL_BY_DEFAULT = new Set(["phases", "buildings", "rules", "marches", "howwewin", "battlecd", "squads"]);

export default function BlockView({ b }) {
  if (PANEL_BY_DEFAULT.has(b.type) && b._bg == null) b = { ...b, _bg: "panel" };
  const { cls, style, A } = chrome(b);
  const [ref, seen] = useReveal(!!b._anim);
  const animCls = b._anim ? (seen ? ` rv rv-${b._anim} in` : ` rv rv-${b._anim}`) : "";

  const wrap = (inner) => (
    <section ref={ref} className={cls + animCls} style={style}>
      {imgSrc(b._bgImage) && (b._bg === "image") && (
        <>
          <Pic v={b._bgImage} className="blk-bgimg" fit="fill" alt="" />
          <span className="blk-bgdim" style={{ opacity: (b._bgDim ?? 45) / 100 }} />
        </>
      )}
      <div className="blk-in">
        <Title b={b} />
        {inner}
      </div>
    </section>
  );

  /* battleplan is a composite of several sections — it keeps its own markup */
  if (b.type === "battleplan") return <BattlePlan b={b} />;

  switch (b.type) {
    case "phases":    return wrap(<Phases b={b} />);
    case "buildings": return wrap(<Buildings b={b} />);
    case "rules":     return wrap(<Rules b={b} />);
    case "marches":   return wrap(<Marches b={b} />);
    case "howwewin":  return wrap(<HowWeWin b={b} />);
    case "battlecd":  return wrap(<BattleCd b={b} />);
    default: break;
  }

  switch (b.type) {
    case "hero":
      return (
        <section className={`blk blk-hero al-${b._align || "center"}`} style={{ ...style, height: b.height || 280 }}>
          {imgSrc(b.image) && <Pic v={b.image} className="hero-bg" fit="fill" alt="" />}
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
          {imgSrc(b.src)
            ? <Pic v={b.src} alt={b.caption || ""}
                   style={{ display: "block", width: "100%", borderRadius: b.radius ?? 12 }} />
            : <div className="ph">No image</div>}
          {b.caption && <figcaption>{b.caption}</figcaption>}
        </figure>,
      );

    case "gallery":
      return wrap(
        <div className="grid" style={{ "--c": b.cols || 2 }}>
          {(b.items || []).map((it, i) => (
            <figure className="fig" key={i}>
              {imgSrc(it.src)
                ? <Pic v={it.src} alt={it.caption || ""} style={{ display: "block", width: "100%", borderRadius: 10 }} />
                : <div className="ph">Image</div>}
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
           : <div className="ph">Paste a video link</div>}
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
              {imgSrc(it.icon) && <Pic v={it.icon} alt="" />}
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
                {imgSrc(it.image) && <Pic v={it.image} className="card-img" alt="" />}
                <div className="card-bd">
                  {it.badge && <span className="card-badge" style={{ "--k": it.color || A }}>{it.badge}</span>}
                  {it.title && <div className="card-t">{it.title}</div>}
                  {it.text && <div className="rich sz-sm"><Rich>{it.text}</Rich></div>}
                </div>
              </>
            );
            const ccls = `card fr-${it.frame || "none"}${it.featured ? " feat" : ""}${it.anim ? ` lp-${it.anim}` : ""}`;
            const cst = { "--k": it.color || A, "--fr": it.color || A,
              background: it.bg || undefined };
            return it.link
              ? <a className={ccls} key={i} href={it.link} target="_blank" rel="noreferrer" style={cst}>{inner}</a>
              : <div className={ccls} key={i} style={cst}>{inner}</div>;
          })}
        </div>,
      );

    case "teams":
      return wrap(
        <div className="teams">
          {(b.items || []).map((t, i) => (
            <div className="team" key={i} style={{ "--k": t.color || A }}>
              <div className="team-logo">{imgSrc(t.logo) ? <Pic v={t.logo} fit="fill" alt="" /> : (t.tag || t.name || "?").slice(0, 3)}</div>
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
              <div className="mem-av">{imgSrc(m.avatar) ? <Pic v={m.avatar} fit="fill" alt="" /> : (m.name || "?").slice(0, 1)}</div>
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
                {imgSrc(it.image) && <Pic v={it.image} className="step-img" alt=""
                    style={{ display: "block", width: "100%", marginTop: 8, borderRadius: 10 }} />}
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
              {imgSrc(r.icon) ? <Pic v={r.icon} alt="" /> : <div className="res-ph" />}
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

    case "group":
      return wrap(
        <div className={(b.cols || 1) > 1 ? "grid" : "stack"} style={{ "--c": b.cols || 1 }}>
          {(b.children || []).map((ch) => <BlockView key={ch.id} b={ch} />)}
          {(b.children || []).length === 0 && <div className="ph">Empty section</div>}
        </div>,
      );

    case "squads":
      return wrap(
        <div className={(b.cols || 1) > 1 ? "grid" : "stack"} style={{ "--c": b.cols || 1 }}>
          {(b.items || []).map((sq, i) => (
            <div className={`squad sq-${sq.kind || "mixed"}`} key={i}>
              <div className="squad-h">
                <span className="squad-t">{sq.title}</span>
                <span className="squad-k">{sq.kind === "attack" ? "Attack" : sq.kind === "defense" ? "Defense" : "Mixed"}</span>
              </div>
              {sq.note && <div className="squad-n">{sq.note}</div>}
              <div className="squad-hs">
                {(sq.heroes || []).map((h, j) => (
                  <div className="hero" key={j}>
                    <div className="hero-av">
                      {imgSrc(h.icon) ? <Pic v={h.icon} fit="fill" alt="" /> : <span>{(h.name || "?").slice(0, 1)}</span>}
                    </div>
                    {h.name && <div className="hero-n">{h.name}</div>}
                    {h.role && <div className="hero-r">{h.role}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>,
      );

    default:
      return wrap(<div className="ph">Unknown block: {b.type}</div>);
  }
}
