import React, { useState, useEffect } from "react";
import Pic, { imgSrc } from "./imgedit/Pic.jsx";

/* ============================================================
   COUNTDOWN — one rich implementation for the whole site.
   There used to be two (a plain one and the battle one); they
   are the same block now, and every part of it is adjustable.
   ============================================================ */

const FONT_STACK = {
  display: "var(--font-display)",
  sans: "var(--font-sans)",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const pad = (n) => String(n).padStart(2, "0");

export default function Countdown({ b }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const start = b.target ? new Date(b.target).getTime() : NaN;
  const end = start + (Number(b.durationMin) || 0) * 60000;

  if (!b.target || Number.isNaN(start)) {
    return <div className="cd-done">Set the event date</div>;
  }
  if (now >= start && now < end) {
    return (
      <div className="cd-live">
        {imgSrc(b.liveIcon) && <Pic v={b.liveIcon} alt="" />}
        {b.liveText || "IN PROGRESS"}
      </div>
    );
  }
  if (now >= start) {
    return <div className="cd-done">{b.doneText || "It has started!"}</div>;
  }

  /* remaining time, folding hidden units into the next one down */
  const total = Math.floor((start - now) / 1000);
  const show = {
    d: b.showDays !== false, h: b.showHours !== false,
    m: b.showMin !== false, s: b.showSec !== false,
  };
  let rest = total;
  const cells = [];
  if (show.d) { cells.push([Math.floor(rest / 86400), b.labelDays || "Days"]); rest %= 86400; }
  if (show.h) { cells.push([Math.floor(rest / 3600), b.labelHours || "Hours"]); rest %= 3600; }
  if (show.m) { cells.push([Math.floor(rest / 60), b.labelMin || "Min"]); rest %= 60; }
  if (show.s) { cells.push([rest, b.labelSec || "Sec"]); }
  if (!cells.length) cells.push([Math.floor(total / 3600), "Hours"]);

  const numStyle = {
    fontFamily: FONT_STACK[b.numFont || "display"],
    fontSize: b.numSize ? `${b.numSize}px` : undefined,
    color: b.numMetal === false ? (b.numColor || undefined) : undefined,
  };
  const unitStyle = {
    fontSize: b.unitSize ? `${b.unitSize}px` : undefined,
    color: b.unitColor || undefined,
  };
  const sep = b.sep === "none" ? null : b.sep === "dot" ? "·" : ":";
  const metal = b.numMetal !== false;

  return (
    <div className={`cd-nums cell-${b.cell || "panel"}`}>
      {cells.map(([v, l], i) => (
        <React.Fragment key={l}>
          {i > 0 && sep && <div className={`cd-sep${metal ? " metal" : ""}`} style={numStyle}>{sep}</div>}
          <div className="cd-cell">
            <div className={`cd-v${metal ? " metal" : ""}`} style={numStyle}>{pad(v)}</div>
            <div className="cd-l" style={unitStyle}>{l}</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
