/* ============================================================
   EVENT PAGE — BLOCK REGISTRY
   Every block type declares its editable fields; the editor
   auto-generates the form from this schema. Add a block type
   here and it becomes fully editable everywhere.

   Field types: text | textarea | richtext | number | select |
                toggle | color | image | datetime | list
   ============================================================ */

export const PALETTE = [
  { name: "Gold", v: "#ecc25a" },
  { name: "Archer", v: "#f2824a" },
  { name: "Cavalry", v: "#ecc24a" },
  { name: "Infantry", v: "#52c48c" },
  { name: "Steel", v: "#90a2b6" },
  { name: "Royal", v: "#4a8fe0" },
  { name: "Violet", v: "#9a7ae0" },
  { name: "Ruby", v: "#e05a6a" },
  { name: "Ink", v: "#eef3f8" },
];

// Shared style fields — the "Estilo" tab of every non-raw block
export const FONTS = [
  { v: "display", l: "Serifada (título)" },
  { v: "sans", l: "Sem serifa" },
  { v: "mono", l: "Monoespaçada" },
];
export const ANIM_IN = [
  { v: "", l: "Nenhuma" }, { v: "fade", l: "Aparecer" }, { v: "up", l: "Subir" },
  { v: "down", l: "Descer" }, { v: "left", l: "Da esquerda" }, { v: "right", l: "Da direita" },
  { v: "zoom", l: "Ampliar" }, { v: "flip", l: "Girar" },
];
export const LOOPS = [
  { v: "", l: "Nenhum" }, { v: "float", l: "Flutuar" }, { v: "glow", l: "Brilhar" },
  { v: "shine", l: "Reflexo" }, { v: "pulse", l: "Pulsar" },
];
export const FRAMES = [
  { v: "none", l: "Sem moldura" }, { v: "hair", l: "Fina" }, { v: "gold", l: "Dourada" },
  { v: "thick", l: "Grossa" }, { v: "double", l: "Dupla ornamentada" },
  { v: "dashed", l: "Tracejada" }, { v: "left", l: "Barra lateral" },
];

export const STYLE_FIELDS = [
  { type: "heading", label: "Título" },
  { key: "_titleIcon", type: "image", label: "Ícone do título" },
  { key: "_titleColor", type: "color", label: "Cor do título" },
  { key: "_titleFont", type: "select", label: "Fonte", options: FONTS },
  { key: "_titleSize", type: "number", label: "Tamanho (px)", min: 9, max: 46 },
  { key: "_titleWeight", type: "select", label: "Peso", options: [
    { v: 400, l: "Normal" }, { v: 700, l: "Negrito" }, { v: 800, l: "Extra" } ] },
  { key: "_titleCase", type: "select", label: "Caixa", options: [
    { v: "upper", l: "MAIÚSCULAS" }, { v: "none", l: "Normal" } ] },
  { key: "_titleTrack", type: "number", label: "Espaçamento entre letras (0-30)", min: 0, max: 30 },
  { key: "_titleAlign", type: "select", label: "Alinhamento do título", options: [
    { v: "left", l: "Esquerda" }, { v: "center", l: "Centro" }, { v: "right", l: "Direita" } ] },
  { key: "_titleRule", type: "toggle", label: "Linha sob o título" },

  { type: "heading", label: "Fundo" },
  { key: "_bg", type: "select", label: "Tipo de fundo", options: [
    { v: "none", l: "Transparente" }, { v: "panel", l: "Painel" }, { v: "well", l: "Afundado" },
    { v: "frame", l: "Painel dourado" }, { v: "solid", l: "Cor sólida" },
    { v: "grad", l: "Gradiente" }, { v: "image", l: "Imagem" } ] },
  { key: "_bgColor", type: "color", label: "Cor do fundo" },
  { key: "_bgColor2", type: "color", label: "Segunda cor (gradiente)" },
  { key: "_bgAngle", type: "number", label: "Ângulo do gradiente", min: 0, max: 360 },
  { key: "_bgImage", type: "image", label: "Imagem de fundo" },
  { key: "_bgDim", type: "number", label: "Escurecer imagem (%)", min: 0, max: 95 },

  { type: "heading", label: "Moldura e sombra" },
  { key: "_frame", type: "select", label: "Moldura", options: FRAMES },
  { key: "_frameColor", type: "color", label: "Cor da moldura" },
  { key: "_radius", type: "number", label: "Cantos (px)", min: 0, max: 34 },
  { key: "_shadow", type: "select", label: "Sombra", options: [
    { v: "none", l: "Nenhuma" }, { v: "soft", l: "Suave" }, { v: "deep", l: "Profunda" },
    { v: "glow", l: "Brilho colorido" } ] },

  { type: "heading", label: "Layout" },
  { key: "_accent", type: "color", label: "Cor de destaque" },
  { key: "_align", type: "select", label: "Alinhamento do conteúdo", options: [
    { v: "left", l: "Esquerda" }, { v: "center", l: "Centro" } ] },
  { key: "_pad", type: "select", label: "Espaçamento interno", options: [
    { v: "none", l: "Nenhum" }, { v: "sm", l: "Compacto" }, { v: "md", l: "Normal" },
    { v: "lg", l: "Amplo" }, { v: "xl", l: "Muito amplo" } ] },
  { key: "_scale", type: "select", label: "Tamanho do conteúdo", options: [
    { v: "sm", l: "Pequeno" }, { v: "md", l: "Normal" }, { v: "lg", l: "Grande" } ] },
  { key: "_full", type: "toggle", label: "Sangrar até as bordas" },

  { type: "heading", label: "Animação" },
  { key: "_anim", type: "select", label: "Entrada (ao rolar)", options: ANIM_IN },
  { key: "_animDelay", type: "number", label: "Atraso (ms)", min: 0, max: 2000 },
  { key: "_loop", type: "select", label: "Contínua", options: LOOPS },
];

const baseStyle = {
  _title: "", _titleIcon: "", _titleColor: "", _titleFont: "sans", _titleSize: 9,
  _titleWeight: 700, _titleCase: "upper", _titleTrack: 20, _titleAlign: "left", _titleRule: false,
  _bg: "none", _bgColor: "", _bgColor2: "", _bgAngle: 180, _bgImage: "", _bgDim: 45,
  _frame: "none", _frameColor: "", _radius: 14, _shadow: "none",
  _accent: "#ecc25a", _align: "left", _pad: "md", _scale: "md", _full: false,
  _anim: "", _animDelay: 0, _loop: "",
};

// Prepended to the content tab of every non-raw block
export const TITLE_FIELD = { key: "_title", type: "text", label: "Título da seção (opcional)" };

export const BLOCKS = {
  /* ---------------- Structure ---------------- */
  hero: {
    label: "Capa / Hero", group: "Estrutura", icon: "image",
    defaults: { ...baseStyle, _align: "center", image: "", eyebrow: "Tri-Alliance", title: "Nome do evento",
      subtitle: "Uma linha curta de apoio", height: 280, overlay: 60 },
    fields: [
      { key: "image", type: "image", label: "Imagem de fundo" },
      { key: "eyebrow", type: "text", label: "Linha superior" },
      { key: "title", type: "text", label: "Título" },
      { key: "subtitle", type: "textarea", label: "Subtítulo" },
      { key: "height", type: "number", label: "Altura (px)", min: 120, max: 600 },
      { key: "overlay", type: "number", label: "Escurecer fundo (%)", min: 0, max: 95 },
    ],
  },
  heading: {
    label: "Título", group: "Estrutura", icon: "type",
    defaults: { ...baseStyle, text: "Novo título", level: "h2", metal: true },
    fields: [
      { key: "text", type: "text", label: "Texto" },
      { key: "level", type: "select", label: "Tamanho", options: [
        { v: "h1", l: "Grande" }, { v: "h2", l: "Médio" }, { v: "h3", l: "Pequeno" } ] },
      { key: "metal", type: "toggle", label: "Dourado metálico" },
    ],
  },
  text: {
    label: "Texto", group: "Estrutura", icon: "text",
    defaults: { ...baseStyle, body: "Escreva aqui. Use **negrito**, *itálico*, [link](https://…) e listas com -.", size: "md" },
    fields: [
      { key: "body", type: "richtext", label: "Conteúdo" },
      { key: "size", type: "select", label: "Tamanho", options: [
        { v: "sm", l: "Pequeno" }, { v: "md", l: "Normal" }, { v: "lg", l: "Grande" } ] },
    ],
  },
  divider: {
    label: "Divisória", group: "Estrutura", icon: "minus",
    defaults: { ...baseStyle, style: "glow" },
    fields: [{ key: "style", type: "select", label: "Estilo", options: [
      { v: "glow", l: "Brilho dourado" }, { v: "line", l: "Linha" }, { v: "dots", l: "Pontos" } ] }],
  },
  spacer: {
    label: "Espaço", group: "Estrutura", icon: "space",
    defaults: { ...baseStyle, height: 32 },
    fields: [{ key: "height", type: "number", label: "Altura (px)", min: 8, max: 200 }],
  },

  /* ---------------- Media ---------------- */
  image: {
    label: "Imagem / GIF", group: "Mídia", icon: "image",
    defaults: { ...baseStyle, src: "", caption: "", radius: 12, full: false },
    fields: [
      { key: "src", type: "image", label: "Imagem ou GIF" },
      { key: "caption", type: "text", label: "Legenda" },
      { key: "radius", type: "number", label: "Cantos (px)", min: 0, max: 30 },
      { key: "full", type: "toggle", label: "Largura total" },
    ],
  },
  gallery: {
    label: "Galeria", group: "Mídia", icon: "grid",
    defaults: { ...baseStyle, cols: 2, items: [{ src: "", caption: "" }, { src: "", caption: "" }] },
    fields: [
      { key: "cols", type: "select", label: "Colunas", options: [
        { v: 2, l: "2" }, { v: 3, l: "3" }, { v: 4, l: "4" } ] },
      { key: "items", type: "list", label: "Imagens", addLabel: "Adicionar imagem",
        titleKey: "caption", item: [
          { key: "src", type: "image", label: "Imagem" },
          { key: "caption", type: "text", label: "Legenda" },
        ] },
    ],
  },
  video: {
    label: "Vídeo", group: "Mídia", icon: "play",
    defaults: { ...baseStyle, url: "", caption: "" },
    fields: [
      { key: "url", type: "text", label: "URL (YouTube, Vimeo ou .mp4)" },
      { key: "caption", type: "text", label: "Legenda" },
    ],
  },

  /* ---------------- Event data ---------------- */
  countdown: {
    label: "Contagem regressiva", group: "Evento", icon: "clock",
    defaults: { ...baseStyle, _bg: "frame", _align: "center", target: "", label: "Começa em",
      done: "O evento começou!" },
    fields: [
      { key: "target", type: "datetime", label: "Data e hora do evento" },
      { key: "label", type: "text", label: "Rótulo" },
      { key: "done", type: "text", label: "Texto quando chegar a hora" },
    ],
  },
  kpis: {
    label: "KPIs / Números", group: "Evento", icon: "chart",
    defaults: { ...baseStyle, cols: 3, items: [
      { icon: "", label: "Alianças", value: "3", color: "#ecc25a" },
      { icon: "", label: "Jogadores", value: "168", color: "#52c48c" },
      { icon: "", label: "Fases", value: "12", color: "#f2824a" },
    ] },
    fields: [
      { key: "cols", type: "select", label: "Colunas", options: [
        { v: 2, l: "2" }, { v: 3, l: "3" }, { v: 4, l: "4" } ] },
      { key: "items", type: "list", label: "Indicadores", addLabel: "Adicionar KPI",
        titleKey: "label", item: [
          { key: "icon", type: "image", label: "Ícone" },
          { key: "label", type: "text", label: "Rótulo" },
          { key: "value", type: "text", label: "Valor" },
          { key: "color", type: "color", label: "Cor" },
        ] },
    ],
  },
  cards: {
    label: "Cards", group: "Evento", icon: "cards",
    defaults: { ...baseStyle, cols: 2, items: [
      { image: "", title: "Título do card", text: "Descrição curta.", badge: "", color: "#ecc25a", link: "" },
    ] },
    fields: [
      { key: "cols", type: "select", label: "Colunas", options: [
        { v: 1, l: "1" }, { v: 2, l: "2" }, { v: 3, l: "3" } ] },
      { key: "items", type: "list", label: "Cards", addLabel: "Adicionar card",
        titleKey: "title", item: [
          { key: "image", type: "image", label: "Imagem / ícone" },
          { key: "title", type: "text", label: "Título" },
          { key: "text", type: "richtext", label: "Texto" },
          { key: "badge", type: "text", label: "Etiqueta" },
          { key: "color", type: "color", label: "Cor" },
          { key: "bg", type: "color", label: "Cor de fundo" },
          { key: "frame", type: "select", label: "Moldura", options: FRAMES },
          { key: "featured", type: "toggle", label: "Destacar" },
          { key: "anim", type: "select", label: "Animação contínua", options: LOOPS },
          { key: "link", type: "text", label: "Link (opcional)" },
        ] },
    ],
  },
  teams: {
    label: "Equipes / Alianças", group: "Evento", icon: "shield",
    defaults: { ...baseStyle, items: [
      { name: "BigDaddys", tag: "DAD", logo: "", color: "#ecc25a", score: "0", note: "" },
      { name: "Aliança 2", tag: "", logo: "", color: "#4a8fe0", score: "0", note: "" },
      { name: "Aliança 3", tag: "", logo: "", color: "#e05a6a", score: "0", note: "" },
    ] },
    fields: [
      { key: "items", type: "list", label: "Equipes", addLabel: "Adicionar equipe",
        titleKey: "name", item: [
          { key: "logo", type: "image", label: "Emblema" },
          { key: "name", type: "text", label: "Nome" },
          { key: "tag", type: "text", label: "Tag" },
          { key: "score", type: "text", label: "Pontuação" },
          { key: "note", type: "text", label: "Observação" },
          { key: "color", type: "color", label: "Cor" },
        ] },
    ],
  },
  roster: {
    label: "Membros / Escalação", group: "Evento", icon: "users",
    defaults: { ...baseStyle, cols: 2, items: [
      { avatar: "", name: "Nome do jogador", role: "Função", note: "" },
    ] },
    fields: [
      { key: "cols", type: "select", label: "Colunas", options: [
        { v: 1, l: "1" }, { v: 2, l: "2" }, { v: 3, l: "3" } ] },
      { key: "items", type: "list", label: "Membros", addLabel: "Adicionar membro",
        titleKey: "name", item: [
          { key: "avatar", type: "image", label: "Avatar" },
          { key: "name", type: "text", label: "Nome" },
          { key: "role", type: "text", label: "Função" },
          { key: "note", type: "text", label: "Observação" },
        ] },
    ],
  },
  timeline: {
    label: "Cronograma", group: "Evento", icon: "clock",
    defaults: { ...baseStyle, items: [
      { time: "11:00", title: "Abertura", text: "Descrição da fase.", state: "next" },
    ] },
    fields: [
      { key: "items", type: "list", label: "Fases", addLabel: "Adicionar fase",
        titleKey: "title", item: [
          { key: "time", type: "text", label: "Horário" },
          { key: "title", type: "text", label: "Título" },
          { key: "text", type: "richtext", label: "Descrição" },
          { key: "state", type: "select", label: "Estado", options: [
            { v: "done", l: "Concluída" }, { v: "now", l: "Agora" },
            { v: "next", l: "A seguir" } ] },
        ] },
    ],
  },
  steps: {
    label: "Tutorial / Passos", group: "Evento", icon: "steps",
    defaults: { ...baseStyle, items: [
      { image: "", title: "Primeiro passo", text: "Explique o que fazer." },
    ] },
    fields: [
      { key: "items", type: "list", label: "Passos", addLabel: "Adicionar passo",
        titleKey: "title", item: [
          { key: "image", type: "image", label: "Imagem / GIF" },
          { key: "title", type: "text", label: "Título" },
          { key: "text", type: "richtext", label: "Explicação" },
        ] },
    ],
  },
  resources: {
    label: "Recursos", group: "Evento", icon: "box",
    defaults: { ...baseStyle, cols: 4, items: [
      { icon: "", name: "Recurso", amount: "0", color: "#ecc25a" },
    ] },
    fields: [
      { key: "cols", type: "select", label: "Colunas", options: [
        { v: 2, l: "2" }, { v: 3, l: "3" }, { v: 4, l: "4" } ] },
      { key: "items", type: "list", label: "Recursos", addLabel: "Adicionar recurso",
        titleKey: "name", item: [
          { key: "icon", type: "image", label: "Ícone" },
          { key: "name", type: "text", label: "Nome" },
          { key: "amount", type: "text", label: "Quantidade" },
          { key: "color", type: "color", label: "Cor" },
        ] },
    ],
  },
  table: {
    label: "Tabela / Placar", group: "Evento", icon: "table",
    defaults: { ...baseStyle, headers: "Aliança, Pontos, Posição",
      rows: [{ cells: "BigDaddys, 0, 1º" }, { cells: "Aliança 2, 0, 2º" }] },
    fields: [
      { key: "headers", type: "text", label: "Cabeçalhos (separe por vírgula)" },
      { key: "rows", type: "list", label: "Linhas", addLabel: "Adicionar linha",
        titleKey: "cells", item: [
          { key: "cells", type: "text", label: "Células (separe por vírgula)" },
        ] },
    ],
  },
  callout: {
    label: "Aviso / Destaque", group: "Evento", icon: "alert",
    defaults: { ...baseStyle, variant: "info", title: "Atenção", text: "Mensagem importante." },
    fields: [
      { key: "variant", type: "select", label: "Tipo", options: [
        { v: "info", l: "Informação" }, { v: "tip", l: "Dica" },
        { v: "warn", l: "Atenção" }, { v: "danger", l: "Crítico" } ] },
      { key: "title", type: "text", label: "Título" },
      { key: "text", type: "richtext", label: "Mensagem" },
    ],
  },
  button: {
    label: "Botão", group: "Evento", icon: "link",
    defaults: { ...baseStyle, _align: "center", label: "Abrir", url: "", variant: "gold" },
    fields: [
      { key: "label", type: "text", label: "Texto" },
      { key: "url", type: "text", label: "Link" },
      { key: "variant", type: "select", label: "Estilo", options: [
        { v: "gold", l: "Dourado" }, { v: "ghost", l: "Contorno" } ] },
    ],
  },

  /* ---------------- Containers ---------------- */
  group: {
    label: "Grupo / Seção (aninha blocos)", group: "Estrutura", container: true,
    defaults: { ...baseStyle, _bg: "panel", _title: "Nova seção", cols: 1, children: [] },
    fields: [
      { key: "cols", type: "select", label: "Colunas internas", options: [
        { v: 1, l: "1" }, { v: 2, l: "2" }, { v: 3, l: "3" } ] },
    ],
  },

  /* ---------------- Battle (Tri-Alliance) ---------------- */
  squads: {
    label: "Esquadrões / Heróis", group: "Batalha",
    defaults: { ...baseStyle, _bg: "panel", _title: "Formations", cols: 1, items: [
      { title: "Attack squad 1", kind: "attack", note: "", heroes: [{ icon: "", name: "" }] },
    ] },
    fields: [
      { key: "cols", type: "select", label: "Colunas", options: [
        { v: 1, l: "1" }, { v: 2, l: "2" } ] },
      { key: "items", type: "list", label: "Esquadrões", addLabel: "Adicionar esquadrão", titleKey: "title", item: [
        { key: "title", type: "text", label: "Nome do esquadrão" },
        { key: "kind", type: "select", label: "Tipo", options: [
          { v: "attack", l: "Ataque" }, { v: "defense", l: "Defesa" }, { v: "mixed", l: "Misto" } ] },
        { key: "note", type: "text", label: "Observação" },
        { key: "heroes", type: "list", label: "Heróis", addLabel: "Adicionar herói", titleKey: "name", item: [
          { key: "icon", type: "image", label: "Ícone / retrato" },
          { key: "name", type: "text", label: "Nome" },
          { key: "role", type: "text", label: "Papel (opcional)" },
        ] },
      ] },
    ],
  },

  battlecd: {
    label: "Contagem de batalha", group: "Batalha", raw: true,
    defaults: { label: "Battle starts in", target: "", durationMin: 60,
      liveText: "BATTLE IN PROGRESS", liveIcon: "/tri/icons/event.png", doneText: "Battle completed — next cycle soon" },
    fields: [
      { key: "label", type: "text", label: "Rótulo" },
      { key: "target", type: "datetime", label: "Início da batalha" },
      { key: "durationMin", type: "number", label: "Duração (min)", min: 5, max: 600 },
      { key: "liveText", type: "text", label: "Texto durante a batalha" },
      { key: "liveIcon", type: "image", label: "Ícone durante a batalha" },
      { key: "doneText", type: "text", label: "Texto após o fim" },
    ],
  },
  howwewin: {
    label: "Como vencemos", group: "Batalha", raw: true,
    defaults: { label: "How we win", items: [{ title: "Título", text: "Explicação." }] },
    fields: [
      { key: "label", type: "text", label: "Rótulo da seção" },
      { key: "items", type: "list", label: "Passos", addLabel: "Adicionar passo", titleKey: "title", item: [
        { key: "title", type: "text", label: "Título" },
        { key: "text", type: "textarea", label: "Explicação" },
      ] },
    ],
  },
  battleplan: {
    label: "Plano de batalha (mapa + lanes)", group: "Batalha", raw: true,
    defaults: {
      searchLabel: "Find your position", searchPlaceholder: "Type your name…",
      missText: "Name not on the roster.", allLabel: "The lanes", oneLabel: "Your lane",
      showSearch: true, showMap: true,
      map: "/tri/map.jpg", mapW: 1920, mapH: 1401, temple: "Temple",
      capture: "", defend: "", entry: "", nodes: "{}", teams: [],
    },
    fields: [
      { key: "teams", type: "list", label: "Lanes / equipes", addLabel: "Adicionar lane", titleKey: "team", item: [
        { key: "team", type: "text", label: "Código (ex: A1+D1)" },
        { key: "name", type: "text", label: "Nome da lane" },
        { key: "color", type: "color", label: "Cor" },
        { key: "mission", type: "textarea", label: "Missão" },
        { key: "segs", type: "list", label: "Rotas", addLabel: "Adicionar trecho", titleKey: "path", item: [
          { key: "path", type: "text", label: "Caminho (ex: B1, B4, B8)" },
          { key: "hold", type: "toggle", label: "Marcar último como HOLD" },
        ] },
        { key: "flags", type: "text", label: "Bandeiras / alvos (ex: A24, B26)" },
        { key: "extraView", type: "text", label: "Incluir no mini-mapa (opcional)" },
        { key: "attackers", type: "textarea", label: "Ataque (1º = líder, separe por vírgula)" },
        { key: "defenders", type: "textarea", label: "Defesa (separe por vírgula)" },
        { key: "sub", type: "text", label: "Reserva" },
        { key: "hold", type: "text", label: "Instrução de hold" },
        { key: "timing", type: "text", label: "Tempos" },
        { key: "warning", type: "text", label: "Aviso (opcional)" },
      ] },
      { key: "capture", type: "text", label: "Marcar CAPTURAR (ex: A24, C24)" },
      { key: "defend", type: "text", label: "Marcar DEFENDER (ex: B24, B29)" },
      { key: "entry", type: "text", label: "Marcar ENTRADAS (ex: B18, B27)" },
      { key: "temple", type: "text", label: "Nó do Templo (pulso)" },
      { key: "map", type: "image", label: "Imagem do mapa" },
      { key: "mapW", type: "number", label: "Largura do mapa (px)" },
      { key: "mapH", type: "number", label: "Altura do mapa (px)" },
      { key: "nodes", type: "textarea", label: "Coordenadas dos prédios (JSON avançado)" },
      { key: "showSearch", type: "toggle", label: "Mostrar busca de jogador" },
      { key: "showMap", type: "toggle", label: "Mostrar mapa grande" },
      { key: "searchLabel", type: "text", label: "Título da busca" },
      { key: "allLabel", type: "text", label: 'Rótulo "todas as lanes"' },
    ],
  },
  phases: {
    label: "Fases da batalha", group: "Batalha", raw: true,
    defaults: { label: "The phases", marks: "0, 20, 40, 60",
      items: [{ name: "Fase", span: "0–20 min", color: "#ecc25a", weight: 20, points: "Ponto 1\nPonto 2" }] },
    fields: [
      { key: "label", type: "text", label: "Rótulo da seção" },
      { key: "marks", type: "text", label: "Marcas de tempo (separe por vírgula)" },
      { key: "items", type: "list", label: "Fases", addLabel: "Adicionar fase", titleKey: "name", item: [
        { key: "name", type: "text", label: "Nome" },
        { key: "span", type: "text", label: "Período" },
        { key: "color", type: "color", label: "Cor" },
        { key: "weight", type: "number", label: "Peso na barra", min: 1, max: 100 },
        { key: "points", type: "textarea", label: "Tópicos (um por linha)" },
      ] },
    ],
  },
  buildings: {
    label: "Prédios", group: "Batalha", raw: true,
    defaults: { label: "The buildings", items: [{ img: "", name: "Prédio", codes: "", pts: "", note: "", hot: false }] },
    fields: [
      { key: "label", type: "text", label: "Rótulo da seção" },
      { key: "items", type: "list", label: "Prédios", addLabel: "Adicionar prédio", titleKey: "name", item: [
        { key: "img", type: "image", label: "Imagem" },
        { key: "name", type: "text", label: "Nome" },
        { key: "codes", type: "text", label: "Códigos / quando abre" },
        { key: "pts", type: "text", label: "Pontos" },
        { key: "note", type: "text", label: "Observação" },
        { key: "hot", type: "toggle", label: "Destacar" },
      ] },
    ],
  },
  rules: {
    label: "Regras", group: "Batalha", raw: true,
    defaults: { label: "Key rules", items: [{ icon: "star", image: "", title: "Regra", text: "Descrição." }] },
    fields: [
      { key: "label", type: "text", label: "Rótulo da seção" },
      { key: "items", type: "list", label: "Regras", addLabel: "Adicionar regra", titleKey: "title", item: [
        { key: "icon", type: "select", label: "Ícone", options: [
          { v: "coins", l: "Moedas" }, { v: "bolt", l: "Energia" }, { v: "back", l: "Recuar" },
          { v: "heal", l: "Curar" }, { v: "block", l: "Bloqueio" }, { v: "portal", l: "Portal" },
          { v: "chat", l: "Chat" }, { v: "flag", l: "Bandeira" }, { v: "sword", l: "Espada" },
          { v: "shield", l: "Escudo" }, { v: "clock", l: "Relógio" }, { v: "star", l: "Estrela" } ] },
        { key: "image", type: "image", label: "Ou uma imagem (substitui o ícone)" },
        { key: "title", type: "text", label: "Título" },
        { key: "text", type: "textarea", label: "Descrição" },
      ] },
    ],
  },
  marches: {
    label: "Marchas / Esquadrões", group: "Batalha", raw: true,
    defaults: { label: "Your marches", items: [{ title: "March 1", text: "Seus melhores heróis" }],
      noteIcons: [], note: "", warnImage: "", warnText: "" },
    fields: [
      { key: "label", type: "text", label: "Rótulo da seção" },
      { key: "items", type: "list", label: "Marchas", addLabel: "Adicionar marcha", titleKey: "title", item: [
        { key: "title", type: "text", label: "Título" },
        { key: "text", type: "text", label: "Descrição" },
      ] },
      { key: "noteIcons", type: "list", label: "Ícones da nota", addLabel: "Adicionar ícone", titleKey: "src", item: [
        { key: "src", type: "image", label: "Ícone" },
      ] },
      { key: "note", type: "richtext", label: "Nota" },
      { key: "warnImage", type: "image", label: "Imagem do aviso" },
      { key: "warnText", type: "richtext", label: "Texto do aviso" },
    ],
  },
};

export const GROUPS = ["Estrutura", "Mídia", "Evento", "Batalha"];

export const newBlock = (type) => ({
  id: `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
  type,
  ...structuredClone(BLOCKS[type].defaults),
});

export const DEFAULT_THEME = { accent: "#ecc25a", maxWidth: 560 };
