import React, { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import BattleCountdown from "../components/BattleCountdown.jsx";

/* ============================================================
   /tri-alliance — Tri-Alliance Clash battle guide
   Lane naming: A#+D# = Attack team # + Defense team #.
   ============================================================ */

const TROOP = { inf: "/troops/infantry.png", cav: "/troops/cavalry.png", arch: "/troops/archer.png" };

const TEAMS = [
  {
    n: 1, team: "A1+D1", color: "#f0564e", name: "Deep Left Flank",
    mission: "Sweep the far-left lane and take enemy Garrison A24",
    path: ["B1", "B4", "B8", "B12", "B18", "A19", "A24"],
    attackers: ["JoDee", "Sabo", "Jenny"], defenders: ["Toady", "Imrail", "Moon"], sub: "Panda",
    hold: "From min 20, D1 holds A24 once captured",
    timing: "Reach A19 around min 15 · take A24 after min 20 · Temple at min 40",
  },
  {
    n: 2, team: "A2+D2", color: "#f2d054", name: "Left Corridor",
    mission: "Push the center-left lane down to A28 and A25",
    path: ["B3", "B6", "B11", "B17", "B23", "A28", "A25"],
    attackers: ["Johann", "Nanya", "Araz"], defenders: ["!!!Skill", "OVI", "Fong"], sub: "Juyopert",
    hold: "From min 20, D2 holds A25 / A26",
    timing: "Push from min 5 · engage A28 around min 15 · Temple at min 40",
  },
  {
    n: 3, team: "A3+D3", color: "#4ad0e0", name: "Central Push",
    mission: "Drive the middle lane to A29 — it blocks their path to the Temple",
    path: ["B5", "B10", "B16", "B22", "B27", "A29"],
    attackers: ["Salles", "Fgr1", "Www"], defenders: ["Oxy", "Leclerc", "Rumiko"], sub: "Beske",
    hold: "From min 20, D3 crosses to C24 using Transit Hubs",
    timing: "Threaten A29 by min 25 · Temple at min 40",
  },
  {
    n: 4, team: "A4+D4", color: "#4a90f2", name: "Right-Center Assault",
    mission: "Secure our B29 and B31, then push A30",
    path: ["B9", "B14", "B21", "B25", "B29", "B31", "A30"],
    attackers: ["IK33", "Epson", "Mastergwyn"], defenders: ["Jungki Oppa", "RF", "Neduts"], sub: "Eyin",
    hold: "From min 20, D4 crosses to C29 using Transit Hubs",
    timing: "Secure B29 by min 10 · pressure A30 · Temple at min 40",
  },
  {
    n: 5, team: "A5+D5", color: "#a878f0", name: "Right Defense",
    mission: "Protect our Garrison B24 and pressure C31 when it's safe",
    path: ["B13", "B20", "B24", "B28", "B30", "C31"],
    attackers: ["Yam", "Hammelbock", "KZ"], defenders: ["Susu", "Bear", "Sadie"], sub: "Open slot",
    hold: "D5 stays on B24 the whole match · A5 covers B29",
    timing: "Anchor B24 from the start · advance only when safe",
    warning: "B24 can never be left alone",
  },
];

const PHASES = [
  { n: 1, name: "Preparation", span: "0–3 min", color: "#90a2b6",
    points: ["Captains are assigned (energy regen bonus)", "Get to your lane — no fighting yet"] },
  { n: 2, name: "Seize & Conquer", span: "3–20 min", color: "#ecc25a",
    points: ["Take the Transit Hubs first", "Advance along your route, building by building", "Garrisons are still shielded — ignore them"] },
  { n: 3, name: "Garrisons", span: "20–40 min", color: "#f2824a",
    points: ["A24, B24 and C24 unlock — 1,800 pts/min each", "Hold our B24, take theirs", "Defense teams move to their hold buildings"] },
  { n: 4, name: "Temple", span: "40–60 min", color: "#ffe08a",
    points: ["Temple opens — first capture is +50,000 pts", "All attack teams hit it at the same time", "If we lose it, take it back — it keeps scoring"] },
];

const BUILDINGS = [
  { img: "/tri/temple.jpg", name: "Temple of Tides", codes: "Center · opens at min 40", pts: "+1,800/min", note: "First capture gives +50,000 points", hot: true },
  { img: "/tri/garrison.jpg", name: "Garrison", codes: "A24 · B24 · C24 · unlock at min 20", pts: "+1,800/min", note: "Worth 3 normal buildings" },
  { img: "/tri/transit.jpg", name: "Transit Hub", codes: "Ring platforms", pts: "+60/min", note: "Fast travel across the map" },
  { img: "/tri/tower.jpg", name: "Watchtower", codes: "Along every lane", pts: "+180–600/min", note: "Regular capture points" },
  { img: "/tri/hq.jpg", name: "Alliance HQ", codes: "A1 · B1 · C1", pts: "+1,800/min", note: "Defeated squads respawn here" },
];

/* Clean stroke icons (SVG) — crisp at small sizes */
const G = ({ d, color = "var(--gold)", size = 20, sw = 2 }) => (
  <svg className="gi" width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const IcSword = (p) => <G {...p} d={<><path d="M14.5 3.5 20 3l-.5 5.5L8 20l-4-4L15.5 4.5z" /><path d="m5 13 6 6M4 20l-1 1" /></>} />;
const IcShield = (p) => <G {...p} d={<path d="M12 3l7 2.5V11c0 4.5-3 7.5-7 9.5-4-2-7-5-7-9.5V5.5L12 3z" />} />;
const IcFlag = (p) => <G {...p} d={<><path d="M5 21V4" /><path d="M5 4c4-2 8 2 14 0v9c-6 2-10-2-14 0" /></>} />;
const IcCoins = (p) => <G {...p} d={<><circle cx="9" cy="9" r="5.5" /><path d="M15.5 8a5.5 5.5 0 1 1-6.9 6.9" /></>} />;
const IcBolt = (p) => <G {...p} d={<path d="M13 2 5 13.5h5L10 22l8-11.5h-5L13 2z" />} />;
const IcBack = (p) => <G {...p} d={<><path d="M9 14 4 9l5-5" /><path d="M4 9h9a6 6 0 1 1 0 12h-3" /></>} />;
const IcHeal = (p) => <G {...p} d={<><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M12 8v8M8 12h8" /></>} />;
const IcBlock = (p) => <G {...p} d={<><circle cx="12" cy="12" r="8.5" /><path d="m6.5 6.5 11 11" /></>} />;
const IcPortal = (p) => <G {...p} d={<><ellipse cx="12" cy="17.5" rx="8" ry="3" /><path d="M12 14V4M12 4l-3.5 3.5M12 4l3.5 3.5" /></>} />;
const IcChat = (p) => <G {...p} d={<path d="M20 12a8 8 0 1 0-3.5 6.6L20 20l-.8-3.6A8 8 0 0 0 20 12z" />} />;

const RULES = [
  { Ic: IcCoins, t: "Points win, not kills", d: "Don't chase kills — hold buildings." },
  { Ic: IcBolt, t: "Keep 30–40% energy for min 20", d: "Energy is used to move, attack and heal." },
  { Ic: IcBack, t: "Retreat instead of dying", d: "Fall back one building and heal. Respawning at HQ takes time." },
  { Ic: IcHeal, t: "Heal in captured buildings", d: "Only buildings not under attack can heal troops." },
  { Ic: IcBlock, t: "No skipping", d: "You can't move past an enemy building. 5 allied marches attacking it clear the path." },
  { Ic: IcPortal, t: "Protect the Transit Hubs", d: "They're our fast travel across the map." },
  { Ic: IcChat, t: "Short calls in chat", d: "Building code + minute: “B24 min 20”." },
  { Ic: IcFlag, t: "Follow your Lane Leader", d: "One caller per lane." },
];

const Tag = ({ children, color }) => (
  <span className="ta-tag" style={color ? { color, boxShadow: `inset 0 0 0 1px ${color}55` } : undefined}>{children}</span>
);

/* ============================================================
   Battlefield map — real map, zoom/pan, routes with direction
   Coordinates in the map's own 1920×1401 pixel space.
   ============================================================ */
const N = {
  B1: [125, 470], B3: [255, 450], B4: [185, 560], B5: [430, 235], B6: [340, 385],
  B8: [300, 625], B9: [575, 140], B10: [400, 350], B11: [395, 580], B12: [410, 700],
  B13: [730, 145], B14: [550, 250], B16: [480, 500], B17: [495, 625], B18: [310, 820],
  B20: [820, 210], B21: [590, 325], B22: [560, 450], B23: [575, 580],
  B24: [750, 290], B25: [670, 380], B27: [605, 695], B28: [880, 305], B29: [765, 455],
  B30: [835, 415], B31: [760, 550],
  A19: [295, 990], A24: [690, 900], A25: [875, 895], A28: [795, 835], A29: [985, 835], A30: [895, 795],
  C24: [1235, 650], C29: [1155, 445], C31: [1065, 420],
};
const TEMPLE = [960, 545];
const GARRISONS = ["A24", "B24", "C24"];
const HOLD_PINS = [
  { at: "A24", c: "#f0564e", g: "D1" }, { at: "A25", c: "#f2d054", g: "D2" },
  { at: "C24", c: "#4ad0e0", g: "D3" }, { at: "C29", c: "#4a90f2", g: "D4" },
  { at: "B24", c: "#a878f0", g: "D5" }, { at: "B29", c: "#a878f0", g: "A5" },
];

function pinPath(x, y, s = 30) {
  // map-style teardrop pin, tip at (x,y)
  return `M${x},${y} C${x - s * 0.62},${y - s * 0.75} ${x - s * 0.62},${y - s * 1.5} ${x},${y - s * 1.5} C${x + s * 0.62},${y - s * 1.5} ${x + s * 0.62},${y - s * 0.75} ${x},${y} Z`;
}

function BattleMap({ active }) {
  const on = (n) => active === null || active === n;
  return (
    <div className="ta-mapbox">
      <TransformWrapper initialScale={1.5} minScale={1} maxScale={5} centerOnInit doubleClick={{ mode: "zoomIn" }}>
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="ta-mapctl">
              <button onClick={() => zoomIn()} aria-label="Zoom in"><G size={16} color="var(--ink)" d={<path d="M12 5v14M5 12h14" />} /></button>
              <button onClick={() => zoomOut()} aria-label="Zoom out"><G size={16} color="var(--ink)" d={<path d="M5 12h14" />} /></button>
              <button onClick={() => resetTransform()} aria-label="Reset zoom"><G size={16} color="var(--ink)" d={<><path d="M3 12a9 9 0 1 0 2.6-6.3" /><path d="M3 4v4h4" /></>} /></button>
            </div>
            <TransformComponent wrapperClass="ta-mapwrap" contentClass="ta-mapinner">
              <div className="ta-realmap">
                <img src="/tri/map.jpg" alt="Battlefield map with all building codes" />
                <svg viewBox="0 0 1920 1401" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    {TEAMS.map((t) => (
                      <marker key={t.n} id={`arr${t.n}`} viewBox="0 0 10 10" refX="7" refY="5"
                        markerWidth="2.6" markerHeight="2.6" orient="auto-start-reverse" markerUnits="strokeWidth">
                        <path d="M0 0 L10 5 L0 10 z" fill={t.color} />
                      </marker>
                    ))}
                  </defs>

                  {/* zone chips */}
                  <g className="ta-zonechips">
                    <rect x="60" y="55" rx="16" width="150" height="46" fill="#0d1218" opacity="0.78" />
                    <text x="135" y="86" textAnchor="middle" fill="#ecc25a">B — US</text>
                    <rect x="1180" y="1130" rx="16" width="220" height="46" fill="#0d1218" opacity="0.78" />
                    <text x="1290" y="1161" textAnchor="middle" fill="#f0564e">A — ENEMY</text>
                    <rect x="1580" y="300" rx="16" width="220" height="46" fill="#0d1218" opacity="0.78" />
                    <text x="1690" y="331" textAnchor="middle" fill="#4ad0e0">C — ENEMY</text>
                  </g>

                  {/* high-value pulses: Temple + Garrisons */}
                  <circle className="ta-pulse" cx={TEMPLE[0]} cy={TEMPLE[1]} r="86" fill="none" stroke="#ffe08a" strokeWidth="7" />
                  {GARRISONS.map((g) => (
                    <circle key={g} className="ta-pulse slow" cx={N[g][0]} cy={N[g][1]} r="44" fill="none" stroke="#ffe08a" strokeWidth="5" />
                  ))}

                  {/* routes: dark casing + colored line + flowing dash + direction arrows */}
                  {TEAMS.map((t) => {
                    const pts = t.path.map((b) => N[b].join(",")).join(" ");
                    const o = on(t.n) ? 1 : 0.08;
                    return (
                      <g key={t.n} opacity={o} style={{ transition: "opacity .25s" }}>
                        <polyline points={pts} fill="none" stroke="#0d1218" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
                        <polyline points={pts} fill="none" stroke={t.color} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" markerMid={`url(#arr${t.n})`} />
                        <polyline className="ta-flow" points={pts} fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 42" opacity="0.85" />
                        {t.path.map((b) => (
                          <circle key={b} cx={N[b][0]} cy={N[b][1]} r="8" fill={t.color} stroke="#0d1218" strokeWidth="3" />
                        ))}
                        <g>
                          <circle cx={N[t.path[0]][0]} cy={N[t.path[0]][1]} r="24" fill={t.color} stroke="#0d1218" strokeWidth="4" />
                          <text x={N[t.path[0]][0]} y={N[t.path[0]][1] + 9} textAnchor="middle" className="ta-startn">{t.n}</text>
                        </g>
                        <g transform={`translate(${N[t.path[t.path.length - 1]][0]}, ${N[t.path[t.path.length - 1]][1]})`}>
                          <line x1="0" y1="0" x2="0" y2="-46" stroke="#0d1218" strokeWidth="8" strokeLinecap="round" />
                          <line x1="0" y1="0" x2="0" y2="-46" stroke="#f4ecda" strokeWidth="4" strokeLinecap="round" />
                          <path d="M0 -46 L34 -37 L0 -28 Z" fill={t.color} stroke="#0d1218" strokeWidth="2.5" />
                        </g>
                      </g>
                    );
                  })}

                  {/* defense hold pins */}
                  {HOLD_PINS.map((h, i) => {
                    const teamN = Number(h.g[1]);
                    const o = on(teamN) ? 1 : 0.08;
                    const [x, y] = N[h.at];
                    return (
                      <g key={i} opacity={o} style={{ transition: "opacity .25s" }}>
                        <path d={pinPath(x, y - 14)} fill={h.c} stroke="#0d1218" strokeWidth="3.5" />
                        <circle cx={x} cy={y - 44} r="11" fill="#0d1218" opacity="0.85" />
                        <text x={x} y={y - 39.5} textAnchor="middle" className="ta-pintxt">{h.g}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
      {/* how to read it */}
      <div className="ta-maplegend">
        <span><i className="lg-start">1</i> Start</span>
        <span><svg width="26" height="10" viewBox="0 0 26 10" aria-hidden="true"><line x1="1" y1="5" x2="17" y2="5" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" /><path d="M17 1l8 4-8 4z" fill="var(--gold)" /></svg> Advance</span>
        <span><svg width="12" height="16" viewBox="0 0 12 16" aria-hidden="true"><path d="M6 16 C2.3 11 2.3 2 6 2 C9.7 2 9.7 11 6 16 Z" fill="var(--gold)" /></svg> Defense holds</span>
        <span><i className="lg-pulse"></i> High value</span>
      </div>
    </div>
  );
}

function TeamCard({ r }) {
  return (
    <article className="ta-route" style={{ boxShadow: `0 0 0 1px ${r.color}66, inset 0 1px 0 #ffffff0a, 0 3px 10px #00000055` }}>
      <div className="ta-route-head">
        <span className="ta-route-n" style={{ background: r.color }}>{r.team}</span>
        <span className="ta-route-name">{r.name}</span>
      </div>
      <div className="ta-route-obj">{r.mission}</div>
      <div className="ta-path">
        {r.path.map((b, i) => (
          <React.Fragment key={i}>
            <Tag color={b === "B24" && r.n === 5 ? r.color : undefined}>{b}{b === "B24" && r.n === 5 ? " HOLD" : ""}</Tag>
            {i < r.path.length - 1 && <span className="ta-arrow">→</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="ta-cols">
        <div>
          <div className="ta-col-h"><IcSword size={14} color={r.color} />A{r.n} · Attack</div>
          {r.attackers.map((a, i) => (
            <div key={a} className="ta-member">
              {i === 0 ? <IcFlag size={14} color={r.color} /> : <span className="ta-dot" style={{ background: r.color }}></span>}
              <span className="ta-member-name">{a}</span>
              {i === 0 && <span className="ta-lead-badge" style={{ color: r.color, boxShadow: `inset 0 0 0 1px ${r.color}66` }}>LEAD</span>}
            </div>
          ))}
        </div>
        <div>
          <div className="ta-col-h"><IcShield size={14} color="#90a2b6" />D{r.n} · Defense</div>
          {r.defenders.map((d) => (
            <div key={d} className="ta-member"><span className="ta-dot" style={{ background: "#647787" }}></span><span className="ta-member-name">{d}</span></div>
          ))}
        </div>
      </div>
      <div className="ta-route-foot">
        <span className="ta-hold-line" style={{ color: r.color }}><IcShield size={13} color={r.color} />{r.hold}</span>
        <span className="ta-timing">{r.timing}</span>
        <span className="ta-sub">Sub: {r.sub}</span>
        {r.warning && <span className="ta-warn">{r.warning}</span>}
      </div>
    </article>
  );
}

export default function TriAlliance() {
  const [active, setActive] = useState(null);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState(null);

  const search = (q) => {
    setQuery(q);
    const s = q.trim().toLowerCase();
    if (s.length < 2) { setFound(null); if (s.length === 0) setActive(null); return; }
    for (const t of TEAMS) {
      for (const [list, role] of [[t.attackers, "Attack"], [t.defenders, "Defense"]]) {
        const hit = list.find((n) => n.toLowerCase().includes(s));
        if (hit) {
          setFound({ name: hit, team: t, role, lead: role === "Attack" && t.attackers[0] === hit });
          setActive(t.n);
          return;
        }
      }
      if (t.sub.toLowerCase().includes(s) && t.sub !== "Open slot") {
        setFound({ name: t.sub, team: t, role: "Substitute", lead: false });
        setActive(t.n);
        return;
      }
    }
    setFound({ miss: true });
  };

  const shown = active !== null ? TEAMS.filter((t) => t.n === active) : TEAMS;

  return (
    <div className="app ta">
      <header className="banner ta-banner">
        <img src="/tri/header.jpg" alt="" />
        <div className="scrim"></div>
        <div className="b-in ta-bin">
          <img className="ta-event-icon" src="/tri/icons/event.png" alt="" />
          <div>
            <div className="eyebrow" style={{ color: "var(--gold)" }}>Alliance Cmmd · BigDaddys</div>
            <div className="ta-title metal">Tri-Alliance Clash</div>
          </div>
        </div>
      </header>

      <BattleCountdown />

      {/* How we win */}
      <section className="ta-card">
        <div className="lbl">How we win</div>
        <div className="ta-steps">
          <div className="ta-step">
            <span className="ta-step-n metal">1</span>
            <div><b>Hold buildings to earn points</b><p>Every building we hold generates points per minute. Most points after 60 minutes wins. Kills don't count.</p></div>
          </div>
          <div className="ta-step">
            <span className="ta-step-n metal">2</span>
            <div><b>Stick to your lane</b><p>5 lanes, 6 players each. Every team follows its own route on the map below.</p></div>
          </div>
          <div className="ta-step">
            <span className="ta-step-n metal">3</span>
            <div><b>At min 40, everyone attacks the Temple</b><p>First capture gives +50,000 points. All attack teams hit it together.</p></div>
          </div>
        </div>
      </section>

      {/* Find your position */}
      <section className="ta-card">
        <div className="lbl">Find your position</div>
        <div className="ta-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input placeholder="Type your name…" value={query} onChange={(e) => search(e.target.value)} />
        </div>
        {found && !found.miss && (
          <div className="ta-found" style={{ boxShadow: `inset 0 0 0 1px ${found.team.color}88` }}>
            <b style={{ color: found.team.color }}>{found.name}</b>&nbsp;— {found.team.team} ·&nbsp;
            {found.role === "Attack" ? <IcSword size={14} color={found.team.color} /> : found.role === "Defense" ? <IcShield size={14} color={found.team.color} /> : null}
            &nbsp;{found.role}{found.lead && <span className="ta-found-lead"><IcFlag size={13} color="var(--gold-lt)" />LANE LEADER</span>}
          </div>
        )}
        {found && found.miss && <div className="ta-found miss">Name not on the roster — talk to JoDee or Salles.</div>}

        <div className="ta-map-legend">
          {TEAMS.map((r) => (
            <button key={r.n} className={`ta-leg${active === r.n ? " on" : ""}`}
              style={{ color: r.color, boxShadow: `inset 0 0 0 1px ${r.color}${active === r.n ? "" : "55"}` }}
              onClick={() => { setActive(active === r.n ? null : r.n); setFound(null); setQuery(""); }}>
              <i style={{ background: r.color }}></i>{r.team}
            </button>
          ))}
        </div>

        <BattleMap active={active} />
      </section>

      {/* Lanes */}
      <section className="ta-plan">
        <div className="eyebrow" style={{ color: "var(--gold)" }}>
          {active !== null ? `Your lane · ${TEAMS[active - 1].team}` : "The 5 lanes"}
        </div>
        {active !== null && (
          <button className="ta-showall" onClick={() => { setActive(null); setFound(null); setQuery(""); }}>← All lanes</button>
        )}
        {shown.map((r) => <TeamCard key={r.n} r={r} />)}
      </section>

      {/* Phases */}
      <section className="ta-card">
        <div className="lbl">The 4 phases</div>
        <div className="ta-tl">
          {PHASES.map((p) => (
            <div key={p.n} className="ta-tl-seg" style={{ background: p.color, flexGrow: [3, 17, 20, 20][p.n - 1] }}></div>
          ))}
        </div>
        <div className="ta-tl-marks"><span>0</span><span style={{ marginLeft: "2%" }}>3</span><span style={{ marginLeft: "24%" }}>20</span><span style={{ marginLeft: "26%" }}>40</span><span style={{ marginLeft: "auto" }}>60</span></div>
        <div className="ta-phases">
          {PHASES.map((p) => (
            <div key={p.n} className="ta-phase" style={{ boxShadow: `inset 0 0 0 1px ${p.color}44` }}>
              <div className="ta-phase-h">
                <span className="ta-phase-n" style={{ background: p.color }}>{p.n}</span>
                <span className="ta-phase-name">{p.name}</span>
                <span className="ta-phase-span" style={{ color: p.color }}>{p.span}</span>
              </div>
              <ul className="ta-ul">{p.points.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      {/* Buildings */}
      <section className="ta-card">
        <div className="lbl">The buildings</div>
        <div className="ta-blds">
          {BUILDINGS.map((b) => (
            <div key={b.name} className={`ta-bld${b.hot ? " hot" : ""}`}>
              <img src={b.img} alt={b.name} loading="lazy" />
              <div className="ta-bld-body">
                <div className="ta-bld-top"><b>{b.name}</b><span className="ta-bld-pts">{b.pts}</span></div>
                <div className="ta-bld-codes">{b.codes}</div>
                <div className="ta-bld-note">{b.note}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Marches */}
      <section className="ta-card">
        <div className="lbl">Your 3 marches</div>
        <div className="ta-squads">
          <div className="ta-squad s1"><b>March 1</b><span>Your 3 strongest heroes</span></div>
          <div className="ta-squad"><b>March 2</b><span>Next 3 strongest</span></div>
          <div className="ta-squad"><b>March 3</b><span>The rest</span></div>
        </div>
        <div className="ta-locked">
          <div className="ta-locked-icons">
            <img src={TROOP.inf} alt="Infantry" /><img src={TROOP.cav} alt="Cavalry" /><img src={TROOP.arch} alt="Archery" />
          </div>
          <p className="ta-p">Troop counts are fixed: 100k Infantry + 100k Cavalry + 100k Archery per march. The only choice is which heroes go where.</p>
        </div>
        <div className="ta-avoid"><img className="ta-avoid-img" src="/tri/icons/diana.png" alt="Diana" /><div>Don't use <b>Diana</b> (no battle skills) or blue-tier heroes.</div></div>
      </section>

      {/* Key rules */}
      <section className="ta-card">
        <div className="lbl">Key rules</div>
        <div className="ta-rules">
          {RULES.map((r) => (
            <div key={r.t} className="ta-rule"><span className="ta-rule-ic"><r.Ic size={18} /></span><div><b>{r.t}</b><p>{r.d}</p></div></div>
          ))}
        </div>
      </section>

      {/* Buffs */}
      <section className="ta-card">
        <div className="lbl">Before the battle</div>
        <p className="ta-p" style={{ margin: 0 }}>
          <b style={{ color: "var(--inf)" }}>Turn on:</b> Position · Pet · Territory · combat Town Buffs · Outpost<br />
          <b style={{ color: "var(--arch)" }}>No effect:</b> Deployment Capacity · March buffs · King's Perks · Ministry · Alliance Territory
        </p>
      </section>
    </div>
  );
}
