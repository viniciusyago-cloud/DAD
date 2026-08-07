import React, { useMemo, useState } from "react";
import TierIcon, { TIERS } from "../components/TierIcon.jsx";
import { useMembers, byStrength, MEMBER_FIELDS } from "./members.js";

/* ============================================================
   Editor controls for the member-driven blocks.

   MemberPicker — choose people from the alliance roster, or add a
   guest who only exists on this event page.
   FieldChecks  — tick which facts about each person to show.
   ============================================================ */

const AVATARS = ["panther", "cheetah", "lynx", "elephant", "wolf"];
const avatarSrc = (a) => `/avatars/${AVATARS.includes(a) ? a : "panther"}.png`;
const gid = () => `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function FieldChecks({ value, onChange }) {
  const show = value || {};
  return (
    <div className="mp-checks">
      {MEMBER_FIELDS.map((f) => (
        <button type="button" key={f.k}
                className={`mp-check${show[f.k] ? " on" : ""}`}
                onClick={() => onChange({ ...show, [f.k]: !show[f.k] })}>
          <i />{f.l}
        </button>
      ))}
    </div>
  );
}

export default function MemberPicker({ value, onChange, slots }) {
  const picks = value || [];
  const { members, loading } = useMembers();
  const [q, setQ] = useState("");
  const [guest, setGuest] = useState(null);

  const chosenIds = useMemo(
    () => new Set(picks.filter((p) => p.memberId).map((p) => p.memberId)),
    [picks],
  );

  const roster = useMemo(() => {
    const list = [...members].sort(byStrength);
    const s = q.trim().toLowerCase();
    return s ? list.filter((m) => (m.name || "").toLowerCase().includes(s)) : list;
  }, [members, q]);

  const add = (m) => onChange([...picks, { memberId: m.id }]);
  const del = (i) => onChange(picks.filter((_, j) => j !== i));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= picks.length) return;
    const c = [...picks]; [c[i], c[j]] = [c[j], c[i]]; onChange(c);
  };

  const saveGuest = () => {
    if (!guest.name.trim()) return;
    const g = { ...guest, id: guest.id || gid(), name: guest.name.trim() };
    const i = picks.findIndex((p) => p.guest?.id === g.id);
    if (i >= 0) onChange(picks.map((p, j) => (j === i ? { guest: g } : p)));
    else onChange([...picks, { guest: g }]);
    setGuest(null);
  };

  const nameOf = (p) => p.guest ? p.guest.name : (members.find((m) => m.id === p.memberId)?.name || "—");
  const over = slots ? picks.length > slots : false;

  return (
    <div className="mp">
      <div className="mp-count">
        <b>{picks.length}</b>{slots ? ` de ${slots} vagas` : " selecionados"}
        {over && <span className="mp-over">acima do número de vagas</span>}
      </div>

      {/* chosen, in display order */}
      <div className="mp-chosen">
        {picks.map((p, i) => (
          <div className="mp-item" key={i}>
            <span className="mp-n">{i + 1}</span>
            <span className="mp-name">{nameOf(p)}{p.guest && <em>convidado</em>}</span>
            <span className="mp-acts">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === picks.length - 1}>↓</button>
              {p.guest && <button type="button" onClick={() => setGuest(p.guest)} title="Editar convidado">✎</button>}
              <button type="button" className="x" onClick={() => del(i)}>×</button>
            </span>
          </div>
        ))}
        {picks.length === 0 && <div className="mp-empty">Ninguém escalado ainda.</div>}
      </div>

      {/* guest form */}
      {guest ? (
        <div className="mp-guest">
          <div className="f-sec" style={{ marginTop: 4 }}>Convidado — só nesta página</div>
          <input className="f-in" placeholder="Nome" value={guest.name}
                 onChange={(e) => setGuest({ ...guest, name: e.target.value })} />
          <div className="mp-guest-row">
            <select className="f-in f-sel" value={guest.tier || ""}
                    onChange={(e) => setGuest({ ...guest, tier: e.target.value })}>
              <option value="">Sem nível</option>
              {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input className="f-in" inputMode="decimal" placeholder="Poder (M)" value={guest.power || ""}
                   onChange={(e) => setGuest({ ...guest, power: e.target.value.replace(/[^\d.]/g, "") })} />
          </div>
          <div className="mp-guest-row">
            <input className="f-in" inputMode="numeric" placeholder="Inf." value={guest.inf || ""}
                   onChange={(e) => setGuest({ ...guest, inf: e.target.value.replace(/\D/g, "") })} />
            <input className="f-in" inputMode="numeric" placeholder="Cav." value={guest.cav || ""}
                   onChange={(e) => setGuest({ ...guest, cav: e.target.value.replace(/\D/g, "") })} />
            <input className="f-in" inputMode="numeric" placeholder="Arq." value={guest.arch || ""}
                   onChange={(e) => setGuest({ ...guest, arch: e.target.value.replace(/\D/g, "") })} />
          </div>
          <div className="mp-avatars">
            {AVATARS.map((a) => (
              <button type="button" key={a} className={`mp-av${guest.avatar === a ? " sel" : ""}`}
                      onClick={() => setGuest({ ...guest, avatar: a })}>
                <img src={avatarSrc(a)} alt="" />
              </button>
            ))}
          </div>
          <div className="mp-guest-acts">
            <button type="button" className="f-btn" onClick={() => setGuest(null)}>Cancelar</button>
            <button type="button" className="f-btn f-btn-edit" onClick={saveGuest} disabled={!guest.name.trim()}>
              Salvar convidado
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="f-add" onClick={() => setGuest({ name: "", avatar: "panther", tier: "" })}>
          + Cadastrar convidado
        </button>
      )}

      {/* roster */}
      <div className="f-sec">Da aliança</div>
      <input className="f-in" placeholder="Buscar membro…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mp-roster">
        {loading && <div className="mp-empty">Carregando…</div>}
        {roster.map((m) => {
          const already = chosenIds.has(m.id);
          return (
            <button type="button" key={m.id} className={`mp-row${already ? " on" : ""}`}
                    onClick={() => already ? onChange(picks.filter((p) => p.memberId !== m.id)) : add(m)}>
              <img src={avatarSrc(m.avatar)} alt="" />
              <span className="mp-row-n">{m.name}</span>
              {m.tier && <TierIcon tier={m.tier} size={18} />}
              <span className="mp-row-p">{Number(m.power) > 0 ? `${Number(m.power)}M` : "—"}</span>
              <span className="mp-tick">{already ? "✓" : "+"}</span>
            </button>
          );
        })}
        {!loading && roster.length === 0 && <div className="mp-empty">Ninguém encontrado.</div>}
      </div>
    </div>
  );
}
