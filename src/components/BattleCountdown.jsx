import React, { useState, useEffect } from "react";

/* Live countdown to the battle. Swap the target date here for the next cycle. */
export const BATTLE_START = "2026-07-11T14:00:00Z";
export const BATTLE_MINUTES = 60;

const pad = (n) => String(n).padStart(2, "0");

export default function BattleCountdown({ target = BATTLE_START, durationMin = BATTLE_MINUTES }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const start = new Date(target).getTime();
  const end = start + durationMin * 60000;

  let body;
  if (now < start) {
    const s = Math.floor((start - now) / 1000);
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    body = (
      <div className="cd-nums" role="timer" aria-label="Countdown to battle">
        <Cell v={pad(d)} l="Days" /><Sep /><Cell v={pad(h)} l="Hours" /><Sep /><Cell v={pad(m)} l="Min" /><Sep /><Cell v={pad(sec)} l="Sec" />
      </div>
    );
  } else if (now < end) {
    body = <div className="cd-live">⚔ BATTLE IN PROGRESS</div>;
  } else {
    body = <div className="cd-done">Battle completed — next cycle soon</div>;
  }

  return (
    <section className="cd">
      <div className="lbl">Next battle starts in</div>
      {body}
      <div className="cd-ctx">TODAY · Saturday, July 11 · 14:00 UTC · 11:00 São Paulo · 15:00 London · 23:00 Tokyo</div>
    </section>
  );
}

function Cell({ v, l }) {
  return (
    <div className="cd-cell">
      <div className="cd-v metal">{v}</div>
      <div className="cd-l">{l}</div>
    </div>
  );
}
function Sep() { return <div className="cd-sep metal">:</div>; }
