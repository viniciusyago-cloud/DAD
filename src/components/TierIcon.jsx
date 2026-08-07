import React from "react";

/* ============================================================
   TROOP TIER BADGES — T9, T10, TG1…TG8
   TG art is the game's own (kingshotdata.kr), already shipped
   with a transparent background. T9/T10 are the same medallion
   desaturated to steel, since the game has no art for them.
   ============================================================ */

export const TIERS = ["T9", "T10", "TG1", "TG2", "TG3", "TG4", "TG5", "TG6", "TG7", "TG8"];

const SRC = {
  T9: "/tiers/T9.png",
  T10: "/tiers/T10.png",
  TG1: "/tiers/TG1.webp", TG2: "/tiers/TG2.webp", TG3: "/tiers/TG3.webp", TG4: "/tiers/TG4.webp",
  TG5: "/tiers/TG5.webp", TG6: "/tiers/TG6.webp", TG7: "/tiers/TG7.webp", TG8: "/tiers/TG8.webp",
};

export const tierSrc = (t) => SRC[t] || null;

/** Higher is better. Unset sorts last. Mirrors public.tier_rank() in SQL. */
export const tierRank = (t) => {
  const i = TIERS.indexOf(t);
  return i < 0 ? 0 : i + 1;
};

export default function TierIcon({ tier, size = 22, title }) {
  const src = tierSrc(tier);
  if (!src) return null;
  return (
    <img className="tier-ic" src={src} width={size} height={size}
         alt={title || tier} title={title || tier} loading="lazy" />
  );
}

/** Picker used in the member sheet. `value` may be "" (none). */
export function TierPicker({ value, onChange }) {
  return (
    <div className="tier-picker">
      <button type="button" className={`tier-opt${!value ? " sel" : ""}`}
              onClick={() => onChange("")} aria-label="Sem nível" title="Sem nível">
        <span className="tier-none">—</span>
      </button>
      {TIERS.map((t) => (
        <button type="button" key={t} className={`tier-opt${value === t ? " sel" : ""}`}
                onClick={() => onChange(t)} aria-label={t} title={t}>
          <TierIcon tier={t} size={30} />
        </button>
      ))}
    </div>
  );
}
