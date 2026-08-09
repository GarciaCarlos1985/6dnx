export const DEFAULT_STOREFRONT_CONTENT = {
  heroHeadlineLead: "Soluções",
  heroHeadlineAccent: "Incríveis, Seguras",
  heroHeadlineTail: "e Profissionais",
  heroSupport:
    "Descubra soluções criadas para elevar sua experiência em diferentes jogos.",
  heroRevealTitle: "Informação clara. Compra assistida.",
  heroRevealAccent: "Suporte humano.",
  heroRevealSupport: "Escolha sua solução abaixo",
  heroCtaLabel: "Comprar agora",
  catalogTitle: "Soluções 6DNX",
  catalogDescription:
    "Doze soluções ficam à vista. Cada fileira possui navegação própria para explorar o restante do catálogo sem perder a posição.",
  continuationEyebrow: "Catálogo em profundidade",
  continuationTitle: "Continue explorando",
} as const;

export type StorefrontContent = {
  -readonly [Key in keyof typeof DEFAULT_STOREFRONT_CONTENT]: string;
};

export type StorefrontContentAdminState =
  | "ready"
  | "schema-missing"
  | "unavailable";

export type StorefrontContentAdminRecord = {
  content: StorefrontContent;
  revision: number;
  updatedAt: string | null;
  state: StorefrontContentAdminState;
  message?: string;
};
