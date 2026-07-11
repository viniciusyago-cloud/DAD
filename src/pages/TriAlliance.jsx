import React, { useState } from "react";
import BattleCountdown from "../components/BattleCountdown.jsx";

/* ============================================================
   /tri-alliance — Ultimate Tri-Alliance Clash battle guide
   Real game assets: full battlefield map (all building codes)
   with our 5 routes drawn on top, real building images.
   ============================================================ */

const ICON = { inf: "/troops/infantry.png", cav: "/troops/cavalry.png", arch: "/troops/archer.png" };

/* Route colors match the alliance's hand-drawn map */
const ROUTES = [
  {
    n: 1, color: "#f0564e", name: "Deep Left Flank",
    objective: "Push the far-left flank and pressure enemy Garrison A24 via A19",
    path: ["B1", "B4", "B8", "B12", "B18", "A19", "A24"],
    attackers: ["JoDee", "Sabo", "Jenny"], defenders: ["Toady", "Imrail", "Moon"], sub: "Panda",
    timing: "Advance in Phase 2 · reach A19 ~min 15 · pressure A24 in Phase 3",
  },
  {
    n: 2, color: "#f2d054", name: "Left Attack Corridor",
    objective: "Central-left lane toward A28 / A25",
    path: ["B3", "B6", "B11", "B17", "B23", "A28", "A25"],
    attackers: ["Johann", "Nanya", "Araz"], defenders: ["!!!Skill", "OVI", "Fong"], sub: "Juyopert",
    timing: "Aggressive push from ~min 5 · engage A28 ~min 15",
  },
  {
    n: 3, color: "#4ad0e0", name: "Central Push",
    objective: "Central corridor to A29 (enemy Transit route — cutting it blocks their Temple access)",
    path: ["B5", "B10", "B16", "B22", "B27", "A29"],
    attackers: ["Salles", "Fgr1", "Www"], defenders: ["Oxy", "Leclerc", "Rumiko"], sub: "Beske",
    timing: "Core lane · aim to threaten A29 by ~min 25",
  },
  {
    n: 4, color: "#4a90f2", name: "Right-Center Assault",
    objective: "Secure our B29 / B31 and pressure A30 → A29",
    path: ["B9", "B14", "B21", "B29", "B31", "A30", "A29"],
    attackers: ["IK33", "Epson", "Mastergwyn"], defenders: ["Jungki Oppa", "RF", "Neduts"], sub: "Eyin",
    timing: "Secure B29 early (~min 10) · ready to converge on the Temple at min 40",
  },
  {
    n: 5, color: "#a878f0", name: "Right Defense + C Pressure",
    objective: "DEFENSIVE — protect our Garrison B24; apply pressure toward C27 / C31 when safe",
    path: ["B13", "B19", "B20", "B24", "B28", "C31"],
    attackers: ["Yam", "Hammelbock", "KZ"], defenders: ["Susu", "Bear", "Sadie"], sub: "Open slot — to be filled",
    timing: "Defenders anchor B24 immediately · Attackers push the right flank",
    warning: "Defense priority: B24 is NEVER left unattended",
  },
];

const PHASES = [
  {
    n: 1, name: "Preparation", span: "0–3 min", color: "#90a2b6",
    points: [
      "Assign Building Captains ASAP (boosts alliance energy regen)",
      "Confirm route assignments; pin them in alliance chat",
      "No combat yet",
      "Reminder: save 30–40% energy for min 20",
    ],
  },
  {
    n: 2, name: "Seize & Conquer", span: "3–20 min", color: "#ecc25a",
    points: [
      "Priority: capture Transit Hubs (mobility for the whole match)",
      "Take neutral buildings on our side; push into enemy side for early points",
      "Garrisons are still SHIELDED — cannot be captured yet",
      "Each route advances along its assigned path (see Battle Plan)",
    ],
  },
  {
    n: 3, name: "Garrison Occupation", span: "20–40 min", color: "#f2824a",
    points: [
      "Garrisons (A24 · B24 · C24) unlock → 1,800 pts/min each (3× a normal building)",
      "Priority 1: hold OUR Garrison B24",
      "Priority 2: capture enemy Garrisons",
      "Defenders move to their HOLD positions (see Mid-game Hold Plan)",
    ],
  },
  {
    n: 4, name: "Temple Onslaught", span: "40–60 min", color: "#ffe08a",
    points: [
      "Temple of Tides opens in the center: first capture = +50,000 pts, then 1,800 pts/min while held",
      "Attackers converge and hit the Temple TOGETHER (burst, not one-by-one)",
      "Final Blow Rule: the alliance landing the last hit on the final guard takes the Temple",
      "If another alliance captures first: retake — the Temple keeps generating points",
    ],
  },
];

const BUILDINGS = [
  { img: "/tri/temple.jpg", name: "Temple of Tides", codes: "Center of the map", pts: "+1,800/min", note: "Opens at min 40 · first capture +50,000 pts", hot: true },
  { img: "/tri/garrison.jpg", name: "Garrison", codes: "A24 · B24 · C24", pts: "+1,800/min", note: "Shielded until min 20 · 3× a normal building" },
  { img: "/tri/hq.jpg", name: "Alliance HQ", codes: "A1 · B1 · C1", pts: "+1,800/min", note: "Your spawn point — defeated squads respawn here" },
  { img: "/tri/transit.jpg", name: "Transit Hub", codes: "Ring platforms", pts: "+60/min", note: "Fast travel across the map — Phase 2 priority" },
  { img: "/tri/tower.jpg", name: "Watchtower", codes: "Lane buildings", pts: "+180–600/min", note: "Standard capture points along every route" },
];

const HOLDS = [
  { g: "D1", b: "A24", role: "Hold enemy Garrison A after capture", color: "#f0564e" },
  { g: "D2", b: "A25 / A26", role: "Hold the southern corridor", color: "#f2d054" },
  { g: "D3", b: "C24", role: "Pressure/hold enemy Garrison C", color: "#4ad0e0" },
  { g: "D4", b: "C29", role: "Cut enemy C's Temple access", color: "#4a90f2" },
  { g: "D5", b: "B24", role: "Permanent defense of OUR Garrison", color: "#a878f0" },
  { g: "A5", b: "B29", role: "Protect OUR Temple access route", color: "#a878f0" },
];

const RULES = [
  { i: "⚡", t: "Energy", d: "Powers movement, attack, retreat, heal, revive; Building Captains boost regen" },
  { i: "🚫", t: "Skip Rule", d: "You can only skip past an enemy building if total squads there exceed 5" },
  { i: "⚔", t: "5-March Rule", d: "5 allied marches engaging an enemy building open the way forward (each march fights ~50s)" },
  { i: "🎯", t: "Final Blow Rule", d: "At the Temple, the last hit takes full control" },
  { i: "📋", t: "Squad Queue", d: "Squads fight in arrival order; losers respawn at HQ" },
  { i: "🔒", t: "Lock Rule", d: "You cannot leave the alliance during the battle" },
  { i: "💊", t: "Conscription", d: "Heal troops only inside captured buildings NOT in combat" },
  { i: "🎖", t: "3 Squads", d: "Every player fields 3 squads of 3 heroes" },
];

const DISCIPLINE = [
  "Assign Captains in the first 60s (R4/R5 responsibility)",
  "Do NOT chase kills — points win, kills don't",
  "Protect Transit Hubs — losing them cuts the Temple route",
  "Temple burst: attack together at min 40, never one-by-one",
  "Retreat one building back to heal instead of dying (respawning at HQ wastes time and energy)",
  "Pin route assignments and phase timings in alliance chat",
  "Short universal calls: building codes (A24) and times (min 20) work in every language",
  "Save pet/city/position buffs for this event",
  "Keep 30–40% energy for min 20",
];

const Tag = ({ children, color }) => (
  <span className="ta-tag" style={color ? { color, boxShadow: `inset 0 0 0 1px ${color}55` } : undefined}>{children}</span>
);

/* ---- Real battlefield map with our 5 routes drawn on top ----
   Coordinates are in the map's own 1920×1401 pixel space. */
const MAP_NODES = {
  B1: [125, 470], B3: [255, 450], B4: [185, 560], B5: [430, 235], B6: [340, 385],
  B8: [300, 625], B9: [575, 140], B10: [400, 350], B11: [395, 580], B12: [410, 700],
  B13: [730, 145], B14: [550, 250], B16: [480, 500], B17: [495, 625], B18: [310, 820],
  B19: [895, 190], B20: [820, 210], B21: [590, 325], B22: [560, 450], B23: [575, 580],
  B24: [750, 290], B27: [605, 695], B28: [880, 305], B29: [765, 455], B31: [760, 550],
  A19: [295, 990], A24: [690, 900], A25: [875, 895], A28: [795, 835], A29: [985, 835], A30: [895, 795],
  C24: [1235, 650], C29: [1155, 445], C31: [1065, 420],
};
const MAP_HOLDS = [
  { at: "A24", c: "#f0564e" }, { at: "A25", c: "#f2d054" }, { at: "C24", c: "#4ad0e0" },
  { at: "C29", c: "#4a90f2" }, { at: "B24", c: "#a878f0" }, { at: "B29", c: "#a878f0" },
];

function RealMap() {
  const [active, setActive] = useState(null);
  const dim = (n) => (active !== null && active !== n ? 0.12 : 1);
  const star = (x, y, s = 26) =>
    `M${x},${y - s} l${s * 0.28},${s * 0.6} ${s * 0.66},${s * 0.08} -${s * 0.48},${s * 0.45} ${s * 0.12},${s * 0.65} -${s * 0.58},${s * 0.32} -${s * 0.58},-${s * 0.32} ${s * 0.12},-${s * 0.65} -${s * 0.48},-${s * 0.45} ${s * 0.66},-${s * 0.08} Z`;
  return (
    <div>
      <div className="ta-realmap-wrap">
        <div className="ta-realmap">
          <img src="/tri/map.jpg" alt="Tri-Alliance Clash battlefield map with all building codes" loading="lazy" />
          <svg viewBox="0 0 1920 1401" preserveAspectRatio="none" aria-hidden="true">
            {ROUTES.map((r) => (
              <polyline key={r.n}
                points={r.path.map((b) => MAP_NODES[b].join(",")).join(" ")}
                fill="none" stroke={r.color} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="3 24" opacity={dim(r.n)} style={{ transition: "opacity .2s" }} />
            ))}
            {ROUTES.map((r) => r.path.map((b) => (
              <circle key={r.n + b} cx={MAP_NODES[b][0]} cy={MAP_NODES[b][1]} r="16"
                fill="none" stroke={r.color} strokeWidth="6" opacity={dim(r.n)} style={{ transition: "opacity .2s" }} />
            )))}
            {MAP_HOLDS.map((h, i) => (
              <path key={i} d={star(...MAP_NODES[h.at])} fill={h.c} stroke="#10151b" strokeWidth="3" />
            ))}
          </svg>
        </div>
      </div>
      <div className="ta-map-legend">
        {ROUTES.map((r) => (
          <button key={r.n} className={`ta-leg${active === r.n ? " on" : ""}`}
            style={{ color: r.color, boxShadow: `inset 0 0 0 1px ${r.color}${active === r.n ? "" : "55"}` }}
            onClick={() => setActive(active === r.n ? null : r.n)}>
            <i style={{ background: r.color }}></i>R{r.n}
          </button>
        ))}
      </div>
      <div className="ta-note">Real battle map — every building code is on it. Scroll the map sideways · tap a route to highlight it · ★ = hold positions.</div>
    </div>
  );
}

function RouteCard({ r }) {
  return (
    <article className="ta-route" style={{ boxShadow: `0 0 0 1px ${r.color}66, inset 0 1px 0 #ffffff0a, 0 3px 10px #00000055` }}>
      <div className="ta-route-head">
        <span className="ta-route-n" style={{ background: r.color }}>R{r.n}</span>
        <span className="ta-route-name">{r.name}</span>
      </div>
      <div className="ta-route-obj">{r.objective}</div>
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
          <div className="ta-col-h">⚔ Attackers</div>
          {r.attackers.map((a, i) => (
            <div key={a} className="ta-member">
              {i === 0 ? <span className="ta-lead-star">⭐</span> : <span className="ta-dot" style={{ background: r.color }}></span>}
              <span className="ta-member-name">{a}</span>
              {i === 0 && <span className="ta-lead-badge" style={{ color: r.color, boxShadow: `inset 0 0 0 1px ${r.color}66` }}>LEAD</span>}
            </div>
          ))}
        </div>
        <div>
          <div className="ta-col-h">🛡 Defenders</div>
          {r.defenders.map((d) => (
            <div key={d} className="ta-member"><span className="ta-dot" style={{ background: "#647787" }}></span><span className="ta-member-name">{d}</span></div>
          ))}
        </div>
      </div>
      <div className="ta-route-foot">
        <span className="ta-sub">Sub: {r.sub}</span>
        <span className="ta-timing">{r.timing}</span>
        {r.warning && <span className="ta-warn">⚠ {r.warning}</span>}
      </div>
    </article>
  );
}

export default function TriAlliance() {
  return (
    <div className="app ta">
      {/* 1 · Header — real battlefield backdrop */}
      <header className="banner ta-banner">
        <img src="/tri/header.jpg" alt="Temple of Tides at the center of the battlefield" />
        <div className="scrim"></div>
        <div className="b-in">
          <div className="eyebrow" style={{ color: "var(--gold)" }}>Alliance Command · Kingdom 1652</div>
          <div className="ta-title metal">Ultimate Tri-Alliance Clash</div>
          <div className="ta-subtitle">Complete battle plan · 60-minute war for map control</div>
        </div>
      </header>

      {/* 2 · Countdown */}
      <BattleCountdown />

      {/* 3 · Highlight stats */}
      <div className="ta-stats">
        <div className="ta-stat"><b className="metal">60</b><span>min battle</span></div>
        <div className="ta-stat"><b className="metal">50,000</b><span>Temple first-capture bonus</span></div>
        <div className="ta-stat"><b className="metal">1,800</b><span>pts/min per Garrison/Temple</span></div>
      </div>

      {/* 4 · Event overview + real registration screen */}
      <section className="ta-card">
        <div className="lbl">Event overview</div>
        <img className="ta-regmap" src="/tri/regmap.jpg" alt="In-game registration: Earth Guard, Storm Guard and Tidal Guard bases on the triangular battlefield" loading="lazy" />
        <div className="ta-kv"><span>Format</span><b>3 alliances battle for map control</b></div>
        <div className="ta-kv"><span>Duration</span><b>60 minutes (4 phases)</b></div>
        <div className="ta-kv"><span>Frequency</span><b>Monthly (4-week cycle)</b></div>
        <div className="ta-kv"><span>Battle day</span><b>Saturday · slots (UTC): 02:00 / 12:00 / 14:00 / 19:00 / 21:00</b></div>
        <div className="ta-kv"><span>Victory</span><b>Most points when the timer ends</b></div>
        <div className="ta-kv"><span>Squads</span><b>Each player fields 3 squads of 3 heroes</b></div>
      </section>

      {/* 5 · Key buildings — real in-game art */}
      <section className="ta-card">
        <div className="lbl">Key buildings · know what you're capturing</div>
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

      {/* 6 · Phase timeline */}
      <section className="ta-card">
        <div className="lbl">Battle timeline · 4 phases</div>
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

      {/* 7 · Real battlefield map with our routes */}
      <section className="ta-card">
        <div className="lbl">Battlefield map · our 5 routes</div>
        <RealMap />
      </section>

      {/* 8 · Battle plan — 5 routes */}
      <section className="ta-plan">
        <div className="eyebrow" style={{ color: "var(--gold)" }}>DAD Battle Plan · 5 routes × 6 players</div>
        <div className="ta-plan-stats">30 players · 3 Attackers + 3 Defenders per route · 5 Lane Leaders · main offensive focus: side A</div>
        {ROUTES.map((r) => <RouteCard key={r.n} r={r} />)}
      </section>

      {/* 9 · Mid-game hold plan */}
      <section className="ta-card">
        <div className="eyebrow" style={{ color: "var(--gold)" }}>Mid-game Hold Plan · from ~min 15–20</div>
        <p className="ta-p">Once the initial advance is done and Garrisons open (min 20), Defender groups anchor the priority buildings closest to their position. Attackers stay mobile for pressure and the Temple push.</p>
        <div className="ta-holds">
          {HOLDS.map((h) => (
            <div key={h.g + h.b} className="ta-hold">
              <span className="ta-hold-g" style={{ color: h.color, boxShadow: `inset 0 0 0 1px ${h.color}66` }}>{h.g}</span>
              <Tag>{h.b}</Tag>
              <span className="ta-hold-role">{h.role}</span>
            </div>
          ))}
        </div>
        <div className="ta-note">Groups crossing the map (D3, D4) should use Transit Hubs for mobility.</div>
        <div className="ta-note">A1–A4 (12 attackers) remain mobile: keep pressure, then converge on the Temple at min 40.</div>
      </section>

      {/* 10 · Roles + Lane Leaders */}
      <div className="ta-2col">
        <section className="ta-card">
          <div className="ta-role-h">⚔ Attacker</div>
          <div className="ta-role-sub">3 per route · 15 total</div>
          <p className="ta-p">Captures keypoints, pushes enemy territory, keeps frontline pressure, rotates out to heal; strongest heroes in Squad 1. The FIRST attacker of each route is the Lane Leader.</p>
        </section>
        <section className="ta-card">
          <div className="ta-role-h">🛡 Defender</div>
          <div className="ta-role-sub">3 per route · 15 total</div>
          <p className="ta-p">Holds the building behind the attackers, steps in during heal rotations, prevents breakthroughs, anchors the mid-game hold positions.</p>
        </section>
      </div>
      <section className="ta-card">
        <div className="lbl">⭐ Lane Leaders — one per route</div>
        <div className="ta-leads">
          {ROUTES.map((r) => (
            <span key={r.n} className="ta-leadchip" style={{ color: r.color, boxShadow: `inset 0 0 0 1px ${r.color}66` }}>
              {r.attackers[0]} <small>R{r.n}</small>
            </span>
          ))}
        </div>
        <p className="ta-p">Coordinate the route in real time and make the tactical calls for their 5 teammates.</p>
      </section>

      {/* 11 · Heroes & squads */}
      <section className="ta-card">
        <div className="eyebrow" style={{ color: "var(--gold)" }}>Hero setup · 3 squads × 3 heroes · 300k troops each (fixed)</div>
        <div className="ta-squads">
          <div className="ta-squad s1"><b>Squad 1</b><span>Strongest trio — faces the hardest fights first</span></div>
          <div className="ta-squad"><b>Squad 2</b><span>Mid strength</span></div>
          <div className="ta-squad"><b>Squad 3</b><span>Support</span></div>
        </div>
        <div className="ta-kv"><span>Squad 1 combos</span><b>Amadeus + Jabel + Saul &nbsp;·&nbsp; Amadeus + Hilde + Marlin</b></div>
        <div className="ta-locked">
          <div className="ta-locked-icons">
            <img src={ICON.inf} alt="Infantry" /><img src={ICON.cav} alt="Cavalry" /><img src={ICON.arch} alt="Archery" />
          </div>
          <p className="ta-p">Unlike other events, troop composition is <b>LOCKED</b>: 100k Apex Infantry + 100k Apex Cavalry + 100k Apex Archery per squad. You cannot change the ratio — your only choice is which heroes go where. Put your <b>STRONGEST</b> heroes in Squad 1.</p>
        </div>
        <div className="ta-avoid">❌ Avoid: Diana (no battle skills) · Blue-tier heroes (underperform here)</div>
      </section>

      {/* 12 · Essential rules */}
      <section className="ta-card">
        <div className="lbl">Essential rules</div>
        <div className="ta-rules">
          {RULES.map((r) => (
            <div key={r.t} className="ta-rule"><span className="ta-rule-i">{r.i}</span><div><b>{r.t}</b><p>{r.d}</p></div></div>
          ))}
        </div>
      </section>

      {/* 13 · Tactical discipline */}
      <section className="ta-card">
        <div className="lbl">Tactical discipline</div>
        <ul className="ta-ul">{DISCIPLINE.map((d) => <li key={d}>{d}</li>)}</ul>
      </section>

      {/* 14 · Buffs */}
      <div className="ta-2col">
        <section className="ta-card">
          <div className="ta-buff-h ok">✅ Effective</div>
          <ul className="ta-ul">
            <li>Position</li><li>Pet</li><li>Territory</li><li>Combat Town Buffs</li><li>Outpost</li>
          </ul>
        </section>
        <section className="ta-card">
          <div className="ta-buff-h no">❌ No effect</div>
          <ul className="ta-ul">
            <li>Deployment Capacity</li><li>March buffs</li><li>King's Perks</li><li>Ministry positions</li><li>Alliance Territory bonuses</li>
          </ul>
        </section>
      </div>

      {/* 15 · Eligibility */}
      <section className="ta-card">
        <div className="lbl">Eligibility</div>
        <div className="ta-kv"><span>Alliance</span><b>Top 20 kingdom power · Lv 6+ and 40+ actives for a 2nd legion · min 15 per legion</b></div>
        <div className="ta-kv"><span>Player</span><b>Town Center 16+ · not inactive 5+ days · registered Wed–Thu · substitutes count in matchmaking</b></div>
      </section>

      {/* 16 · Weekly schedule */}
      <section className="ta-card">
        <div className="lbl">Weekly schedule</div>
        <div className="ta-week">
          <span>🗳 Mon–Tue<br /><b>Voting</b></span><i>→</i>
          <span>📝 Wed–Thu<br /><b>Registration</b></span><i>→</i>
          <span>🎲 Fri<br /><b>Matchmaking</b></span><i>→</i>
          <span className="hot">⚔ Sat<br /><b>Battle (60 min)</b></span>
        </div>
      </section>

      {/* 17 · Rewards */}
      <section className="ta-card">
        <div className="lbl">Rewards</div>
        <div className="ta-kv"><span>Alliance</span><b>Ranking rewards (Legion 1's placement) — Tidal Stone Coins, gems, resources</b></div>
        <div className="ta-kv"><span>Personal</span><b>Ranking + merit rewards (need 10,000 Merit Points to qualify) — avatar frames, hero fragments, speedups</b></div>
        <div className="ta-kv"><span>Event store</span><b>Tidal Stone Coins · items refresh every 2 weeks</b></div>
      </section>

      {/* 18 · Footer */}
      <div className="foot">Battle plan v2 · Confirm your route with your Lane Leader before Saturday · Check the pinned messages</div>
    </div>
  );
}
