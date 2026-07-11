import React, { useState } from "react";
import BattleCountdown from "../components/BattleCountdown.jsx";

/* ============================================================
   /tri-alliance — Ultimate Tri-Alliance Clash · battle guide
   ONE goal: every member understands the event and THEIR job.
   Official lane naming: A#+D# = Attack team # + Defense team #.
   ============================================================ */

const ICON = { inf: "/troops/infantry.png", cav: "/troops/cavalry.png", arch: "/troops/archer.png" };

const TEAMS = [
  {
    n: 1, team: "A1+D1", color: "#f0564e", name: "Deep Left Flank",
    mission: "Sweep the far-left lane and take enemy Garrison A24",
    path: ["B1", "B4", "B8", "B12", "B18", "A19", "A24"],
    attackers: ["JoDee", "Sabo", "Jenny"], defenders: ["Toady", "Imrail", "Moon"], sub: "Panda",
    hold: "From min 20: D1 holds A24 (enemy Garrison) once captured",
    timing: "Advance in Phase 2 · reach A19 ~min 15 · take A24 after min 20 · min 40 → Temple",
  },
  {
    n: 2, team: "A2+D2", color: "#f2d054", name: "Left Corridor",
    mission: "Push the center-left lane down to A28 / A25",
    path: ["B3", "B6", "B11", "B17", "B23", "A28", "A25"],
    attackers: ["Johann", "Nanya", "Araz"], defenders: ["!!!Skill", "OVI", "Fong"], sub: "Juyopert",
    hold: "From min 20: D2 holds A25 / A26 (southern corridor)",
    timing: "Aggressive push from ~min 5 · engage A28 ~min 15 · min 40 → Temple",
  },
  {
    n: 3, team: "A3+D3", color: "#4ad0e0", name: "Central Push",
    mission: "Drive the central corridor toward A29 — cutting it blocks their Temple access",
    path: ["B5", "B10", "B16", "B22", "B27", "A29"],
    attackers: ["Salles", "Fgr1", "Www"], defenders: ["Oxy", "Leclerc", "Rumiko"], sub: "Beske",
    hold: "From min 20: D3 crosses to C24 via Transit Hubs — pressure enemy Garrison C",
    timing: "Core lane · threaten A29 by ~min 25 · min 40 → Temple",
  },
  {
    n: 4, team: "A4+D4", color: "#4a90f2", name: "Right-Center Assault",
    mission: "Secure our B29 / B31, then pressure A30 → A29",
    path: ["B9", "B14", "B21", "B25", "B29", "B31", "A30"],
    attackers: ["IK33", "Epson", "Mastergwyn"], defenders: ["Jungki Oppa", "RF", "Neduts"], sub: "Eyin",
    hold: "From min 20: D4 crosses to C29 via Transit Hubs — cut enemy C's Temple access",
    timing: "Secure B29 ~min 10 · pressure A30 · min 40 → Temple",
  },
  {
    n: 5, team: "A5+D5", color: "#a878f0", name: "Right Defense + C Pressure",
    mission: "DEFENSIVE — protect our Garrison B24, pressure C31 when safe",
    path: ["B13", "B20", "B24", "B28", "B30", "C31"],
    attackers: ["Yam", "Hammelbock", "KZ"], defenders: ["Susu", "Bear", "Sadie"], sub: "Open slot",
    hold: "D5 NEVER leaves B24 (our Garrison) · A5 covers B29 — our Temple route",
    timing: "Anchor B24 from min 0 · push the right flank only when safe",
    warning: "B24 is NEVER left unattended",
  },
];

const PHASES = [
  {
    n: 1, name: "Preparation", span: "0–3 min", color: "#90a2b6",
    points: ["Assign Building Captains (boosts energy regen)", "Get into your lane — no combat yet"],
  },
  {
    n: 2, name: "Seize & Conquer", span: "3–20 min", color: "#ecc25a",
    points: ["Capture Transit Hubs FIRST — they are our fast travel", "Advance along YOUR route, building by building", "Garrisons are still shielded — ignore them"],
  },
  {
    n: 3, name: "Garrison Occupation", span: "20–40 min", color: "#f2824a",
    points: ["A24 · B24 · C24 unlock → 1,800 pts/min each", "Hold OUR B24 · capture theirs", "Defense teams anchor their hold buildings"],
  },
  {
    n: 4, name: "Temple Onslaught", span: "40–60 min", color: "#ffe08a",
    points: ["Temple opens: first capture +50,000, then 1,800/min", "ALL attack teams hit it TOGETHER — the last hit takes it", "Lost it? Retake it — it keeps printing points"],
  },
];

const BUILDINGS = [
  { img: "/tri/temple.jpg", name: "Temple of Tides", codes: "Center · opens min 40", pts: "+1,800/min", note: "First capture +50,000 pts — the game-winner", hot: true },
  { img: "/tri/garrison.jpg", name: "Garrison", codes: "A24 · B24 · C24 · unlock min 20", pts: "+1,800/min", note: "Worth 3 normal buildings — hold ours, take theirs" },
  { img: "/tri/transit.jpg", name: "Transit Hub", codes: "Ring platforms", pts: "+60/min", note: "Fast travel across the map — capture first, never lose" },
  { img: "/tri/tower.jpg", name: "Watchtower", codes: "Lane buildings", pts: "+180–600/min", note: "The stepping stones of your route" },
  { img: "/tri/hq.jpg", name: "Alliance HQ", codes: "A1 · B1 · C1", pts: "+1,800/min", note: "Defeated squads respawn here — dying wastes minutes" },
];

const RULES = [
  { i: "🎯", t: "Points win — kills don't", d: "Never chase kills. Every minute holding a building = points." },
  { i: "⚡", t: "Save 30–40% energy for min 20", d: "Energy powers moving, attacking, healing. Empty at min 20 = useless." },
  { i: "🔁", t: "Retreat, don't die", d: "About to lose? Fall back one building and heal. Respawning at HQ costs minutes." },
  { i: "💊", t: "Heal inside captured buildings", d: "Only buildings that are NOT in combat can heal your troops." },
  { i: "🚫", t: "No skipping", d: "You can't pass an enemy building — 5 allied marches engaging it open the way." },
  { i: "🚉", t: "Transit Hubs = mobility", d: "Our fast travel. Capture early. Losing them cuts our Temple route." },
  { i: "📣", t: "Short calls in chat", d: "Building code + minute — “B24 min 20” works in every language." },
  { i: "⭐", t: "Follow your Lane Leader", d: "One leader per lane makes the calls. Don't improvise." },
];

const Tag = ({ children, color }) => (
  <span className="ta-tag" style={color ? { color, boxShadow: `inset 0 0 0 1px ${color}55` } : undefined}>{children}</span>
);

/* ---- Real battlefield map, our 5 lanes drawn on top (1920×1401 space) ---- */
const MAP_NODES = {
  B1: [125, 470], B3: [255, 450], B4: [185, 560], B5: [430, 235], B6: [340, 385],
  B8: [300, 625], B9: [575, 140], B10: [400, 350], B11: [395, 580], B12: [410, 700],
  B13: [730, 145], B14: [550, 250], B16: [480, 500], B17: [495, 625], B18: [310, 820],
  B20: [820, 210], B21: [590, 325], B22: [560, 450], B23: [575, 580],
  B24: [750, 290], B25: [670, 380], B27: [605, 695], B28: [880, 305], B29: [765, 455],
  B30: [835, 415], B31: [760, 550],
  A19: [295, 990], A24: [690, 900], A25: [875, 895], A28: [795, 835], A29: [985, 835], A30: [895, 795],
  C24: [1235, 650], C29: [1155, 445], C31: [1065, 420],
};
const MAP_HOLDS = [
  { at: "A24", c: "#f0564e" }, { at: "A25", c: "#f2d054" }, { at: "C24", c: "#4ad0e0" },
  { at: "C29", c: "#4a90f2" }, { at: "B24", c: "#a878f0" }, { at: "B29", c: "#a878f0" },
];

function RealMap({ active }) {
  const dim = (n) => (active !== null && active !== n ? 0.1 : 1);
  const star = (x, y, s = 26) =>
    `M${x},${y - s} l${s * 0.28},${s * 0.6} ${s * 0.66},${s * 0.08} -${s * 0.48},${s * 0.45} ${s * 0.12},${s * 0.65} -${s * 0.58},${s * 0.32} -${s * 0.58},-${s * 0.32} ${s * 0.12},-${s * 0.65} -${s * 0.48},-${s * 0.45} ${s * 0.66},-${s * 0.08} Z`;
  return (
    <div className="ta-realmap-wrap">
      <div className="ta-realmap">
        <img src="/tri/map.jpg" alt="Tri-Alliance Clash battlefield map with all building codes" loading="lazy" />
        <svg viewBox="0 0 1920 1401" preserveAspectRatio="none" aria-hidden="true">
          {TEAMS.map((r) => (
            <polyline key={r.n}
              points={r.path.map((b) => MAP_NODES[b].join(",")).join(" ")}
              fill="none" stroke={r.color} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="3 24" opacity={dim(r.n)} style={{ transition: "opacity .2s" }} />
          ))}
          {TEAMS.map((r) => r.path.map((b) => (
            <circle key={r.n + b} cx={MAP_NODES[b][0]} cy={MAP_NODES[b][1]} r="16"
              fill="none" stroke={r.color} strokeWidth="6" opacity={dim(r.n)} style={{ transition: "opacity .2s" }} />
          )))}
          {MAP_HOLDS.map((h, i) => (
            <path key={i} d={star(...MAP_NODES[h.at])} fill={h.c} stroke="#10151b" strokeWidth="3" />
          ))}
        </svg>
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
          <div className="ta-col-h">⚔ A{r.n} · Attack</div>
          {r.attackers.map((a, i) => (
            <div key={a} className="ta-member">
              {i === 0 ? <span className="ta-lead-star">⭐</span> : <span className="ta-dot" style={{ background: r.color }}></span>}
              <span className="ta-member-name">{a}</span>
              {i === 0 && <span className="ta-lead-badge" style={{ color: r.color, boxShadow: `inset 0 0 0 1px ${r.color}66` }}>LEAD</span>}
            </div>
          ))}
        </div>
        <div>
          <div className="ta-col-h">🛡 D{r.n} · Defense</div>
          {r.defenders.map((d) => (
            <div key={d} className="ta-member"><span className="ta-dot" style={{ background: "#647787" }}></span><span className="ta-member-name">{d}</span></div>
          ))}
        </div>
      </div>
      <div className="ta-route-foot">
        <span className="ta-hold-line" style={{ color: r.color }}>🛡 {r.hold}</span>
        <span className="ta-timing">{r.timing}</span>
        <span className="ta-sub">Sub: {r.sub}</span>
        {r.warning && <span className="ta-warn">⚠ {r.warning}</span>}
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
          const lead = role === "Attack" && t.attackers[0] === hit;
          setFound({ name: hit, team: t, role, lead });
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
      {/* Header */}
      <header className="banner ta-banner">
        <img src="/tri/header.jpg" alt="Temple of Tides at the center of the battlefield" />
        <div className="scrim"></div>
        <div className="b-in">
          <div className="eyebrow" style={{ color: "var(--gold)" }}>Alliance Command · Kingdom 1652</div>
          <div className="ta-title metal">Tri-Alliance Clash</div>
          <div className="ta-subtitle">Know your lane. Know your job. Win.</div>
        </div>
      </header>

      {/* Countdown — battle is TODAY */}
      <BattleCountdown />

      {/* How we win — the whole event in 3 steps */}
      <section className="ta-card">
        <div className="lbl">How we win · the whole event in 3 steps</div>
        <div className="ta-steps">
          <div className="ta-step">
            <span className="ta-step-n metal">1</span>
            <div><b>Hold buildings — they print points</b><p>Every building generates points per minute while we hold it. Most points after 60 minutes wins. Kills mean nothing.</p></div>
          </div>
          <div className="ta-step">
            <span className="ta-step-n metal">2</span>
            <div><b>Stay in YOUR lane with your team</b><p>5 lanes, 6 players each. Your team advances along its route, building by building. Find yours below.</p></div>
          </div>
          <div className="ta-step">
            <span className="ta-step-n metal">3</span>
            <div><b>Min 40 — everyone hits the Temple</b><p>First capture is +50,000 points. All attack teams converge and hit it TOGETHER.</p></div>
          </div>
        </div>
        <div className="ta-callout">We lost round 1 because we scattered. Round 2: everyone knows their job.</div>
      </section>

      {/* Find your position — THE interactive core */}
      <section className="ta-card">
        <div className="lbl">Find your position</div>
        <div className="ta-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input placeholder="Type your name…" value={query} onChange={(e) => search(e.target.value)} />
        </div>
        {found && !found.miss && (
          <div className="ta-found" style={{ boxShadow: `inset 0 0 0 1px ${found.team.color}88` }}>
            <b style={{ color: found.team.color }}>{found.name}</b> — you're in <b style={{ color: found.team.color }}>{found.team.team}</b> · {found.role === "Attack" ? "⚔" : found.role === "Defense" ? "🛡" : "↺"} {found.role}{found.lead ? " · ⭐ LANE LEADER" : ""}
          </div>
        )}
        {found && found.miss && <div className="ta-found miss">Name not on the roster — talk to JoDee or Salles before the battle.</div>}

        <p className="ta-p" style={{ margin: "10px 0" }}>Each lane = one <b>Attack team (A#)</b> that pushes forward + one <b>Defense team (D#)</b> that holds what was taken. The ⭐ first attacker is the <b>Lane Leader</b> — follow their calls.</p>

        <div className="ta-map-legend">
          {TEAMS.map((r) => (
            <button key={r.n} className={`ta-leg${active === r.n ? " on" : ""}`}
              style={{ color: r.color, boxShadow: `inset 0 0 0 1px ${r.color}${active === r.n ? "" : "55"}` }}
              onClick={() => { setActive(active === r.n ? null : r.n); setFound(null); setQuery(""); }}>
              <i style={{ background: r.color }}></i>{r.team}
            </button>
          ))}
        </div>

        <RealMap active={active} />
        <div className="ta-note">Real battle map — scroll it sideways. Tap your team above to light up your lane · ★ = defense hold positions.</div>
      </section>

      {/* Team cards (filtered by selection) */}
      <section className="ta-plan">
        <div className="eyebrow" style={{ color: "var(--gold)" }}>
          {active !== null ? `Your lane · ${TEAMS[active - 1].team}` : "The 5 lanes · 30 players"}
        </div>
        {active !== null && (
          <button className="ta-showall" onClick={() => { setActive(null); setFound(null); setQuery(""); }}>← Show all 5 lanes</button>
        )}
        {shown.map((r) => <TeamCard key={r.n} r={r} />)}
      </section>

      {/* The 60 minutes */}
      <section className="ta-card">
        <div className="lbl">The 60 minutes · 4 phases</div>
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

      {/* What the buildings are worth */}
      <section className="ta-card">
        <div className="lbl">Know what you're capturing</div>
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

      {/* Your 3 marches */}
      <section className="ta-card">
        <div className="lbl">Your 3 marches · heroes</div>
        <div className="ta-squads">
          <div className="ta-squad s1"><b>March 1</b><span>Your 3 STRONGEST heroes — it fights first and most</span></div>
          <div className="ta-squad"><b>March 2</b><span>The 3 strongest that are left</span></div>
          <div className="ta-squad"><b>March 3</b><span>The rest</span></div>
        </div>
        <div className="ta-locked">
          <div className="ta-locked-icons">
            <img src={ICON.inf} alt="Infantry" /><img src={ICON.cav} alt="Cavalry" /><img src={ICON.arch} alt="Archery" />
          </div>
          <p className="ta-p">Troops are <b>LOCKED</b>: every march carries 100k Infantry + 100k Cavalry + 100k Archery. You can't change it — your ONLY decision is which heroes go where. Strongest first.</p>
        </div>
        <div className="ta-avoid">❌ Avoid: Diana (no battle skills) · blue-tier heroes</div>
      </section>

      {/* Rules that decide the game */}
      <section className="ta-card">
        <div className="lbl">Rules that decide the game</div>
        <div className="ta-rules">
          {RULES.map((r) => (
            <div key={r.t} className="ta-rule"><span className="ta-rule-i">{r.i}</span><div><b>{r.t}</b><p>{r.d}</p></div></div>
          ))}
        </div>
      </section>

      {/* Before the battle */}
      <section className="ta-card">
        <div className="lbl">Before the battle · switch your buffs on</div>
        <p className="ta-p" style={{ margin: 0 }}>
          <b style={{ color: "var(--inf)" }}>✅ Works here:</b> Position · Pet · Territory · combat Town Buffs · Outpost<br />
          <b style={{ color: "var(--arch)" }}>❌ Does nothing:</b> Deployment Capacity · March buffs · King's Perks · Ministry · Alliance Territory
        </p>
      </section>

      <div className="foot">Battle plan v3 · Confirm your lane with your Lane Leader · Check the pinned messages</div>
    </div>
  );
}
