import React, { createContext, useContext, useMemo } from "react";
import TierIcon from "../components/TierIcon.jsx";
import Pic, { imgSrc } from "./imgedit/Pic.jsx";
import { useMembers, useConfirmations, asPerson, totalTroops, findLineups, DEFAULT_SHOW } from "./members.js";

/* ============================================================
   Member-driven blocks: lineup, members showcase, confirmations.
   The page tells them which page they're on and what else is on
   it, so the summary block can add up its sibling lineups.
   ============================================================ */

export const PageCtx = createContext({ slug: null, doc: null, preview: false });

const AVATARS = ["panther", "cheetah", "lynx", "elephant", "wolf"];
const avatarSrc = (a) => (a && a.startsWith("http")) || (a && a.startsWith("/"))
  ? a : `/avatars/${AVATARS.includes(a) ? a : "panther"}.png`;

const fmt = (n) => {
  if (!n) return "0";
  if (n >= 1e6) return `${parseFloat((n / 1e6).toFixed(2))}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
};

/* --- one person's card, honouring the field checkboxes --- */
function PersonCard({ p, show, confirmed, onConfirm, canConfirm, avatarSize }) {
  if (!p) {
    return (
      <div className="pc pc-empty">
        <span className="pc-vago">Vago</span>
      </div>
    );
  }
  const s = show || DEFAULT_SHOW;
  const troops = totalTroops(p);
  const anyTroop = s.inf || s.cav || s.arch;

  return (
    <div className={`pc${confirmed ? " ok" : ""}`}>
      {s.avatar && (
        <div className="pc-av" style={avatarSize ? { width: avatarSize, height: avatarSize } : undefined}>
          {imgSrc(p.avatar) || p.avatar
            ? <Pic v={avatarSrc(p.avatar)} fit="fill" alt="" />
            : <span>{(p.name || "?").slice(0, 1)}</span>}
        </div>
      )}
      <div className="pc-body">
        <div className="pc-top">
          {s.name && <span className="pc-name">{p.name}</span>}
          {s.tier && p.tier && <TierIcon tier={p.tier} size={22} />}
          {p.guest && <span className="pc-guest">guest</span>}
          {confirmed && <span className="pc-badge">✓</span>}
        </div>

        {anyTroop && (
          <div className="pc-troops">
            {s.inf  && <span className="inf"><img src="/troops/infantry.png" alt="" />{fmt(p.inf)}</span>}
            {s.cav  && <span className="cav"><img src="/troops/cavalry.png" alt="" />{fmt(p.cav)}</span>}
            {s.arch && <span className="arch"><img src="/troops/archer.png" alt="" />{fmt(p.arch)}</span>}
          </div>
        )}

        {(s.power || s.troops) && (
          <div className="pc-stats">
            {s.power  && <span><i>Power</i>{p.power > 0 ? `${p.power}M` : "—"}</span>}
            {s.troops && <span><i>Troops</i>{fmt(troops)}</span>}
          </div>
        )}

        {canConfirm && (
          <button className={`pc-conf${confirmed ? " on" : ""}`} onClick={onConfirm}>
            {confirmed ? "Confirmed — tap to undo" : "Confirm my spot"}
          </button>
        )}
      </div>
    </div>
  );
}

/* --- LINEUP --- */
export function Lineup({ b }) {
  const { slug, preview } = useContext(PageCtx);
  const { members } = useMembers();
  const { has, toggle } = useConfirmations(slug);
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const picks = b.picks || [];
  const slots = Math.max(0, Number(b.slots) || 0);
  const people = picks.map((p) => asPerson(p, byId));
  const blanks = Math.max(0, slots - people.length);
  const filled = people.filter(Boolean).length;
  const confirmedCount = people.filter((p) => p && has(b.id, p.key)).length;

  return (
    <>
      <div className="lu-head">
        <span className="lu-count">
          <b>{filled}</b>{slots ? ` / ${slots}` : ""} escalados
        </span>
        {b.askConfirm && <span className="lu-conf"><b>{confirmedCount}</b> confirmados</span>}
      </div>

      <div className={(b.cols || 1) > 1 ? "grid" : "stack"} style={{ "--c": b.cols || 1 }}>
        {people.map((p, i) => (
          <PersonCard key={i} p={p} show={b.show} avatarSize={b.avatarSize}
                      confirmed={p ? has(b.id, p.key) : false}
                      canConfirm={!!b.askConfirm && !!p && !preview}
                      onConfirm={() => p && toggle(b.id, p)} />
        ))}
        {Array.from({ length: blanks }).map((_, i) => <PersonCard key={`v${i}`} p={null} />)}
      </div>
    </>
  );
}

/* --- MEMBERS showcase (no slots, no confirmation) --- */
export function MembersBlock({ b }) {
  const { members } = useMembers();
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const people = (b.picks || []).map((p) => asPerson(p, byId)).filter(Boolean);

  return (
    <div className={(b.cols || 2) > 1 ? "grid" : "stack"} style={{ "--c": b.cols || 2 }}>
      {people.map((p, i) => <PersonCard key={i} p={p} show={b.show} avatarSize={b.avatarSize} />)}
      {people.length === 0 && <div className="ph">Nenhum membro selecionado</div>}
    </div>
  );
}

/* --- CONFIRMATION SUMMARY --- */
export function Confirmed({ b }) {
  const { slug, doc } = useContext(PageCtx);
  const { members } = useMembers();
  const { has, rows } = useConfirmations(slug);
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const lineups = findLineups(doc);
  const wanted = b.only?.length ? lineups.filter((l) => b.only.includes(l.id)) : lineups;

  const groups = wanted.map((l) => {
    const people = (l.picks || []).map((p) => asPerson(p, byId)).filter(Boolean);
    const slots = Math.max(0, Number(l.slots) || 0);
    const done = people.filter((p) => has(l.id, p.key));
    const pending = people.filter((p) => !has(l.id, p.key));
    return { id: l.id, label: l._title || l.label || "Lineup", slots, picked: people.length, done, pending };
  });

  if (!groups.length) {
    return <div className="ph">Adicione blocos de escalação nesta página para somá-los aqui.</div>;
  }

  return (
    <div className="cf">
      {groups.map((g) => {
        const pct = g.picked ? Math.round((g.done.length / g.picked) * 100) : 0;
        return (
          <div className="cf-g" key={g.id}>
            <div className="cf-h">
              <span className="cf-t">{g.label}</span>
              <span className="cf-n"><b>{g.done.length}</b>/{g.picked}{g.slots ? ` · ${g.slots} vagas` : ""}</span>
            </div>
            <div className="cf-bar"><i style={{ width: `${pct}%` }} /></div>
            {b.showNames !== false && (
              <div className="cf-lists">
                {g.done.length > 0 && (
                  <div className="cf-list ok">
                    <span className="cf-lbl">Confirmados</span>
                    {g.done.map((p) => <span className="cf-chip" key={p.key}>{p.name}</span>)}
                  </div>
                )}
                {g.pending.length > 0 && (
                  <div className="cf-list">
                    <span className="cf-lbl">Aguardando</span>
                    {g.pending.map((p) => <span className="cf-chip" key={p.key}>{p.name}</span>)}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      {b.showTotal !== false && groups.length > 1 && (
        <div className="cf-total">
          <span>Total</span>
          <b>{groups.reduce((s, g) => s + g.done.length, 0)}</b>
          <span>de {groups.reduce((s, g) => s + g.picked, 0)} escalados</span>
        </div>
      )}
    </div>
  );
}
