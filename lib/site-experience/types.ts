import {
  DEFAULT_STOREFRONT_CONTENT,
  type StorefrontContent,
} from "../storefront-content/types.ts";

export const EXPERIENCE_PAGE_IDS = ["home", "account", "slot"] as const;
export type ExperiencePageId = (typeof EXPERIENCE_PAGE_IDS)[number];

export const EXPERIENCE_FONT_IDS = ["archivo-black", "manrope"] as const;
export type ExperienceFontId = (typeof EXPERIENCE_FONT_IDS)[number];

export const EXPERIENCE_EFFECT_FAMILIES = [
  "feathers",
  "ammo",
  "embers",
  "sparks",
  "lightning",
] as const;
export type ExperienceEffectFamily =
  (typeof EXPERIENCE_EFFECT_FAMILIES)[number];

export const EXPERIENCE_EFFECT_DENSITIES = [
  "off",
  "light",
  "standard",
] as const;
export type ExperienceEffectDensity =
  (typeof EXPERIENCE_EFFECT_DENSITIES)[number];

export type ExperienceTheme = {
  backgroundColor: string;
  surfaceColor: string;
  accentColor: string;
  headingColor: string;
  bodyColor: string;
  displayFont: ExperienceFontId;
  bodyFont: ExperienceFontId;
};

export type ExperienceEffects = {
  density: ExperienceEffectDensity;
  families: ExperienceEffectFamily[];
};

export type AccountExperienceContent = {
  navigationLabel: string;
  anonymousEyebrow: string;
  anonymousTitle: string;
  anonymousSupport: string;
  journeyEyebrow: string;
  journeyTitle: string;
  slotCardEyebrow: string;
  slotCardTitle: string;
  ordersEyebrow: string;
  ordersTitle: string;
};

export type SlotExperienceContent = {
  heroEyebrow: string;
  heroTitle: string;
  heroAccent: string;
  heroSupport: string;
  primaryAction: string;
  secondaryAction: string;
  mascotLabel: string;
  machineEyebrow: string;
  machineTitle: string;
  rulesEyebrow: string;
  rulesTitle: string;
};

export type SiteExperienceConfig = {
  schemaVersion: 1;
  home: {
    content: StorefrontContent;
    theme: ExperienceTheme;
    effects: ExperienceEffects;
  };
  account: {
    content: AccountExperienceContent;
    theme: ExperienceTheme;
    effects: ExperienceEffects;
  };
  slot: {
    content: SlotExperienceContent;
    theme: ExperienceTheme;
    effects: ExperienceEffects;
  };
};

const DARK_THEME: ExperienceTheme = {
  backgroundColor: "#000000",
  surfaceColor: "#10070A",
  accentColor: "#F00836",
  headingColor: "#FFFFFF",
  bodyColor: "#D7D7DB",
  displayFont: "archivo-black",
  bodyFont: "manrope",
};

export const DEFAULT_SITE_EXPERIENCE: SiteExperienceConfig = {
  schemaVersion: 1,
  home: {
    content: { ...DEFAULT_STOREFRONT_CONTENT },
    theme: { ...DARK_THEME },
    effects: { density: "standard", families: ["embers", "sparks"] },
  },
  account: {
    content: {
      navigationLabel: "Central do jogador",
      anonymousEyebrow: "Sua história começa aqui",
      anonymousTitle: "Entre para transformar compras em uma jornada 6DNX.",
      anonymousSupport:
        "O login não é obrigatório para comprar. Ele conecta novos pedidos, histórico e benefícios à sua conta.",
      journeyEyebrow: "Ecossistema 6DNX",
      journeyTitle: "Sua jornada de benefícios",
      slotCardEyebrow: "Nova experiência",
      slotCardTitle: "Slot da Sorte 6DNX",
      ordersEyebrow: "Histórico operacional",
      ordersTitle: "Meus pedidos",
    },
    theme: {
      ...DARK_THEME,
      backgroundColor: "#050507",
      surfaceColor: "#0B0709",
      accentColor: "#F00836",
    },
    effects: { density: "light", families: ["embers"] },
  },
  slot: {
    content: {
      heroEyebrow: "A próxima experiência 6DNX",
      heroTitle: "Slot da Sorte",
      heroAccent: "6DNX",
      heroSupport:
        "Uma experiência cinematográfica de fidelidade. Conheça a cabine, veja o mascote reagir e entenda as regras.",
      primaryAction: "Conhecer a experiência",
      secondaryAction: "Ver regras claras",
      mascotLabel: "O guardião da cabine",
      machineEyebrow: "Cabine visual 6DNX",
      machineTitle: "Conheça a experiência.",
      rulesEyebrow: "Diversão responsável",
      rulesTitle: "Regras claras, antes de jogar.",
    },
    theme: {
      ...DARK_THEME,
      backgroundColor: "#040205",
      surfaceColor: "#100207",
      accentColor: "#EF0038",
    },
    effects: { density: "standard", families: ["embers", "sparks"] },
  },
};

export type SiteExperienceAdminState =
  | "ready"
  | "schema-missing"
  | "mfa-required"
  | "unavailable";

export type SiteExperienceRevision = {
  revision: number;
  publishedAt: string;
};

export type SiteExperienceAdminRecord = {
  published: SiteExperienceConfig;
  draft: SiteExperienceConfig;
  publishedRevision: number;
  draftRevision: number;
  basePublishedRevision: number;
  updatedAt: string | null;
  history: SiteExperienceRevision[];
  state: SiteExperienceAdminState;
  message?: string;
};

export function cloneSiteExperience(
  config: SiteExperienceConfig,
): SiteExperienceConfig {
  return structuredClone(config);
}
