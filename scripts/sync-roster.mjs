/* Sync the alliance roster from the in-game member list.
   Updates power + tier for people we already have, inserts the new
   ones, and NEVER deletes anybody who isn't on the list.
   Run:  SEED_KEY=... node scripts/sync-roster.mjs            */

const URL = "https://grlhpuheepiabutylezb.supabase.co";
const KEY = process.env.SEED_KEY;
if (!KEY) { console.error("Set SEED_KEY"); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

/* name, power (millions), tier ("" = no TrueGold badge in game) */
const ROSTER = [
  ["JoDee Sunfyre", 220.2, "TG5"], ["Salles", 240.8, "TG5"], ["Biro", 223.6, "TG5"],
  ["Yam", 136.0, "TG3"], ["Araz Stark", 102.5, "TG2"], ["Cryptic Angel", 265.5, "TG5"],
  ["Toady", 230.9, "TG5"], ["IK33", 227.4, "TG5"], ["RagnarBlackbeard", 177.7, "TG4"],
  ["Vermithor", 174.1, "TG4"], ["Boss Baby", 172.6, "TG4"], ["ABADD0N", 158.8, "TG3"],
  ["Pai", 153.9, "TG3"], ["༒ Øxy ༒", 149.2, "TG4"], ["Captain Sabo", 131.0, "TG3"],
  ["Rumiko", 110.4, "TG2"], ["Peach of Cain", 104.2, "TG2"], ["Panda", 97.4, "TG2"],
  ["SweetPea", 68.8, "TG1"], ["Mystic Biscuit", 150.1, "TG4"], ["Baba Yaga", 115.3, "TG2"],
  ["Cerkutay", 109.2, "TG2"], ["xXMissBehaveXx", 90.4, "TG2"], ["IRØDZ", 229.9, "TG5"],
  ["Arwaine", 189.2, "TG5"], ["Maciek Ironwolf", 182.6, "TG5"], ["FrejaNorthwind", 180.7, "TG4"],
  ["Winba", 175.9, "TG4"], ["Vesticals", 170.6, "TG5"], ["Tinka", 166.7, "TG4"],
  ["Kania", 160.0, "TG4"], ["DemonX", 151.2, "TG3"], ["F G R 1", 146.5, "TG3"],
  ["MKKnight", 144.3, "TG3"], ["Pegasus", 142.2, "TG3"], ["Takeo", 141.4, "TG3"],
  ["WiNG豐", 140.8, "TG3"], ["✝ jEp0rMz ✝", 139.9, "TG3"], ["nanya", 138.5, "TG3"],
  ["Mystic Ovi", 136.3, "TG3"], ["MH26 Kingdom", 133.7, "TG3"], ["Hammelbock", 133.4, "TG3"],
  ["『King Alfred』", 132.7, "TG2"], ["Deathrip", 132.5, "TG3"], ["Leclerc", 131.8, "TG3"],
  ["Senol", 129.7, "TG2"], ["DemonXtra", 129.2, "TG2"], ["AjKout", 127.7, "TG3"],
  ["Bear", 127.4, "TG3"], ["Melda", 125.9, "TG3"], ["DJshellz", 124.8, "TG3"],
  ["Queen Luna", 124.7, "TG3"], ["cCc", 122.4, "TG2"], ["JKGOM", 122.2, "TG4"],
  ["Neduts", 120.2, "TG2"], ["rey,salomon!", 119.7, "TG2"], ["Imrail92", 119.5, "TG3"],
  ["RF POWER", 116.2, "TG3"], ["TyLC", 115.9, "TG3"], ["Juyopert", 115.8, "TG3"],
  ["Cvelle", 115.1, "TG2"], ["WWW", 114.8, "TG2"], ["Lord Mardigan", 114.2, "TG2"],
  ["Lord johnson", 113.8, "TG1"], ["HELLHOUND", 113.2, "TG3"], ["Eyin", 112.0, "TG2"],
  ["Ancsika", 111.1, "TG2"], ["Minion", 109.8, "TG2"], ["『NaNiwaa』", 109.6, "TG2"],
  ["mastergwyn", 108.6, "TG2"], ["DAD KZ", 107.9, "TG2"], ["Ziana", 106.2, "TG2"],
  ["Deamon07", 105.9, "TG2"], ["VATANSEVER", 104.7, "TG2"], ["moon", 104.5, "TG2"],
  ["Ak21", 103.2, "TG2"], ["Loveyyyy", 101.6, "TG2"], ["LordKen", 98.9, "TG1"],
  ["Senis Ditron", 98.3, "TG2"], ["Pralienig", 96.6, "TG2"], ["Drost", 96.3, "TG2"],
  ["Caio", 91.3, "TG1"], ["ŞİRİN BABA", 90.1, "TG2"], ["Avva", 90.1, "TG3"],
  ["RIMURU", 89.4, "TG2"], ["Heliiin", 88.4, "TG3"], ["Cat of War", 86.3, "TG2"],
  ["Silver surfer", 85.4, "TG1"], ["AshIsland", 82.7, "TG1"], ["Hercastillo91", 76.4, ""],
  ["Peri", 67.6, "TG1"], ["Shawraq Warrior", 57.1, ""], ["Fong", 119.6, "TG2"],
  ["SadieBear", 116.6, "TG3"], ["The Tinman", 54.4, ""], ["Aquilas", 42.5, ""],
];

/* Same player, different spelling in our database. Kept explicit so a
   rename is a decision, never a fuzzy guess. */
const ALIASES = {
  "toady": "Toad",
  "jodee sunfyre": "JoDee Monarch",
  "captain sabo": "Sabo",
  "abadd0n": "ABADDON",
  "༒ øxy ༒": "Oxy",
  "maciek ironwolf": "Maciek Irinwolf",
};

const AVATARS = ["panther", "cheetah", "lynx", "elephant", "wolf"];
const norm = (s) => s.toLowerCase().trim();

const res = await fetch(`${URL}/rest/v1/members?select=id,name,power,tier`, { headers: H });
const existing = await res.json();

const byName = new Map();
for (const m of existing) {
  const k = norm(m.name);
  if (!byName.has(k)) byName.set(k, []);
  byName.get(k).push(m);
}

const dups = [...byName.entries()].filter(([, v]) => v.length > 1);
const updated = [], inserted = [], renamed = [];

for (const [name, power, tier] of ROSTER) {
  const aliasTarget = ALIASES[norm(name)];
  const key = norm(aliasTarget || name);
  const hits = byName.get(key);

  if (hits?.length) {
    const row = hits.reduce((a, b) => (a.id < b.id ? a : b));   // oldest wins
    const patch = { power, tier: tier || null };
    if (aliasTarget) { patch.name = name; renamed.push(`${aliasTarget} → ${name}`); }
    const r = await fetch(`${URL}/rest/v1/members?id=eq.${row.id}`, {
      method: "PATCH", headers: H, body: JSON.stringify(patch),
    });
    if (!r.ok) console.error("update failed", name, await r.text());
    else updated.push(name);
  } else {
    const r = await fetch(`${URL}/rest/v1/members`, {
      method: "POST", headers: { ...H, Prefer: "return=minimal" },
      body: JSON.stringify({
        name, power, tier: tier || null,
        avatar: AVATARS[inserted.length % AVATARS.length],
        inf_count: 0, cav_count: 0, arch_count: 0,
      }),
    });
    if (!r.ok) console.error("insert failed", name, await r.text());
    else inserted.push(name);
  }
}

const rosterKeys = new Set(ROSTER.map(([n]) => norm(ALIASES[norm(n)] || n)));
const untouched = existing.filter((m) => !rosterKeys.has(norm(m.name))).map((m) => m.name);

console.log(`atualizados: ${updated.length}`);
console.log(`inseridos:   ${inserted.length}  ->`, inserted.join(", "));
console.log(`renomeados:  ${renamed.length}   ->`, renamed.join(" · "));
console.log(`intocados (não estavam na lista, mantidos): ${untouched.length} ->`, untouched.join(", "));
console.log(`nomes duplicados no banco: ${dups.length} ->`, dups.map(([k, v]) => `${k} (ids ${v.map((x) => x.id).join(",")})`).join(" · "));
