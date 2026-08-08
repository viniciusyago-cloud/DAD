import React from "react";
import { Rich } from "./BlockView.jsx";
import Pic, { imgSrc } from "./imgedit/Pic.jsx";

/* ============================================================
   MARCH / SQUAD — three heroes and the troop split behind them,
   plus room to explain why the squad is built that way.
   ============================================================ */

const LANES = [
  { k: "inf",  l: "Infantry", icon: "/troops/infantry.png", cls: "inf" },
  { k: "cav",  l: "Cavalry",  icon: "/troops/cavalry.png",  cls: "cav" },
  { k: "arch", l: "Archery",  icon: "/troops/archer.png",   cls: "arch" },
];

export default function March({ b }) {
  const size = b.heroSize || 62;
  const mode = b.mode || "pct";

  return (
    <div className={(b.cols || 1) > 1 ? "grid" : "stack"} style={{ "--c": b.cols || 1 }}>
      {(b.items || []).map((m, i) => {
        const pcts = LANES.map((L) => Math.max(0, Number(m[`${L.k}Pct`]) || 0));
        const sum = pcts.reduce((a, c) => a + c, 0) || 1;

        return (
          <div className="mr" key={i}>
            <div className="mr-h">
              <span className="mr-t">{m.title}</span>
              {m.note && <span className="mr-note">{m.note}</span>}
            </div>

            <div className="mr-heroes">
              {LANES.map((L) => (
                <div className="mr-hero" key={L.k}>
                  <div className={`mr-av ${L.cls}`} style={{ width: size, height: size }}>
                    {imgSrc(m[`${L.k}Hero`])
                      ? <Pic v={m[`${L.k}Hero`]} fit="fill" alt="" />
                      : <img className="mr-ph" src={L.icon} alt="" />}
                    <img className="mr-badge" src={L.icon} alt={L.l} />
                  </div>
                  {m[`${L.k}Name`] && <div className="mr-name">{m[`${L.k}Name`]}</div>}
                </div>
              ))}
            </div>

            {mode === "pct" && (
              <>
                <div className="mr-bar">
                  {LANES.map((L, j) => (
                    <span key={L.k} className={L.cls} style={{ width: `${(pcts[j] / sum) * 100}%` }} />
                  ))}
                </div>
                <div className="mr-legend">
                  {LANES.map((L, j) => (
                    <span key={L.k} className={L.cls}>
                      <img src={L.icon} alt="" />{pcts[j]}%
                    </span>
                  ))}
                </div>
              </>
            )}

            {mode === "qty" && (
              <div className="mr-legend">
                {LANES.map((L) => (
                  <span key={L.k} className={L.cls}>
                    <img src={L.icon} alt="" />{m[`${L.k}Qty`] || "—"}
                  </span>
                ))}
              </div>
            )}

            {m.why && <div className="mr-why rich sz-sm"><Rich>{m.why}</Rich></div>}
          </div>
        );
      })}
      {(b.items || []).length === 0 && <div className="ph">No marches yet</div>}
    </div>
  );
}
