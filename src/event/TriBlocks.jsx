import React, { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Rich } from "./BlockView.jsx";
import Pic, { imgSrc } from "./imgedit/Pic.jsx";

/* ============================================================
   SPECIALISED TRI-ALLIANCE BLOCKS
   Same visuals as the hand-built page, but every value comes
   from editable block data instead of hardcoded constants.
   Reuses the existing .ta-* styles.
   ============================================================ */

/* ---------- helpers ---------- */
export const splitList = (s) =>
  String(s || "").split(/[,\n]/).map((x) => x.trim()).filter(Boolean);

const G = ({ d, color = "var(--gold)", size = 20, sw = 2 }) => (
  <svg className="gi" width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
export const ICONS = {
  sword: (p) => <G {...p} d={<><path d="M14.5 3.5 20 3l-.5 5.5L8 20l-4-4L15.5 4.5z" /><path d="m5 13 6 6M4 20l-1 1" /></>} />,
  shield: (p) => <G {...p} d={<path d="M12 3l7 2.5V11c0 4.5-3 7.5-7 9.5-4-2-7-5-7-9.5V5.5L12 3z" />} />,
  flag: (p) => <G {...p} d={<><path d="M5 21V4" /><path d="M5 4c4-2 8 2 14 0v9c-6 2-10-2-14 0" /></>} />,
  coins: (p) => <G {...p} d={<><circle cx="9" cy="9" r="5.5" /><path d="M15.5 8a5.5 5.5 0 1 1-6.9 6.9" /></>} />,
  bolt: (p) => <G {...p} d={<path d="M13 2 5 13.5h5L10 22l8-11.5h-5L13 2z" />} />,
  back: (p) => <G {...p} d={<><path d="M9 14 4 9l5-5" /><path d="M4 9h9a6 6 0 1 1 0 12h-3" /></>} />,
  heal: (p) => <G {...p} d={<><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M12 8v8M8 12h8" /></>} />,
  block: (p) => <G {...p} d={<><circle cx="12" cy="12" r="8.5" /><path d="m6.5 6.5 11 11" /></>} />,
  portal: (p) => <G {...p} d={<><ellipse cx="12" cy="17.5" rx="8" ry="3" /><path d="M12 14V4M12 4l-3.5 3.5M12 4l3.5 3.5" /></>} />,
  chat: (p) => <G {...p} d={<path d="M20 12a8 8 0 1 0-3.5 6.6L20 20l-.8-3.6A8 8 0 0 0 20 12z" />} />,
  clock: (p) => <G {...p} d={<><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5.5l3.5 2" /></>} />,
  star: (p) => <G {...p} d={<path d="m12 3 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.4l6-.8L12 3z" />} />,
};
export const ICON_OPTIONS = Object.keys(ICONS).map((k) => ({ v: k, l: k }));

const Tag = ({ children, color }) => (
  <span className="ta-tag" style={color ? { color, boxShadow: `inset 0 0 0 1px ${color}55` } : undefined}>{children}</span>
);

/* ---------- battle plan: search + legend + map + lane cards ---------- */
function Markers({ nodes, capture, defend, entry }) {
  const at = (b) => nodes[b];
  return (
    <g>
      {entry.filter(at).map((b) => {
        const [x, y] = at(b);
        return (
          <g key={b}>
            <rect x={x - 11} y={y - 11} width="22" height="22" transform={`rotate(45 ${x} ${y})`} fill="#0d1218" opacity="0.7" />
            <rect x={x - 8} y={y - 8} width="16" height="16" transform={`rotate(45 ${x} ${y})`} fill="none" stroke="#f2824a" strokeWidth="3.5" />
          </g>
        );
      })}
      {capture.filter(at).map((b) => {
        const [x, y] = at(b);
        return (
          <g key={b} stroke="#f0564e" strokeWidth="4.5" fill="none">
            <circle cx={x} cy={y} r="19" />
            <path d={`M${x},${y - 27} v9 M${x},${y + 18} v9 M${x - 27},${y} h9 M${x + 18},${y} h9`} />
          </g>
        );
      })}
      {defend.filter(at).map((b) => {
        const [x, y] = at(b);
        return <path key={b} d={`M${x},${y - 46} l17,7 v13 q0,14 -17,23 q-17,-9 -17,-23 v-13 z`}
                     fill="#ecc25a" fillOpacity="0.92" stroke="#0d1218" strokeWidth="3" />;
      })}
    </g>
  );
}

function Route({ t, nodes, uid }) {
  const segs = (t.segs || []).map((s) => splitList(s.path).filter((b) => nodes[b])).filter((s) => s.length > 1);
  if (!segs.length) return null;
  const all = [...new Set(segs.flat())];
  const start = segs[0][0];
  const flags = splitList(t.flags).filter((f) => nodes[f]);
  return (
    <g>
      {segs.map((seg, i) => {
        const pts = seg.map((b) => nodes[b].join(",")).join(" ");
        return (
          <g key={i}>
            <polyline points={pts} fill="none" stroke="#0d1218" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
            <polyline points={pts} fill="none" stroke={t.color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" markerMid={`url(#arr${uid}${t._i})`} />
            <polyline className="ta-flow" points={pts} fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 42" opacity="0.8" />
          </g>
        );
      })}
      {all.map((b) => <circle key={b} cx={nodes[b][0]} cy={nodes[b][1]} r="6.5" fill={t.color} stroke="#0d1218" strokeWidth="2.5" />)}
      <circle cx={nodes[start][0]} cy={nodes[start][1]} r="19" fill={t.color} stroke="#0d1218" strokeWidth="3.5" />
      <text x={nodes[start][0]} y={nodes[start][1] + 8} textAnchor="middle" className="ta-startn">{t._i + 1}</text>
      {flags.map((f) => (
        <g key={f} transform={`translate(${nodes[f][0]}, ${nodes[f][1]})`}>
          <line x1="0" y1="0" x2="0" y2="-38" stroke="#0d1218" strokeWidth="6.5" strokeLinecap="round" />
          <line x1="0" y1="0" x2="0" y2="-38" stroke="#f4ecda" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M0 -38 L27 -31 L0 -24 Z" fill={t.color} stroke="#0d1218" strokeWidth="2" />
        </g>
      ))}
    </g>
  );
}

function LaneMap({ t, nodes, map, mapW, mapH, capture, defend, entry }) {
  const used = (t.segs || []).flatMap((s) => splitList(s.path)).filter((b) => nodes[b]);
  const extra = splitList(t.extraView).filter((b) => nodes[b]);
  const pts = [...used, ...extra].map((b) => nodes[b]);
  if (!pts.length) return null;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.max(0, Math.min(...xs) - 100), y0 = Math.max(0, Math.min(...ys) - 130);
  const x1 = Math.min(mapW, Math.max(...xs) + 100), y1 = Math.min(mapH, Math.max(...ys) + 90);
  return (
    <svg className="ta-lanemap" viewBox={`${x0} ${y0} ${x1 - x0} ${y1 - y0}`}
         style={{ boxShadow: `0 0 0 1.5px ${t.color}66` }} aria-label={`Route map ${t.team}`}>
      <image href={map} x="0" y="0" width={mapW} height={mapH} />
      <defs>
        <marker id={`arrlane${t._i}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="2.6" markerHeight="2.6"
                orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0 0 L10 5 L0 10 z" fill={t.color} /></marker>
      </defs>
      <Route t={t} nodes={nodes} uid="lane" />
      <Markers nodes={nodes} capture={capture} defend={defend} entry={entry} />
    </svg>
  );
}

function TeamCard({ r, nodes, map, mapW, mapH, capture, defend, entry }) {
  const attackers = splitList(r.attackers), defenders = splitList(r.defenders);
  const IcSword = ICONS.sword, IcShield = ICONS.shield, IcFlag = ICONS.flag;
  return (
    <article className="ta-route" style={{ boxShadow: `0 0 0 1px ${r.color}66, inset 0 1px 0 #ffffff0a, 0 3px 10px #00000055` }}>
      <div className="ta-route-head">
        <span className="ta-route-n" style={{ background: r.color }}>{r.team}</span>
        <span className="ta-route-name">{r.name}</span>
      </div>
      {r.mission && <div className="ta-route-obj">{r.mission}</div>}
      <LaneMap t={r} nodes={nodes} map={map} mapW={mapW} mapH={mapH} capture={capture} defend={defend} entry={entry} />
      <div className="ta-segs">
        {(r.segs || []).map((s, si) => {
          const seg = splitList(s.path);
          if (!seg.length) return null;
          return (
            <div key={si} className="ta-path muted">
              {si > 0 && <span className="ta-branch">↳</span>}
              {seg.map((b, i) => (
                <React.Fragment key={i}>
                  <Tag color={s.hold && i === seg.length - 1 ? r.color : undefined}>{b}{s.hold && i === seg.length - 1 ? " HOLD" : ""}</Tag>
                  {i < seg.length - 1 && <span className="ta-arrow">→</span>}
                </React.Fragment>
              ))}
            </div>
          );
        })}
      </div>
      <div className="ta-cols">
        <div>
          <div className="ta-col-h"><IcSword size={14} color={r.color} />{r.attackLabel || "Attack"}</div>
          {attackers.map((a, i) => (
            <div key={a} className="ta-member">
              {i === 0 ? <IcFlag size={14} color={r.color} /> : <span className="ta-dot" style={{ background: r.color }} />}
              <span className="ta-member-name">{a}</span>
              {i === 0 && <span className="ta-lead-badge" style={{ color: r.color, boxShadow: `inset 0 0 0 1px ${r.color}66` }}>LEAD</span>}
            </div>
          ))}
        </div>
        <div>
          <div className="ta-col-h"><IcShield size={14} color="#90a2b6" />{r.defenseLabel || "Defense"}</div>
          {defenders.map((d) => (
            <div key={d} className="ta-member"><span className="ta-dot" style={{ background: "#647787" }} /><span className="ta-member-name">{d}</span></div>
          ))}
        </div>
      </div>
      <div className="ta-route-foot">
        {r.hold && <span className="ta-hold-line" style={{ color: r.color }}><IcShield size={13} color={r.color} />{r.hold}</span>}
        {r.timing && <span className="ta-timing">{r.timing}</span>}
        {r.sub && <span className="ta-sub">Sub: {r.sub}</span>}
        {r.warning && <span className="ta-warn">{r.warning}</span>}
      </div>
    </article>
  );
}

export function BattlePlan({ b }) {
  const [active, setActive] = useState(null);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState(null);

  let nodes = {};
  try { nodes = typeof b.nodes === "string" ? JSON.parse(b.nodes || "{}") : (b.nodes || {}); }
  catch { nodes = {}; }

  const teams = (b.teams || []).map((t, i) => ({ ...t, _i: i }));
  const capture = splitList(b.capture), defend = splitList(b.defend), entry = splitList(b.entry);
  const mapW = b.mapW || 1920, mapH = b.mapH || 1401;
  const map = imgSrc(b.map) || "/tri/map.jpg";
  const IcSword = ICONS.sword, IcShield = ICONS.shield, IcFlag = ICONS.flag;

  const search = (q) => {
    setQuery(q);
    const s = q.trim().toLowerCase();
    if (s.length < 2) { setFound(null); if (!s) setActive(null); return; }
    for (const t of teams) {
      for (const [list, role] of [[splitList(t.attackers), "Attack"], [splitList(t.defenders), "Defense"]]) {
        const hit = list.find((n) => n.toLowerCase().includes(s));
        if (hit) { setFound({ name: hit, team: t, role, lead: role === "Attack" && splitList(t.attackers)[0] === hit }); setActive(t._i); return; }
      }
      if (t.sub && t.sub.toLowerCase().includes(s)) { setFound({ name: t.sub, team: t, role: "Substitute" }); setActive(t._i); return; }
    }
    setFound({ miss: true });
  };

  const shown = active !== null ? teams.filter((t) => t._i === active) : teams;

  return (
    <>
      {b.showSearch !== false && (
        <section className="ta-card">
          <div className="lbl">{b.searchLabel || "Find your position"}</div>
          <div className="ta-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input placeholder={b.searchPlaceholder || "Type your name…"} value={query} onChange={(e) => search(e.target.value)} />
          </div>
          {found && !found.miss && (
            <div className="ta-found" style={{ boxShadow: `inset 0 0 0 1px ${found.team.color}88` }}>
              <b style={{ color: found.team.color }}>{found.name}</b>&nbsp;— {found.team.team} ·&nbsp;
              {found.role === "Attack" ? <IcSword size={14} color={found.team.color} /> : found.role === "Defense" ? <IcShield size={14} color={found.team.color} /> : null}
              &nbsp;{found.role}{found.lead && <span className="ta-found-lead"><IcFlag size={13} color="var(--gold-lt)" />LANE LEADER</span>}
            </div>
          )}
          {found?.miss && <div className="ta-found miss">{b.missText || "Name not on the roster."}</div>}

          <div className="ta-map-legend">
            {teams.map((r) => (
              <button key={r._i} className={`ta-leg${active === r._i ? " on" : ""}`}
                style={{ color: r.color, boxShadow: `inset 0 0 0 1px ${r.color}${active === r._i ? "" : "55"}` }}
                onClick={() => { setActive(active === r._i ? null : r._i); setFound(null); setQuery(""); }}>
                <i style={{ background: r.color }} />{r.team}
              </button>
            ))}
          </div>

          {b.showMap !== false && (
            <div className="ta-mapbox">
              <TransformWrapper initialScale={1.5} minScale={1} maxScale={5} centerOnInit doubleClick={{ mode: "zoomIn" }}>
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="ta-mapctl">
                      <button onClick={() => zoomIn()} aria-label="Zoom in"><G size={16} color="var(--ink)" d={<path d="M12 5v14M5 12h14" />} /></button>
                      <button onClick={() => zoomOut()} aria-label="Zoom out"><G size={16} color="var(--ink)" d={<path d="M5 12h14" />} /></button>
                      <button onClick={() => resetTransform()} aria-label="Reset"><G size={16} color="var(--ink)" d={<><path d="M3 12a9 9 0 1 0 2.6-6.3" /><path d="M3 4v4h4" /></>} /></button>
                    </div>
                    <TransformComponent wrapperClass="ta-mapwrap" contentClass="ta-mapinner">
                      <div className="ta-realmap">
                        <img src={map} alt="Battlefield map" />
                        <svg viewBox={`0 0 ${mapW} ${mapH}`} preserveAspectRatio="none" aria-hidden="true">
                          <defs>
                            {teams.map((t) => (
                              <marker key={t._i} id={`arrmain${t._i}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="2.6" markerHeight="2.6"
                                      orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0 0 L10 5 L0 10 z" fill={t.color} /></marker>
                            ))}
                          </defs>
                          {b.temple && nodes[b.temple] && (
                            <circle className="ta-pulse" cx={nodes[b.temple][0]} cy={nodes[b.temple][1]} r="86" fill="none" stroke="#ffe08a" strokeWidth="7" />
                          )}
                          {teams.map((t) => (
                            <g key={t._i} opacity={active === null || active === t._i ? 1 : 0.08} style={{ transition: "opacity .25s" }}>
                              <Route t={t} nodes={nodes} uid="main" />
                            </g>
                          ))}
                          <Markers nodes={nodes} capture={capture} defend={defend} entry={entry} />
                        </svg>
                      </div>
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
              <div className="ta-maplegend">
                <span><i className="lg-start">1</i> Start</span>
                <span><svg width="26" height="10" viewBox="0 0 26 10"><line x1="1" y1="5" x2="17" y2="5" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" /><path d="M17 1l8 4-8 4z" fill="var(--gold)" /></svg> Advance</span>
                <span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f0564e" strokeWidth="2.6"><circle cx="12" cy="12" r="7" /><path d="M12 1v4M12 19v4M1 12h4M19 12h4" /></svg> Capture</span>
                <span><svg width="13" height="15" viewBox="0 0 24 26"><path d="M12 1l10 4v8c0 8-5 11-10 13C7 24 2 21 2 13V5l10-4z" fill="#ecc25a" /></svg> Defend</span>
                <span><svg width="14" height="14" viewBox="0 0 20 20"><rect x="5" y="5" width="10" height="10" transform="rotate(45 10 10)" fill="none" stroke="#f2824a" strokeWidth="2.6" /></svg> Entry</span>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="ta-plan">
        <div className="eyebrow" style={{ color: "var(--gold)" }}>
          {active !== null ? `${b.oneLabel || "Your lane"} · ${teams[active].team}` : (b.allLabel || "The lanes")}
        </div>
        {active !== null && (
          <button className="ta-showall" onClick={() => { setActive(null); setFound(null); setQuery(""); }}>← {b.allLabel || "All lanes"}</button>
        )}
        {shown.map((r) => (
          <TeamCard key={r._i} r={r} nodes={nodes} map={map} mapW={mapW} mapH={mapH}
                    capture={capture} defend={defend} entry={entry} />
        ))}
      </section>
    </>
  );
}

/* ---------- phases: proportional bar + phase cards ---------- */
export function Phases({ b }) {
  const items = b.items || [];
  const total = items.reduce((s, p) => s + (Number(p.weight) || 1), 0) || 1;
  return (
    <>
      <div className="ta-tl">
        {items.map((p, i) => (
          <div key={i} className="ta-tl-seg" style={{ background: p.color || "var(--gold)", flexGrow: Number(p.weight) || 1 }} />
        ))}
      </div>
      {b.marks && (
        <div className="ta-tl-marks" style={{ display: "flex", justifyContent: "space-between" }}>
          {splitList(b.marks).map((m, i) => <span key={i}>{m}</span>)}
        </div>
      )}
      <div className="ta-phases">
        {items.map((p, i) => (
          <div key={i} className="ta-phase" style={{ boxShadow: `inset 0 0 0 1px ${p.color || "#ecc25a"}44` }}>
            <div className="ta-phase-h">
              <span className="ta-phase-n" style={{ background: p.color || "var(--gold)" }}>{i + 1}</span>
              <span className="ta-phase-name">{p.name}</span>
              <span className="ta-phase-span" style={{ color: p.color }}>{p.span}</span>
            </div>
            {p.points && <ul className="ta-ul">{splitList(p.points).map((x, j) => <li key={j}>{x}</li>)}</ul>}
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- buildings ---------- */
export function Buildings({ b }) {
  return (
    <>
      <div className="ta-blds">
        {(b.items || []).map((x, i) => (
          <div key={i} className={`ta-bld${x.hot ? " hot" : ""}`}>
            {imgSrc(x.img) && <Pic v={x.img} alt={x.name} loading="lazy" />}
            <div className="ta-bld-body">
              <div className="ta-bld-top"><b>{x.name}</b>{x.pts && <span className="ta-bld-pts">{x.pts}</span>}</div>
              {x.codes && <div className="ta-bld-codes">{x.codes}</div>}
              {x.note && <div className="ta-bld-note">{x.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- rules grid ---------- */
export function Rules({ b }) {
  return (
    <>
      <div className="ta-rules">
        {(b.items || []).map((r, i) => {
          const Ic = ICONS[r.icon] || ICONS.star;
          return (
            <div key={i} className="ta-rule">
              <span className="ta-rule-ic">{imgSrc(r.image) ? <Pic v={r.image} alt="" style={{ width: 20, height: 20 }} /> : <Ic size={18} />}</span>
              <div><b>{r.title}</b><p>{r.text}</p></div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ---------- marches / squads ---------- */
export function Marches({ b }) {
  // Legacy shape (single note + warn) folds into the notes list
  const notes = (b.notes && b.notes.length ? b.notes : [
    ...(b.note || b.noteIcons?.length ? [{ variant: "note", icons: (b.noteIcons || []), text: b.note || "" }] : []),
    ...(b.warnText ? [{ variant: "warn", image: b.warnImage, imageSize: 46, icons: [], text: b.warnText }] : []),
  ]);
  return (
    <>
      <div className="ta-squads">
        {(b.items || []).map((s, i) => (
          <div key={i} className={`ta-squad${i === 0 ? " s1" : ""}`}><b>{s.title}</b><span>{s.text}</span></div>
        ))}
      </div>
      {notes.map((n, i) => n.variant === "warn" ? (
        <div className="ta-avoid" key={i}>
          {imgSrc(n.image) && <Pic v={n.image} className="ta-avoid-img" alt=""
            style={n.imageSize ? { width: n.imageSize, height: n.imageSize } : undefined} />}
          <div><Rich>{n.text}</Rich></div>
        </div>
      ) : (
        <div className="ta-locked" key={i}>
          {(n.icons || []).length > 0 && (
            <div className="ta-locked-icons">
              {n.icons.map((ic, j) => imgSrc(ic.src) && <Pic key={j} v={ic.src} alt=""
                style={ic.size ? { width: ic.size, height: ic.size } : undefined} />)}
            </div>
          )}
          {imgSrc(n.image) && !(n.icons || []).length && <Pic v={n.image} alt=""
            style={{ width: n.imageSize || 46, height: n.imageSize || 46, objectFit: "contain" }} />}
          {n.text && <div className="ta-p"><Rich>{n.text}</Rich></div>}
        </div>
      ))}
    </>
  );
}

/* ---------- how we win: numbered steps ---------- */
export function HowWeWin({ b }) {
  return (
    <>
      <div className="ta-steps">
        {(b.items || []).map((s, i) => (
          <div key={i} className="ta-step">
            <span className="ta-step-n metal">{i + 1}</span>
            <div><b>{s.title}</b><p>{s.text}</p></div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- battle countdown (event style) ---------- */
export function BattleCd({ b }) {
  const [now, setNow] = useState(() => Date.now());
  React.useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const start = b.target ? new Date(b.target).getTime() : 0;
  const end = start + (Number(b.durationMin) || 60) * 60000;
  const pad = (n) => String(n).padStart(2, "0");
  let body;
  if (!b.target || Number.isNaN(start)) body = <div className="cd-done">Defina a data</div>;
  else if (now < start) {
    const s = Math.floor((start - now) / 1000);
    const cells = [[Math.floor(s / 86400), "Days"], [Math.floor((s % 86400) / 3600), "Hours"],
                   [Math.floor((s % 3600) / 60), "Min"], [s % 60, "Sec"]];
    body = (
      <div className="cd-nums" role="timer">
        {cells.map(([v, l], i) => (
          <React.Fragment key={l}>
            {i > 0 && <div className="cd-sep metal">:</div>}
            <div className="cd-cell"><div className="cd-v metal">{pad(v)}</div><div className="cd-l">{l}</div></div>
          </React.Fragment>
        ))}
      </div>
    );
  } else if (now < end) body = <div className="cd-live">{imgSrc(b.liveIcon) && <Pic v={b.liveIcon} alt="" />}{b.liveText || "BATTLE IN PROGRESS"}</div>;
  else body = <div className="cd-done">{b.doneText || "Battle completed"}</div>;
  return <div className="cd">{body}</div>;
}
