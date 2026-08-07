import React from "react";

/* ============================================================
   TROOP TIER BADGES — T9, T10, TG1…TG8
   Drawn as SVG so they stay crisp at any size and need no
   background removal. TG tiers are gold, T9/T10 are steel grey.
   Swap in the game's own art later by pointing at image URLs.
   ============================================================ */

export const TIERS = ["T9", "T10", "TG1", "TG2", "TG3", "TG4", "TG5", "TG6", "TG7", "TG8"];

/** Higher is better. Unset sorts last. Mirrors public.tier_rank() in SQL. */
export const tierRank = (t) => {
  const i = TIERS.indexOf(t);
  return i < 0 ? 0 : i + 1;
};

export const isGolden = (t) => typeof t === "string" && t.startsWith("TG");

/* regular octagon inscribed in a 24x24 box */
const OCT = "21.7,16.02 16.02,21.7 7.98,21.7 2.3,16.02 2.3,7.98 7.98,2.3 16.02,2.3 21.7,7.98";
const INNER = "19.3,14.9 14.9,19.3 9.1,19.3 4.7,14.9 4.7,9.1 9.1,4.7 14.9,4.7 19.3,9.1";

export default function TierIcon({ tier, size = 22, title }) {
  if (!tier || !TIERS.includes(tier)) return null;
  const gold = isGolden(tier);
  const n = gold ? tier.slice(2) : tier.slice(1);   // TG3 -> "3" · T10 -> "10"
  const uid = `ti-${tier}`;

  const face = gold
    ? { a: "#ffe9a8", b: "#e8b64a", c: "#a8781f", rim: "#6b4a12" }
    : { a: "#e8eef4", b: "#9aa9b8", c: "#5d6b79", rim: "#39434e" };

  return (
    <svg className="tier-ic" width={size} height={size} viewBox="0 0 24 24"
         role="img" aria-label={title || tier}>
      <title>{title || tier}</title>
      <defs>
        <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={face.a} />
          <stop offset="0.48" stopColor={face.b} />
          <stop offset="1" stopColor={face.c} />
        </linearGradient>
      </defs>

      {/* rim + face */}
      <polygon points={OCT} fill={face.rim} />
      <polygon points={INNER} fill={`url(#${uid}-g)`} stroke={face.rim} strokeWidth="0.7" />
      {/* top highlight so it reads as metal */}
      <polygon points="14.9,4.7 9.1,4.7 4.7,9.1 4.7,10.6 19.3,10.6 19.3,9.1"
               fill="#ffffff" opacity={gold ? 0.28 : 0.34} />

      <text x="12" y="12" textAnchor="middle" dominantBaseline="central"
            fill="#22180a" stroke={face.a} strokeWidth="0.5" paintOrder="stroke"
            style={{
              font: `800 ${n.length > 1 ? 9.4 : 12}px system-ui, -apple-system, sans-serif`,
              letterSpacing: n.length > 1 ? "-0.4px" : 0,
            }}>
        {n}
      </text>
    </svg>
  );
}

/** Picker used in the member sheet. `value` may be "" (none). */
export function TierPicker({ value, onChange }) {
  return (
    <div className="tier-picker">
      <button type="button" className={`tier-opt${!value ? " sel" : ""}`}
              onClick={() => onChange("")} aria-label="Sem nível">
        <span className="tier-none">—</span>
      </button>
      {TIERS.map((t) => (
        <button type="button" key={t} className={`tier-opt${value === t ? " sel" : ""}`}
                onClick={() => onChange(t)} aria-label={t} title={t}>
          <TierIcon tier={t} size={26} />
        </button>
      ))}
    </div>
  );
}
