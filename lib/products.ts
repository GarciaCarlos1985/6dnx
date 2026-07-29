export type ProductStatus = "available" | "custom";

export type Variant = {
  name: string;
  note?: string;
  /**
   * Valor de referência em R$ para montagem da vitrine.
   * Não deve ser usado como cobrança real sem validação comercial.
   */
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
  /** ID do vídeo do YouTube (o trecho depois de `v=`), quando disponível. */
  youtubeId?: string;
  videoOrientation?: "landscape" | "portrait";
};

/**
 * Catálogo legítimo de referência.
 *
 * Os valores abaixo são rascunhos editoriais para testar a vitrine e o
 * checkout de laboratório. Eles não autorizam cobrança real nem substituem a
 * confirmação comercial do responsável pela 6DNX.
 */
export const products: Product[] = [
  {
    slug: "performance-audit",
    title: "PC Performance Audit",
    category: "Diagnóstico e desempenho",
    tagline: "Um diagnóstico claro para jogar com estabilidade",
    description:
      "Análise guiada de desempenho do computador, temperaturas, uso de memória, armazenamento e configurações do sistema. A entrega inclui um relatório objetivo e um plano de melhorias sem prometer resultados incompatíveis com o hardware.",
    image: "/products/card-art/performance-audit-6dnx.webp",
    status: "available",
    variants: [
      {
        name: "Essencial",
        note: "Checklist e diagnóstico remoto",
        priceBRL: 49.9,
      },
      {
        name: "Completo",
        note: "Diagnóstico e relatório priorizado",
        priceBRL: 89.9,
        badge: "POPULAR",
      },
      {
        name: "Acompanhado",
        note: "Relatório e sessão de orientação",
        priceBRL: 149.9,
      },
    ],
  },
  {
    slug: "game-setup-pro",
    title: "Game Setup Pro",
    category: "Configuração de jogos",
    tagline: "Controles, vídeo e áudio ajustados ao seu setup",
    description:
      "Configuração assistida de opções permitidas pelo próprio jogo: controles, sensibilidade, acessibilidade, qualidade visual e áudio. O serviço respeita as regras de cada plataforma e não instala automações ou vantagens indevidas.",
    image: "/products/card-art/game-setup-pro-6dnx.webp",
    status: "available",
    variants: [
      {
        name: "1 Jogo",
        note: "Configuração de um título",
        priceBRL: 39.9,
      },
      {
        name: "3 Jogos",
        note: "Pacote para três títulos",
        priceBRL: 79.9,
        badge: "PACOTE",
      },
      {
        name: "Setup Completo",
        note: "Jogos e periféricos compatíveis",
        priceBRL: 129.9,
      },
    ],
  },
  {
    slug: "aim-training-lab",
    title: "Aim Training Lab",
    category: "Treino e evolução",
    tagline: "Rotina legítima para precisão e consistência",
    description:
      "Plano de treino personalizado para ferramentas e modos de prática permitidos. A proposta organiza metas, sensibilidade, aquecimento e acompanhamento de evolução sem alterar o jogo ou automatizar movimentos.",
    image: "/products/card-art/aim-training-lab-6dnx.webp",
    status: "custom",
    variants: [
      {
        name: "Starter",
        note: "Rotina inicial de treino",
        priceBRL: 29.9,
      },
      {
        name: "Pro",
        note: "Plano evolutivo de quatro semanas",
        priceBRL: 59.9,
        badge: "RECOMENDADO",
      },
      {
        name: "Coaching",
        note: "Plano e sessão individual",
        priceBRL: 99.9,
      },
    ],
  },
  {
    slug: "creator-identity-pack",
    title: "Creator Identity Pack",
    category: "Design para criadores",
    tagline: "Uma identidade visual pronta para se destacar",
    description:
      "Criação de peças visuais originais para perfis, comunidades e canais: avatar, banner e elementos coordenados dentro da estética escolhida. A arte final é ajustada aos formatos combinados antes da entrega.",
    image: "/products/card-art/creator-identity-pack-6dnx.webp",
    status: "custom",
    variants: [
      { name: "Avatar", note: "Uma peça principal", priceBRL: 34.9 },
      {
        name: "Combo",
        note: "Avatar e banner coordenados",
        priceBRL: 69.9,
        badge: "POPULAR",
      },
      {
        name: "Identidade Completa",
        note: "Kit visual para múltiplos formatos",
        priceBRL: 119.9,
      },
    ],
  },
  {
    slug: "custom-steam-profile",
    title: "Custom Steam Profile",
    category: "Personalização Steam",
    tagline: "Seu perfil Steam com identidade própria",
    description:
      "Personalização visual de perfil da Steam com recursos oficiais da plataforma. Escolha um modelo, encomende uma composição autoral ou faça uma consultoria de requisitos antes de definir o projeto.",
    image: "/products/card-art/steam-profile-6dnx.webp",
    status: "custom",
    youtubeId: "BqPwa1SXowE",
    videoOrientation: "portrait",
    variants: [
      {
        name: "Modelo Pronto",
        note: "Composição baseada no catálogo",
        priceBRL: 49.9,
      },
      {
        name: "Perfil Autoral",
        note: "Direção visual sob encomenda",
        priceBRL: 149.9,
        badge: "EXCLUSIVO",
      },
      {
        name: "Consultoria",
        note: "Tema, requisitos e planejamento",
        priceBRL: 29.9,
      },
    ],
  },
  {
    slug: "reshades",
    title: "Visual Presets",
    category: "Visual e presets",
    tagline: "Uma direção de cor para cada experiência",
    description:
      "Presets visuais para capturas, experiências offline e jogos que permitam filtros externos. A configuração é feita com foco estético e de legibilidade, sempre respeitando os termos do título e da plataforma.",
    image: "/products/card-art/reshades-6dnx.webp",
    status: "custom",
    variants: [
      {
        name: "Preset Essencial",
        note: "Perfil visual pronto",
        priceBRL: 24.9,
      },
      {
        name: "Preset Autoral",
        note: "Ajuste criado para o seu estilo",
        priceBRL: 59.9,
        badge: "AUTORAL",
      },
      {
        name: "Pacote Criador",
        note: "Três variações para conteúdo",
        priceBRL: 99.9,
      },
    ],
  },
  {
    slug: "stream-studio-setup",
    title: "Stream Studio Setup",
    category: "Conteúdo e transmissão",
    tagline: "Áudio, câmera e cenas em uma experiência coesa",
    description:
      "Organização assistida do ambiente de transmissão: cenas, áudio, câmera, atalhos e identidade básica. O objetivo é entregar um fluxo compreensível e fácil de manter com as ferramentas já disponíveis ao criador.",
    image: "/products/card-art/stream-studio-6dnx.webp",
    status: "custom",
    variants: [
      {
        name: "Revisão",
        note: "Diagnóstico do ambiente atual",
        priceBRL: 49.9,
      },
      {
        name: "Studio Setup",
        note: "Organização completa de cenas e áudio",
        priceBRL: 109.9,
        badge: "POPULAR",
      },
      {
        name: "Creator Plus",
        note: "Setup, identidade e orientação",
        priceBRL: 179.9,
      },
    ],
  },
];

export function productStatusLabel(status: ProductStatus) {
  return status === "available" ? "Disponível" : "Sob medida";
}

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Menor preço de referência definido entre as variações. */
export function priceFrom(product: Product): number | null {
  const prices = product.variants
    .map((variant) => variant.priceBRL)
    .filter((price): price is number => typeof price === "number");
  return prices.length ? Math.min(...prices) : null;
}
