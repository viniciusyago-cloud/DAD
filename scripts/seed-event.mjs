/* Seeds /evento with the current Tri-Alliance content as editable blocks.
   Run:  node scripts/seed-event.mjs                                        */

const URL = "https://grlhpuheepiabutylezb.supabase.co";
const KEY = process.env.SEED_KEY;
if (!KEY) { console.error("Set SEED_KEY"); process.exit(1); }

let n = 0;
const id = (p) => `${p}${(++n).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const B = (type, props) => ({ id: id("b"), type, ...props });
const S = { _bg: "none", _accent: "#ecc25a", _align: "left", _pad: "md" };

const NODES = {
  B1:[125,470],B2:[195,340],B3:[255,450],B4:[185,560],B5:[430,235],B6:[340,385],B7:[335,505],
  B8:[300,625],B9:[565,138],B10:[400,350],B11:[395,580],B12:[410,700],B13:[725,150],B14:[540,255],
  B15:[480,385],B16:[480,505],B17:[497,610],B18:[305,795],B19:[890,195],B20:[812,225],B21:[570,318],
  B22:[545,435],B23:[585,575],B24:[750,290],B25:[672,365],B26:[675,515],B27:[620,672],B28:[880,325],
  B29:[775,435],B30:[845,410],B31:[770,545],
  A13:[505,1020],A19:[285,990],A20:[587,960],A24:[683,890],A25:[870,890],A28:[798,815],A29:[973,825],A30:[895,765],
  C18:[1210,195],C24:[1235,650],C27:[1200,300],C29:[1155,445],C31:[1068,428],
  Temple:[965,570],
};

const TEAMS = [
  { team:"A1+D1", name:"Deep Left Flank", color:"#f0564e",
    mission:"Sweep the far-left lane and take enemy Garrison A24",
    segs:[{path:"B1, B4, B8, B12, B18, A19, A13, A20, A24", hold:false}], flags:"A24", extraView:"",
    attackers:"JoDee, Sabo, Jenny", defenders:"Toady, Imrail, Moon", sub:"Panda",
    hold:"From min 20, D1 holds A24 once captured",
    timing:"Reach A19 around min 15 · take A24 after min 20 · Temple at min 40", warning:"" },
  { team:"A2+D2", name:"Left Corridor", color:"#f2d054",
    mission:"Push the left-center lane and help take enemy Garrison A24",
    segs:[{path:"B2, B3, B6, B7, B11, B17, B27, A28, A24", hold:false}], flags:"A24", extraView:"",
    attackers:"Johann, Nanya, Araz", defenders:"!!!Skill, OVI, Fong", sub:"Juyopert",
    hold:"From min 20, D2 helps hold A24 once captured",
    timing:"Push from min 5 · cross at B27 around min 15 · Temple at min 40", warning:"" },
  { team:"A3+D3", name:"Central Push", color:"#4ad0e0",
    mission:"Drive the middle lane, take B26 on the way, cross at B27 and take A30",
    segs:[{path:"B5, B10, B15, B22, B16, B23, B27, A28, A30", hold:false},{path:"B23, B26", hold:false}],
    flags:"A30, B26", extraView:"C24",
    attackers:"Salles, Fgr1, Www", defenders:"Oxy, Leclerc, Rumiko", sub:"Beske",
    hold:"From min 20, D3 crosses to C24 using Transit Hubs",
    timing:"Reach A30 by min 25 · Temple at min 40", warning:"" },
  { team:"A4+D4", name:"Right-Center Assault", color:"#4a90f2",
    mission:"Secure our B29 and B31, then cross to take A30 and A29",
    segs:[{path:"B9, B14, B21, B25, B29, B30, B31, A30, A29", hold:false}], flags:"A29", extraView:"C29",
    attackers:"IK33, Epson, Mastergwyn", defenders:"Jungki Oppa, RF, Neduts", sub:"Eyin",
    hold:"D4 holds our B29, then crosses to C29 using Transit Hubs",
    timing:"Secure B29 by min 10 · push A30 and A29 · Temple at min 40", warning:"" },
  { team:"A5+D5", name:"Right Defense", color:"#a878f0",
    mission:"Protect our Garrison B24 — three exits into zone C when safe",
    segs:[{path:"B13, B20, B24, B28", hold:true},{path:"B20, B19, C18", hold:false},
          {path:"B28, C27", hold:false},{path:"B28, B30, C31", hold:false}],
    flags:"C18, C27, C31", extraView:"",
    attackers:"Yam, Hammelbock, KZ", defenders:"Susu, Bear, Sadie", sub:"Open slot",
    hold:"D5 stays on B24 the whole match · watch the B19 / B28 entrances",
    timing:"Anchor B24 from the start · exits: B19>C18 · B28>C27 · B30>C31",
    warning:"B24 can never be left alone" },
];

const doc = {
  theme: { accent: "#ecc25a", maxWidth: 560 },
  header: [
    B("hero", { ...S, _align: "left", image: "/tri/header.jpg", eyebrow: "Alliance Cmmd · BigDaddys",
      title: "Tri-Alliance Clash", subtitle: "", height: 190, overlay: 55 }),
    B("battlecd", { label: "Battle starts in", target: "2026-08-08T14:00:00.000Z", durationMin: 60,
      liveText: "BATTLE IN PROGRESS", liveIcon: "/tri/icons/event.png",
      doneText: "Battle completed — next cycle soon" }),
  ],
  tabs: [
    { id: id("t"), label: "Overview", blocks: [
      B("howwewin", { label: "How we win", items: [
        { title: "Hold buildings to earn points", text: "Every building we hold generates points per minute. Most points after 60 minutes wins. Kills don't count." },
        { title: "Stick to your lane", text: "5 lanes, 6 players each. Every team follows its own route on the map." },
        { title: "At min 40, everyone attacks the Temple", text: "First capture gives +50,000 points. All attack teams hit it together." },
      ] }),
      B("phases", { label: "The 4 phases", marks: "0, 3, 20, 40, 60", items: [
        { name: "Preparation", span: "0–3 min", color: "#90a2b6", weight: 3,
          points: "Captains are assigned (energy regen bonus)\nGet to your lane — no fighting yet" },
        { name: "Seize & Conquer", span: "3–20 min", color: "#ecc25a", weight: 17,
          points: "Take the Transit Hubs first\nAdvance along your route, building by building\nGarrisons are still shielded — ignore them" },
        { name: "Garrisons", span: "20–40 min", color: "#f2824a", weight: 20,
          points: "A24, B24 and C24 unlock — 1,800 pts/min each\nHold our B24, take theirs\nDefense teams move to their hold buildings" },
        { name: "Temple", span: "40–60 min", color: "#ffe08a", weight: 20,
          points: "Temple opens — first capture is +50,000 pts\nAll attack teams hit it at the same time\nIf we lose it, take it back — it keeps scoring" },
      ] }),
    ] },
    { id: id("t"), label: "Squads", blocks: [
      B("battleplan", { searchLabel: "Find your position", searchPlaceholder: "Type your name…",
        missText: "Name not on the roster — talk to JoDee or Salles.",
        allLabel: "The 5 lanes", oneLabel: "Your lane", showSearch: true, showMap: true,
        map: "/tri/map.jpg", mapW: 1920, mapH: 1401, temple: "Temple",
        capture: "A24, C24, A29, C29", defend: "B24, B29",
        entry: "B18, B27, B31, B30, B28, B19",
        nodes: JSON.stringify(NODES), teams: TEAMS }),
    ] },
    { id: id("t"), label: "Formations", blocks: [
      B("marches", { label: "Your 3 marches", items: [
        { title: "March 1", text: "Your 3 strongest heroes" },
        { title: "March 2", text: "Next 3 strongest" },
        { title: "March 3", text: "The rest" },
      ], noteIcons: [{ src: "/troops/infantry.png" }, { src: "/troops/cavalry.png" }, { src: "/troops/archer.png" }],
        note: "Troop counts are fixed: 100k Infantry + 100k Cavalry + 100k Archery per march. The only choice is which heroes go where.",
        warnImage: "/tri/icons/diana.png",
        warnText: "Don't use **Diana** (no battle skills) or blue-tier heroes." }),
    ] },
    { id: id("t"), label: "Buildings", blocks: [
      B("buildings", { label: "The buildings", items: [
        { img: "/tri/temple.jpg", name: "Temple of Tides", codes: "Center · opens at min 40", pts: "+1,800/min", note: "First capture gives +50,000 points", hot: true },
        { img: "/tri/garrison.jpg", name: "Garrison", codes: "A24 · B24 · C24 · unlock at min 20", pts: "+1,800/min", note: "Worth 3 normal buildings", hot: false },
        { img: "/tri/transit.jpg", name: "Transit Hub", codes: "Ring platforms", pts: "+60/min", note: "Fast travel across the map", hot: false },
        { img: "/tri/tower.jpg", name: "Watchtower", codes: "Along every lane", pts: "+180–600/min", note: "Regular capture points", hot: false },
        { img: "/tri/hq.jpg", name: "Alliance HQ", codes: "A1 · B1 · C1", pts: "+1,800/min", note: "Defeated squads respawn here", hot: false },
      ] }),
    ] },
    { id: id("t"), label: "Rules", blocks: [
      B("rules", { label: "Key rules", items: [
        { icon: "coins", image: "", title: "Points win, not kills", text: "Don't chase kills — hold buildings." },
        { icon: "bolt", image: "", title: "Keep 30–40% energy for min 20", text: "Energy is used to move, attack and heal." },
        { icon: "back", image: "", title: "Retreat instead of dying", text: "Fall back one building and heal. Respawning at HQ takes time." },
        { icon: "heal", image: "", title: "Heal in captured buildings", text: "Only buildings not under attack can heal troops." },
        { icon: "block", image: "", title: "No skipping", text: "You can't move past an enemy building. 5 allied marches attacking it clear the path." },
        { icon: "portal", image: "", title: "Protect the Transit Hubs", text: "They're our fast travel across the map." },
        { icon: "chat", image: "", title: "Short calls in chat", text: "Building code + minute: “B24 min 20”." },
        { icon: "flag", image: "", title: "Follow your Lane Leader", text: "One caller per lane." },
      ] }),
      B("heading", { ...S, text: "Before the battle", level: "h3", metal: false }),
      B("text", { ...S, size: "md",
        body: "**Turn on:** Position · Pet · Territory · combat Town Buffs · Outpost\n**No effect:** Deployment Capacity · March buffs · King's Perks · Ministry · Alliance Territory" }),
    ] },
  ],
};

const res = await fetch(`${URL}/rest/v1/event_pages?slug=eq.tri-alliance`, {
  method: "PATCH",
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
  body: JSON.stringify({ title: "Tri-Alliance Clash", doc }),
});
const out = await res.json();
if (!res.ok) { console.error("FAILED", res.status, out); process.exit(1); }
if (!out.length) { console.error("No row matched slug=tri-alliance — open /evento/editar once to create it."); process.exit(1); }
console.log("Seeded ok · tabs:", doc.tabs.map((t) => t.label).join(", "));
console.log("header blocks:", doc.header.length, "· total blocks:",
  doc.header.length + doc.tabs.reduce((s, t) => s + t.blocks.length, 0));
