import React, { useState } from "react";
import BattleCountdown from "../components/BattleCountdown.jsx";

/* ============================================================
   /tri-alliance — Ultimate Tri-Alliance Clash battle guide
   Static content page (no Supabase). English (intl alliance).
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

function BattleMap() {
  const [active, setActive] = useState(null);
  const dim = (n) => (active !== null && active !== n ? 0.14 : 1);

  /* schematic node positions (viewBox 0 0 360 320) */
  const N = {
    B1: [35, 45], B24: [150, 90], B29: [205, 78],
    A19: [60, 232], A24: [95, 266], A25: [152, 252], A28: [130, 214], A29: [187, 236], A30: [232, 214],
    C24: [300, 142], C27: [286, 88], C29: [263, 172], C31: [316, 202],
  };
  const paths = {
    1: [[35, 55], [42, 120], [50, 180], N.A19, N.A24],
    2: [[55, 50], [90, 120], [113, 172], N.A28, N.A25],
    3: [[75, 45], [120, 102], [155, 172], N.A29],
    4: [[100, 40], [162, 62], N.B29, [228, 140], N.A30, N.A29],
    5: [[120, 35], N.B24, [225, 100], [275, 148], N.C31],
  };
  const holds = [
    { at: N.A24, c: "#f0564e" }, { at: N.A25, c: "#f2d054" }, { at: N.C24, c: "#4ad0e0" },
    { at: N.C29, c: "#4a90f2" }, { at: N.B24, c: "#a878f0" }, { at: N.B29, c: "#a878f0" },
  ];
  const star = (x, y) => `M${x},${y - 7} l1.9,4 4.4,.5 -3.2,3 .8,4.3 -3.9,-2.1 -3.9,2.1 .8,-4.3 -3.2,-3 4.4,-.5 Z`;

  return (
    <div>
      <svg className="ta-map" viewBox="0 0 360 320" role="img" aria-label="Schematic battlefield map: zone B northwest (us), zone A south, zone C east, Temple in the center, five colored routes">
        <rect x="1" y="1" width="358" height="318" rx="12" fill="#0a0e13" stroke="#2c3a49" />
        {/* zone tints */}
        <ellipse cx="80" cy="70" rx="105" ry="80" fill="#ecc25a" opacity="0.05" />
        <ellipse cx="170" cy="272" rx="150" ry="62" fill="#f0564e" opacity="0.05" />
        <ellipse cx="312" cy="140" rx="72" ry="95" fill="#4ad0e0" opacity="0.05" />
        <text x="26" y="26" className="ta-zone" fill="#ecc25a">B · US</text>
        <text x="150" y="308" className="ta-zone" fill="#f0564e">A · ENEMY</text>
        <text x="300" y="42" className="ta-zone" fill="#4ad0e0">C · ENEMY</text>

        {/* routes */}
        {Object.entries(paths).map(([n, pts]) => (
          <polyline key={n} points={pts.map((p) => p.join(",")).join(" ")} fill="none"
            stroke={ROUTES[n - 1].color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="1 7" opacity={dim(Number(n))} style={{ transition: "opacity .2s" }} />
        ))}

        {/* Temple */}
        <g>
          <path d="M180 136 l14 14 -14 14 -14 -14 Z" fill="#ecc25a" stroke="#ffe08a" strokeWidth="1.5" />
          <text x="180" y="176" textAnchor="middle" className="ta-node-lbl" fill="#ffe08a">TEMPLE</text>
        </g>

        {/* nodes */}
        {Object.entries(N).map(([k, [x, y]]) => (
          <g key={k}>
            <circle cx={x} cy={y} r="5.5" fill="#1e2a35" stroke="#647787" strokeWidth="1.2" />
            <text x={x} y={y - 9} textAnchor="middle" className="ta-node-lbl" fill="#a7b6c6">{k}{k === "B1" ? " HQ" : ""}</text>
          </g>
        ))}

        {/* hold pins */}
        {holds.map((h, i) => (
          <path key={i} d={star(h.at[0], h.at[1])} fill={h.c} stroke="#0a0e13" strokeWidth="0.8" />
        ))}
      </svg>
      <div className="ta-map-legend">
        {ROUTES.map((r) => (
          <button key={r.n} className={`ta-leg${active === r.n ? " on" : ""}`}
            style={{ color: r.color, boxShadow: `inset 0 0 0 1px ${r.color}${active === r.n ? "" : "55"}` }}
            onClick={() => setActive(active === r.n ? null : r.n)}>
            <i style={{ background: r.color }}></i>R{r.n}
          </button>
        ))}
      </div>
      <div className="ta-note">★ = hold positions (Mid-game Hold Plan) · tap a route to highlight it</div>
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
      {/* 1 · Header */}
      <header className="ta-header">
        <div className="eyebrow" style={{ color: "var(--gold)" }}>Alliance Command · Kingdom 1652</div>
        <h1 className="ta-title metal">Ultimate Tri-Alliance Clash</h1>
        <div className="ta-subtitle">Complete battle plan · 60-minute war for map control</div>
      </header>

      {/* 2 · Countdown */}
      <BattleCountdown />

      {/* 3 · Highlight stats */}
      <div className="ta-stats">
        <div className="ta-stat"><b className="metal">60</b><span>min battle</span></div>
        <div className="ta-stat"><b className="metal">50,000</b><span>Temple first-capture bonus</span></div>
        <div className="ta-stat"><b className="metal">1,800</b><span>pts/min per Garrison/Temple</span></div>
      </div>

      {/* 4 · Event overview */}
      <section className="ta-card">
        <div className="lbl">Event overview</div>
        <div className="ta-kv"><span>Format</span><b>3 alliances battle for map control</b></div>
        <div className="ta-kv"><span>Duration</span><b>60 minutes (4 phases)</b></div>
        <div className="ta-kv"><span>Frequency</span><b>Monthly (4-week cycle)</b></div>
        <div className="ta-kv"><span>Battle day</span><b>Saturday · slots (UTC): 02:00 / 12:00 / 14:00 / 19:00 / 21:00</b></div>
        <div className="ta-kv"><span>Victory</span><b>Most points when the timer ends</b></div>
        <div className="ta-kv"><span>Squads</span><b>Each player fields 3 squads of 3 heroes</b></div>
      </section>

      {/* 5 · Phase timeline */}
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

      {/* 6 · Map */}
      <section className="ta-card">
        <div className="lbl">Battlefield map · schematic</div>
        <BattleMap />
      </section>

      {/* 7 · Battle plan — 5 routes */}
      <section className="ta-plan">
        <div className="eyebrow" style={{ color: "var(--gold)" }}>DAD Battle Plan · 5 routes × 6 players</div>
        <div className="ta-plan-stats">30 players · 3 Attackers + 3 Defenders per route · 5 Lane Leaders · main offensive focus: side A</div>
        {ROUTES.map((r) => <RouteCard key={r.n} r={r} />)}
      </section>

      {/* 8 · Mid-game hold plan */}
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

      {/* 9 · Roles + Lane Leaders */}
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

      {/* 10 · Heroes & squads */}
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

      {/* 11 · Essential rules */}
      <section className="ta-card">
        <div className="lbl">Essential rules</div>
        <div className="ta-rules">
          {RULES.map((r) => (
            <div key={r.t} className="ta-rule"><span className="ta-rule-i">{r.i}</span><div><b>{r.t}</b><p>{r.d}</p></div></div>
          ))}
        </div>
      </section>

      {/* 12 · Tactical discipline */}
      <section className="ta-card">
        <div className="lbl">Tactical discipline</div>
        <ul className="ta-ul">{DISCIPLINE.map((d) => <li key={d}>{d}</li>)}</ul>
      </section>

      {/* 13 · Buffs */}
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

      {/* 14 · Eligibility */}
      <section className="ta-card">
        <div className="lbl">Eligibility</div>
        <div className="ta-kv"><span>Alliance</span><b>Top 20 kingdom power · Lv 6+ and 40+ actives for a 2nd legion · min 15 per legion</b></div>
        <div className="ta-kv"><span>Player</span><b>Town Center 16+ · not inactive 5+ days · registered Wed–Thu · substitutes count in matchmaking</b></div>
      </section>

      {/* 15 · Weekly schedule */}
      <section className="ta-card">
        <div className="lbl">Weekly schedule</div>
        <div className="ta-week">
          <span>🗳 Mon–Tue<br /><b>Voting</b></span><i>→</i>
          <span>📝 Wed–Thu<br /><b>Registration</b></span><i>→</i>
          <span>🎲 Fri<br /><b>Matchmaking</b></span><i>→</i>
          <span className="hot">⚔ Sat<br /><b>Battle (60 min)</b></span>
        </div>
      </section>

      {/* 16 · Rewards */}
      <section className="ta-card">
        <div className="lbl">Rewards</div>
        <div className="ta-kv"><span>Alliance</span><b>Ranking rewards (Legion 1's placement) — Tidal Stone Coins, gems, resources</b></div>
        <div className="ta-kv"><span>Personal</span><b>Ranking + merit rewards (need 10,000 Merit Points to qualify) — avatar frames, hero fragments, speedups</b></div>
        <div className="ta-kv"><span>Event store</span><b>Tidal Stone Coins · items refresh every 2 weeks</b></div>
      </section>

      {/* 17 · Footer */}
      <div className="foot">Battle plan v2 · Confirm your route with your Lane Leader before Saturday · Check the pinned messages</div>
    </div>
  );
}
