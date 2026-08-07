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

/** Typography controls for one named line of text inside a block. */
export const textStyle = (p, label) => [
  { type: "heading", label },
  { key: `${p}Color`, type: "color", label: "Cor" },
  { key: `${p}Font`, type: "select", label: "Fonte", options: FONTS },
  { key: `${p}Size`, type: "number", label: "Tamanho (px)", min: 8, max: 90 },
  { key: `${p}Weight`, type: "select", label: "Peso", options: [
    { v: 400, l: "Normal" }, { v: 700, l: "Negrito" }, { v: 800, l: "Extra" } ] },
  { key: `${p}Case`, type: "select", label: "Caixa", options: [
    { v: "none", l: "Normal" }, { v: "upper", l: "MAIÚSCULAS" } ] },
  { key: `${p}Track`, type: "number", label: "Espaçamento entre letras (0-40)", min: 0, max: 40 },
  { key: `${p}Align`, type: "select", label: "Alinhamento", options: [
    { v: "left", l: "Esquerda" }, { v: "center", l: "Centro" }, { v: "right", l: "Direita" } ] },
];

export const STYLE_FIELDS = [
  { type: "heading", label: "Título da seção" },
  { key: "_titleIcon", type: "image", label: "Ícone do título" },
  { key: "_titleIconSize", type: "number", label: "Tamanho do ícone (px)", min: 10, max: 90 },
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
    styleFields: [
      ...textStyle("hTitle", "Título do hero"),
      { key: "hTitleMetal", type: "toggle", label: "Dourado metálico" },
      ...textStyle("hEyebrow", "Linha superior"),
      ...textStyle("hSub", "Subtítulo"),
      { type: "heading", label: "Posição do texto" },
      { key: "hVAlign", type: "select", label: "Vertical", options: [
        { v: "bottom", l: "Embaixo" }, { v: "center", l: "Meio" }, { v: "top", l: "Em cima" } ] },
    ],
    defaults: { ...baseStyle, _align: "center", image: "", eyebrow: "Tri-Alliance", title: "Nome do evento",
      subtitle: "Uma linha curta de apoio", height: 280, overlay: 60,
      hTitleMetal: true, hTitleAlign: "left", hEyebrowAlign: "left", hSubAlign: "left", hVAlign: "bottom" },
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
    defaults: { ...baseStyle, src: "", caption: "", width: 100, position: "left", radius: 12, full: false },
    fields: [
      { key: "src", type: "image", label: "Imagem ou GIF" },
      { key: "caption", type: "text", label: "Legenda" },
      { key: "width", type: "number", label: "Largura (%)", min: 10, max: 100 },
      { key: "position", type: "select", label: "Posição", options: [
        { v: "left", l: "Esquerda" }, { v: "center", l: "Centro" }, { v: "right", l: "Direita" } ] },
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
          { key: "h", type: "number", label: "Altura (px, 0 = automática)", min: 0, max: 480 },
          { key: "fit", type: "select", label: "Ajuste", options: [
            { v: "cover", l: "Preencher (corta)" }, { v: "contain", l: "Conter (inteira)" } ] },
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
    label: "Contagem regressiva", group: "Evento",
    defaults: { ...baseStyle, _bg: "panel", _align: "center", _title: "Battle starts in",
      target: "", durationMin: 60,
      showDays: true, showHours: true, showMin: true, showSec: true,
      labelDays: "Days", labelHours: "Hours", labelMin: "Min", labelSec: "Sec",
      liveText: "BATTLE IN PROGRESS", liveIcon: "", doneText: "Battle completed",
      numMetal: true, numColor: "", numFont: "display", numSize: 30,
      cell: "panel", sep: "colon", unitSize: 8.5, unitColor: "" },
    fields: [
      { key: "target", type: "datetime", label: "Data e hora do evento" },
      { key: "durationMin", type: "number", label: "Duração do evento (min)", min: 0, max: 1440 },
      { type: "heading", label: "Unidades" },
      { key: "showDays", type: "toggle", label: "Mostrar dias" },
      { key: "showHours", type: "toggle", label: "Mostrar horas" },
      { key: "showMin", type: "toggle", label: "Mostrar minutos" },
      { key: "showSec", type: "toggle", label: "Mostrar segundos" },
      { key: "labelDays", type: "text", label: "Rótulo dos dias" },
      { key: "labelHours", type: "text", label: "Rótulo das horas" },
      { key: "labelMin", type: "text", label: "Rótulo dos minutos" },
      { key: "labelSec", type: "text", label: "Rótulo dos segundos" },
      { type: "heading", label: "Mensagens" },
      { key: "liveText", type: "text", label: "Durante o evento" },
      { key: "liveIcon", type: "image", label: "Ícone durante o evento" },
      { key: "doneText", type: "text", label: "Depois do evento" },
    ],
    styleFields: [
      { type: "heading", label: "Números" },
      { key: "numMetal", type: "toggle", label: "Dourado metálico" },
      { key: "numColor", type: "color", label: "Cor (se não for metálico)" },
      { key: "numFont", type: "select", label: "Fonte", options: FONTS },
      { key: "numSize", type: "number", label: "Tamanho (px)", min: 14, max: 96 },
      { type: "heading", label: "Caixas e separador" },
      { key: "cell", type: "select", label: "Estilo das caixas", options: [
        { v: "panel", l: "Painel" }, { v: "plain", l: "Sem caixa" }, { v: "frame", l: "Moldura dourada" } ] },
      { key: "sep", type: "select", label: "Separador", options: [
        { v: "colon", l: "Dois-pontos" }, { v: "dot", l: "Ponto" }, { v: "none", l: "Nenhum" } ] },
      { type: "heading", label: "Rótulos das unidades" },
      { key: "unitSize", type: "number", label: "Tamanho (px)", min: 6, max: 24 },
      { key: "unitColor", type: "color", label: "Cor" },
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
          { key: "imgH", type: "number", label: "Altura da imagem (px, 0 = auto)", min: 0, max: 480 },
          { key: "imgFit", type: "select", label: "Ajuste da imagem", options: [
            { v: "cover", l: "Preencher (corta)" }, { v: "contain", l: "Conter (inteira)" } ] },
          { key: "imgPos", type: "select", label: "Posição da imagem", options: [
            { v: "center", l: "Centro" }, { v: "top", l: "Topo" }, { v: "bottom", l: "Base" } ] },
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
          { key: "logoSize", type: "number", label: "Tamanho do emblema (px)", min: 20, max: 120 },
          { key: "name", type: "text", label: "Nome" },
          { key: "tag", type: "text", label: "Tag" },
          { key: "score", type: "text", label: "Pontuação" },
          { key: "note", type: "text", label: "Observação" },
          { key: "color", type: "color", label: "Cor" },
        ] },
    ],
  },
  roster: {
    label: "Lista de pessoas (livre)", group: "Evento", icon: "users",
    defaults: { ...baseStyle, cols: 2, avatarSize: 38, items: [
      { avatar: "", name: "Nome do jogador", role: "Função", note: "" },
    ] },
    fields: [
      { key: "cols", type: "select", label: "Colunas", options: [
        { v: 1, l: "1" }, { v: 2, l: "2" }, { v: 3, l: "3" } ] },
      { key: "avatarSize", type: "number", label: "Tamanho do avatar (px)", min: 20, max: 120 },
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
          { key: "imgW", type: "number", label: "Largura da imagem (%)", min: 10, max: 100 },
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
          { key: "iconSize", type: "number", label: "Tamanho do ícone (px)", min: 14, max: 120 },
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

  march: {
    label: "Marcha / Esquadrão", group: "Batalha",
    defaults: { ...baseStyle, _bg: "panel", _title: "Marchas", cols: 1, mode: "pct", heroSize: 62,
      items: [{ title: "Marcha 1", note: "", infHero: "", cavHero: "", archHero: "",
        infName: "", cavName: "", archName: "",
        infPct: 34, cavPct: 33, archPct: 33, infQty: "", cavQty: "", archQty: "", why: "" }] },
    styleFields: [
      { key: "heroSize", type: "number", label: "Tamanho dos retratos (px)", min: 32, max: 140 },
    ],
    fields: [
      { key: "mode", type: "select", label: "Como informar as tropas", options: [
        { v: "pct", l: "Porcentagem ideal" }, { v: "qty", l: "Quantidade exata" }, { v: "none", l: "Não mostrar" } ] },
      { key: "cols", type: "select", label: "Colunas", options: [
        { v: 1, l: "1" }, { v: 2, l: "2" } ] },
      { key: "items", type: "list", label: "Marchas", addLabel: "Adicionar marcha", titleKey: "title", item: [
        { key: "title", type: "text", label: "Nome da marcha" },
        { key: "note", type: "text", label: "Legenda curta" },
        { type: "heading", label: "Heróis" },
        { key: "infHero", type: "image", label: "Herói de Infantaria" },
        { key: "infName", type: "text", label: "Nome" },
        { key: "cavHero", type: "image", label: "Herói de Cavalaria" },
        { key: "cavName", type: "text", label: "Nome" },
        { key: "archHero", type: "image", label: "Herói de Arquearia" },
        { key: "archName", type: "text", label: "Nome" },
        { type: "heading", label: "Tropas" },
        { key: "infPct", type: "number", label: "Infantaria (%)", min: 0, max: 100 },
        { key: "cavPct", type: "number", label: "Cavalaria (%)", min: 0, max: 100 },
        { key: "archPct", type: "number", label: "Arquearia (%)", min: 0, max: 100 },
        { key: "infQty", type: "text", label: "Infantaria (quantidade)" },
        { key: "cavQty", type: "text", label: "Cavalaria (quantidade)" },
        { key: "archQty", type: "text", label: "Arquearia (quantidade)" },
        { type: "heading", label: "Explicação" },
        { key: "why", type: "richtext", label: "Por que este esquadrão" },
      ] },
    ],
  },

  /* ---------------- Members ---------------- */
  lineup: {
    label: "Escalação (vagas + confirmação)", group: "Membros",
    defaults: { ...baseStyle, _bg: "panel", _title: "Entrar", slots: 30, cols: 1, avatarSize: 46,
      show: { avatar: true, name: true, tier: true, power: true, troops: true },
      askConfirm: true, picks: [] },
    fields: [
      { key: "slots", type: "number", label: "Vagas", min: 0, max: 200 },
      { key: "askConfirm", type: "toggle", label: "Pedir confirmação de participação" },
      { key: "cols", type: "select", label: "Colunas", options: [
        { v: 1, l: "1" }, { v: 2, l: "2" } ] },
      { key: "avatarSize", type: "number", label: "Tamanho do avatar (px)", min: 24, max: 120 },
      { key: "show", type: "checks", label: "O que mostrar de cada jogador" },
      { key: "picks", type: "members", label: "Quem está escalado" },
    ],
  },
  memberlist: {
    label: "Membros (seção livre)", group: "Membros",
    defaults: { ...baseStyle, _bg: "panel", _title: "Membros", cols: 2, avatarSize: 46,
      show: { avatar: true, name: true, tier: true, power: true, troops: true }, picks: [] },
    fields: [
      { key: "cols", type: "select", label: "Colunas", options: [
        { v: 1, l: "1" }, { v: 2, l: "2" }, { v: 3, l: "3" } ] },
      { key: "avatarSize", type: "number", label: "Tamanho do avatar (px)", min: 24, max: 120 },
      { key: "show", type: "checks", label: "O que mostrar de cada jogador" },
      { key: "picks", type: "members", label: "Membros selecionados" },
    ],
  },
  confirmed: {
    label: "Confirmados (resumo)", group: "Membros",
    defaults: { ...baseStyle, _bg: "panel", _title: "Confirmações",
      only: [], showNames: true, showTotal: true },
    fields: [
      { key: "only", type: "lineups", label: "Quais escalações somar" },
      { key: "showNames", type: "toggle", label: "Listar os nomes" },
      { key: "showTotal", type: "toggle", label: "Mostrar o total geral" },
    ],
  },

  /* ---------------- Battle (Tri-Alliance) ---------------- */
  squads: {
    label: "Esquadrões / Heróis", group: "Batalha",
    defaults: { ...baseStyle, _bg: "panel", _title: "Formations", cols: 1, heroSize: 54, items: [
      { title: "Attack squad 1", kind: "attack", note: "", heroes: [{ icon: "", name: "" }] },
    ] },
    fields: [
      { key: "cols", type: "select", label: "Colunas", options: [
        { v: 1, l: "1" }, { v: 2, l: "2" } ] },
      { key: "heroSize", type: "number", label: "Tamanho dos retratos (px)", min: 28, max: 140 },
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
    label: "Contagem de batalha (antigo)", group: "Batalha", hidden: true,
    defaults: { ...baseStyle, _bg: "panel", _align: "center", _title: "Battle starts in",
      target: "", durationMin: 60,
      showDays: true, showHours: true, showMin: true, showSec: true,
      labelDays: "Days", labelHours: "Hours", labelMin: "Min", labelSec: "Sec",
      liveText: "BATTLE IN PROGRESS", liveIcon: "", doneText: "Battle completed",
      numMetal: true, numColor: "", numFont: "display", numSize: 30,
      cell: "panel", sep: "colon", unitSize: 8.5, unitColor: "" },
    fields: [
      { key: "target", type: "datetime", label: "Data e hora do evento" },
      { key: "durationMin", type: "number", label: "Duração do evento (min)", min: 0, max: 1440 },
      { type: "heading", label: "Unidades" },
      { key: "showDays", type: "toggle", label: "Mostrar dias" },
      { key: "showHours", type: "toggle", label: "Mostrar horas" },
      { key: "showMin", type: "toggle", label: "Mostrar minutos" },
      { key: "showSec", type: "toggle", label: "Mostrar segundos" },
      { key: "labelDays", type: "text", label: "Rótulo dos dias" },
      { key: "labelHours", type: "text", label: "Rótulo das horas" },
      { key: "labelMin", type: "text", label: "Rótulo dos minutos" },
      { key: "labelSec", type: "text", label: "Rótulo dos segundos" },
      { type: "heading", label: "Mensagens" },
      { key: "liveText", type: "text", label: "Durante o evento" },
      { key: "liveIcon", type: "image", label: "Ícone durante o evento" },
      { key: "doneText", type: "text", label: "Depois do evento" },
    ],
    styleFields: [
      { type: "heading", label: "Números" },
      { key: "numMetal", type: "toggle", label: "Dourado metálico" },
      { key: "numColor", type: "color", label: "Cor (se não for metálico)" },
      { key: "numFont", type: "select", label: "Fonte", options: FONTS },
      { key: "numSize", type: "number", label: "Tamanho (px)", min: 14, max: 96 },
      { type: "heading", label: "Caixas e separador" },
      { key: "cell", type: "select", label: "Estilo das caixas", options: [
        { v: "panel", l: "Painel" }, { v: "plain", l: "Sem caixa" }, { v: "frame", l: "Moldura dourada" } ] },
      { key: "sep", type: "select", label: "Separador", options: [
        { v: "colon", l: "Dois-pontos" }, { v: "dot", l: "Ponto" }, { v: "none", l: "Nenhum" } ] },
      { type: "heading", label: "Rótulos das unidades" },
      { key: "unitSize", type: "number", label: "Tamanho (px)", min: 6, max: 24 },
      { key: "unitColor", type: "color", label: "Cor" },
    ],
  },
  howwewin: {
    label: "Como vencemos", group: "Batalha",
    defaults: { label: "How we win", items: [{ title: "Título", text: "Explicação." }] },
    fields: [
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
    label: "Fases da batalha", group: "Batalha",
    defaults: { label: "The phases", marks: "0, 20, 40, 60",
      items: [{ name: "Fase", span: "0–20 min", color: "#ecc25a", weight: 20, points: "Ponto 1\nPonto 2" }] },
    fields: [
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
    label: "Prédios", group: "Batalha",
    defaults: { label: "The buildings", items: [{ img: "", name: "Prédio", codes: "", pts: "", note: "", hot: false }] },
    fields: [
      { key: "items", type: "list", label: "Prédios", addLabel: "Adicionar prédio", titleKey: "name", item: [
        { key: "img", type: "image", label: "Imagem" },
        { key: "imgW", type: "number", label: "Largura (px)", min: 30, max: 220 },
        { key: "imgH", type: "number", label: "Altura (px)", min: 30, max: 220 },
        { key: "name", type: "text", label: "Nome" },
        { key: "codes", type: "text", label: "Códigos / quando abre" },
        { key: "pts", type: "text", label: "Pontos" },
        { key: "note", type: "text", label: "Observação" },
        { key: "hot", type: "toggle", label: "Destacar" },
      ] },
    ],
  },
  rules: {
    label: "Regras", group: "Batalha",
    defaults: { label: "Key rules", items: [{ icon: "star", image: "", title: "Regra", text: "Descrição." }] },
    fields: [
      { key: "items", type: "list", label: "Regras", addLabel: "Adicionar regra", titleKey: "title", item: [
        { key: "icon", type: "select", label: "Ícone", options: [
          { v: "coins", l: "Moedas" }, { v: "bolt", l: "Energia" }, { v: "back", l: "Recuar" },
          { v: "heal", l: "Curar" }, { v: "block", l: "Bloqueio" }, { v: "portal", l: "Portal" },
          { v: "chat", l: "Chat" }, { v: "flag", l: "Bandeira" }, { v: "sword", l: "Espada" },
          { v: "shield", l: "Escudo" }, { v: "clock", l: "Relógio" }, { v: "star", l: "Estrela" } ] },
        { key: "image", type: "image", label: "Ou uma imagem (substitui o ícone)" },
        { key: "imgSize", type: "number", label: "Tamanho do ícone (px)", min: 12, max: 90 },
        { key: "title", type: "text", label: "Título" },
        { key: "text", type: "textarea", label: "Descrição" },
      ] },
    ],
  },
  marches: {
    label: "Marchas / Esquadrões", group: "Batalha",
    defaults: { label: "Your marches", items: [{ title: "March 1", text: "Seus melhores heróis" }],
      notes: [] },
    fields: [
      { key: "items", type: "list", label: "Marchas", addLabel: "Adicionar marcha", titleKey: "title", item: [
        { key: "title", type: "text", label: "Título" },
        { key: "text", type: "text", label: "Descrição" },
      ] },
      { key: "notes", type: "list", label: "Notas (quantas quiser)", addLabel: "Adicionar nota", titleKey: "text", item: [
        { key: "variant", type: "select", label: "Estilo", options: [
          { v: "note", l: "Nota" }, { v: "warn", l: "Aviso (laranja)" } ] },
        { key: "image", type: "image", label: "Imagem lateral" },
        { key: "imageSize", type: "number", label: "Tamanho da imagem (px)", min: 16, max: 120 },
        { key: "icons", type: "list", label: "Ícones", addLabel: "Adicionar ícone", titleKey: "src", item: [
          { key: "src", type: "image", label: "Ícone" },
          { key: "size", type: "number", label: "Tamanho (px)", min: 12, max: 90 },
        ] },
        { key: "text", type: "richtext", label: "Texto" },
      ] },
    ],
  },
};

export const GROUPS = ["Estrutura", "Mídia", "Evento", "Membros", "Batalha"];

export const newBlock = (type) => ({
  id: `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
  type,
  ...structuredClone(BLOCKS[type].defaults),
});

export const DEFAULT_THEME = { accent: "#ecc25a", maxWidth: 560 };
