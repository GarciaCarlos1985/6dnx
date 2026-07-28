export type ProductStatus = "undetected" | "updating";

export type Variant = {
  name: string;
  note?: string;
  /** PREENCHER: preço real em R$. Sem valor, o card mostra "sob consulta". */
  priceBRL?: number;
  badge?: string;
};

export type Product = {
  slug: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  image: string;
  status: ProductStatus;
  variants: Variant[];
  /** PREENCHER: id do vídeo do YouTube (o trecho depois de `v=`). */
  youtubeId?: string;
  videoOrientation?: "landscape" | "portrait";
};

// ─────────────────────────────────────────────────────────────────────────────
// PREENCHER ANTES DE PUBLICAR
//   • priceBRL de cada variação — hoje todas saem como "sob consulta".
//   • youtubeId de cada produto — sem ele o player mostra um aviso.
// Os produtos e variações abaixo vieram dos canais do Discord 6DNX SHOP.
// ─────────────────────────────────────────────────────────────────────────────

export const products: Product[] = [
  {
    slug: "dayz",
    title: "DayZ",
    category: "Software para DayZ",
    tagline: "A linha mais completa da 6DNX",
    description:
      "Nossa categoria carro-chefe. Sete builds distintas para DayZ, de spoofer de hardware a versões private focadas em discrição. Cada build tem seu próprio canal de suporte no Discord.",
    image: "/products/card-art/dayz-6dnx.webp",
    status: "undetected",
    variants: [
      { name: "Spoofer", note: "Limpeza de HWID" },
      { name: "Moonwalk" },
      { name: "Private", note: "Acesso restrito" },
      { name: "DayZ · GG" },
      { name: "Rage", note: "Full visual" },
      { name: "Shadow", note: "Foco em discrição" },
      { name: "Elisyum" },
    ],
  },
  {
    slug: "arc-raiders",
    title: "Arc Raiders",
    category: "Software para Arc Raiders",
    tagline: "Duas builds, entrega imediata",
    description:
      "Cobertura para Arc Raiders em duas frentes: a build Private, de circulação controlada, e a GG, com atualização acompanhando cada patch do jogo.",
    image: "/products/card-art/arc-raiders-6dnx.webp",
    status: "undetected",
    variants: [
      { name: "Private", note: "Acesso restrito" },
      { name: "GG" },
    ],
  },
  {
    slug: "cs2",
    title: "Counter-Strike 2",
    category: "Software para CS2",
    tagline: "Kryptos, Horus e o novo Radar",
    description:
      "Três produtos para CS2, incluindo o Radar recém-lançado. Suporte e atualizações pelos canais dedicados de cada build no Discord.",
    image: "/products/card-art/cs2-6dnx.webp",
    status: "undetected",
    variants: [
      { name: "Kryptos" },
      { name: "Horus" },
      { name: "Radar", badge: "NOVO" },
    ],
  },
  {
    slug: "contas-steam-nfa",
    title: "Contas Steam NFA",
    category: "Contas e acesso",
    tagline: "Executável ou token, vários jogos",
    description:
      "Contas NFA (No First Answer) entregues de duas formas: por executável ou via token. Entre, jogue e preserve a sessão, a senha e o e-mail originais. Disponíveis para DayZ, CS, Arc Raiders, Rust, Dead by Daylight, Squad, Scum, Arma Reforger e jogos aleatórios.",
    image: "/products/card-art/steam-nfa-6dnx.webp",
    status: "undetected",
    variants: [
      { name: "NFA · Executável", note: "Entrega por loader" },
      { name: "NFA · Token", note: "Entrega por token" },
      { name: "DayZ" },
      { name: "Counter-Strike" },
      { name: "Arc Raiders" },
      { name: "Rust" },
      { name: "Dead by Daylight" },
      { name: "Squad" },
      { name: "Scum" },
      { name: "Arma Reforger" },
      { name: "Jogos Aleatórios" },
    ],
  },
  {
    slug: "custom-steam-profile",
    title: "Custom Steam Profile",
    category: "Personalização Steam",
    tagline: "Seu perfil Steam, sob medida",
    description:
      "Personalização completa de perfil da Steam. Escolha entre os modelos prontos ou encomende um perfil autoral. O canal oficial pede nível 10, pontos na Loja de Pontos e um tema definido antes do orçamento.",
    image: "/products/card-art/steam-profile-6dnx.webp",
    status: "undetected",
    youtubeId: "BqPwa1SXowE",
    videoOrientation: "portrait",
    variants: [
      { name: "Modelos", note: "Catálogo pronto" },
      { name: "Seu Perfil", note: "Sob encomenda" },
      { name: "Requisitos", note: "Leia antes" },
    ],
  },
  {
    slug: "reshades",
    title: "Reshades",
    category: "Visual e presets",
    tagline: "Do gratuito ao exclusivo",
    description:
      "Presets de Reshade para deixar a imagem mais legível e com a sua identidade. Há uma linha gratuita liberada na comunidade e a opção de reshade exclusivo.",
    image: "/products/card-art/reshades-6dnx.webp",
    status: "undetected",
    variants: [
      { name: "Free Reshades", note: "Gratuito" },
      { name: "Seu Reshade", note: "Exclusivo" },
    ],
  },
  {
    slug: "thermal",
    title: "Thermal",
    category: "Ferramenta visual",
    tagline: "Leitura térmica para cenários críticos",
    description:
      "Solução visual térmica apresentada no canal oficial da 6DNX. Configuração, compatibilidade e valor são confirmados diretamente com o suporte antes da aquisição.",
    image: "/products/card-art/thermal-6dnx.webp",
    status: "undetected",
    variants: [
      { name: "Thermal", note: "Compatibilidade sob consulta" },
    ],
  },
];

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Menor preço definido entre as variações, ou null se nenhuma tiver preço. */
export function priceFrom(product: Product): number | null {
  const prices = product.variants
    .map((v) => v.priceBRL)
    .filter((p): p is number => typeof p === "number");
  return prices.length ? Math.min(...prices) : null;
}
