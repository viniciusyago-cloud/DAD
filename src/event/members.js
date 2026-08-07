import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient.js";
import { tierRank } from "../components/TierIcon.jsx";

/* ============================================================
   Shared plumbing for the member-driven blocks.

   Several blocks read the same data at once (the picker in the
   inspector, the lineup on the canvas, the summary…), so each
   dataset keeps ONE fetch and ONE realtime channel and hands the
   result to every subscriber. Per-component channels would trip
   Supabase's "callbacks after subscribe()" error.
   ============================================================ */

export const MEMBER_FIELDS = [
  { k: "avatar", l: "Avatar" },
  { k: "name",   l: "Nome" },
  { k: "tier",   l: "Nível TG" },
  { k: "power",  l: "Poder" },
  { k: "troops", l: "Tropas totais" },
  { k: "inf",    l: "Infantaria" },
  { k: "cav",    l: "Cavalaria" },
  { k: "arch",   l: "Arquearia" },
];

export const DEFAULT_SHOW = { avatar: true, name: true, tier: true, power: true, troops: true };

/* --- tiny shared store: one loader + one channel per key --- */
function makeStore(key, table, load) {
  const s = { data: [], subs: new Set(), channel: null, started: false };
  const emit = () => s.subs.forEach((fn) => fn(s.data));
  const refresh = async () => { s.data = await load(); emit(); };
  return {
    get: () => s.data,
    subscribe(fn) {
      s.subs.add(fn);
      if (!s.started) {
        s.started = true;
        refresh();
        s.channel = supabase.channel(key)
          .on("postgres_changes", { event: "*", schema: "public", table }, refresh)
          .subscribe();
      } else fn(s.data);
      return () => {
        s.subs.delete(fn);
        if (s.subs.size === 0 && s.channel) {
          supabase.removeChannel(s.channel);
          s.channel = null; s.started = false;
        }
      };
    },
    refresh,
  };
}

const membersStore = makeStore("members-shared", "members", async () => {
  const { data, error } = await supabase
    .from("members")
    .select("id, name, avatar, tier, power, inf_count, cav_count, arch_count");
  return error ? [] : (data || []);
});

export function useMembers() {
  const [members, setMembers] = useState(membersStore.get());
  useEffect(() => membersStore.subscribe(setMembers), []);
  return { members, loading: members.length === 0 };
}

/* --- confirmations, one store per page slug --- */
const confStores = new Map();
function confStore(slug) {
  if (!confStores.has(slug)) {
    confStores.set(slug, makeStore(`conf-${slug}`, "lineup_confirmations", async () => {
      const { data, error } = await supabase
        .from("lineup_confirmations").select("*").eq("page_slug", slug);
      return error ? [] : (data || []);
    }));
  }
  return confStores.get(slug);
}

export function useConfirmations(slug) {
  const [rows, setRows] = useState(slug ? confStore(slug).get() : []);
  useEffect(() => {
    if (!slug) return;
    return confStore(slug).subscribe(setRows);
  }, [slug]);

  const has = (blockId, key) => rows.some((r) => r.block_id === blockId && r.member_key === key);
  const countFor = (blockId) => rows.filter((r) => r.block_id === blockId).length;

  const toggle = async (blockId, person) => {
    if (!slug) return;
    if (has(blockId, person.key)) {
      await supabase.from("lineup_confirmations").delete()
        .eq("page_slug", slug).eq("block_id", blockId).eq("member_key", person.key);
    } else {
      await supabase.from("lineup_confirmations").insert({
        page_slug: slug, block_id: blockId, member_key: person.key, member_name: person.name,
      });
    }
    confStore(slug).refresh();          // don't wait for the realtime round-trip
  };

  return { rows, has, countFor, toggle };
}

/** Normalise a roster row or an inline guest into one shape. */
export const asPerson = (pick, byId) => {
  if (pick?.guest) {
    const g = pick.guest;
    return {
      key: `g:${g.id}`, guest: true,
      name: g.name || "Convidado", avatar: g.avatar || "", tier: g.tier || "",
      power: Number(g.power) || 0,
      inf: Number(g.inf) || 0, cav: Number(g.cav) || 0, arch: Number(g.arch) || 0,
    };
  }
  const m = byId.get(pick?.memberId);
  if (!m) return null;
  return {
    key: `m:${m.id}`, guest: false,
    name: m.name, avatar: m.avatar || "", tier: m.tier || "",
    power: Number(m.power) || 0,
    inf: m.inf_count || 0, cav: m.cav_count || 0, arch: m.arch_count || 0,
  };
};

export const totalTroops = (p) => (p ? p.inf + p.cav + p.arch : 0);

/** Roster sorted the way the board sorts it: tier, then army size. */
export const byStrength = (a, b) =>
  (tierRank(b.tier) - tierRank(a.tier)) ||
  ((b.inf_count + b.cav_count + b.arch_count) - (a.inf_count + a.cav_count + a.arch_count)) ||
  (a.name || "").localeCompare(b.name || "");

/** Walk a page doc and return every lineup block, in reading order. */
export function findLineups(doc) {
  const out = [];
  const walk = (blocks) => {
    for (const b of blocks || []) {
      if (b.type === "lineup") out.push(b);
      if (Array.isArray(b.children)) walk(b.children);
    }
  };
  walk(doc?.header);
  (doc?.tabs || []).forEach((t) => walk(t.blocks));
  return out;
}
