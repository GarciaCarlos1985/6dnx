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

/**
 * A background is intentionally an asset URL produced by the protected admin
 * upload endpoint. Arbitrary remote URLs are never accepted by the mutation
 * boundary, which keeps the public pages free from third-party embeds.
 */
export type ExperienceBackground = {
  imageUrl: string | null;
};

/**
 * The cinematic scene is optional presentation, never part of the catalog or
 * a purchase flow. Keeping each switch separate lets an editor pair a static
 * banner with as much (or as little) atmosphere as makes sense.
 */
export type HomeCinematicControls = {
  logoEnabled: boolean;
  eyeEnabled: boolean;
  logoEffectsEnabled: boolean;
  charactersEnabled: boolean;
  productCharactersEnabled: boolean;
  aurasEnabled: boolean;
  pointerEffectsEnabled: boolean;
  smokeEnabled: boolean;
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
  schemaVersion: 1 | 2;
  home: {
    content: StorefrontContent;
    theme: ExperienceTheme;
    effects: ExperienceEffects;
    background: ExperienceBackground;
    cinematic: HomeCinematicControls;
  };
  account: {
    content: AccountExperienceContent;
    theme: ExperienceTheme;
    effects: ExperienceEffects;
    background: ExperienceBackground;
  };
  slot: {
    content: SlotExperienceContent;
    theme: ExperienceTheme;
    effects: ExperienceEffects;
    background: ExperienceBackground;
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
  schemaVersion: 2,
  home: {
    content: { ...DEFAULT_STOREFRONT_CONTENT },
    theme: { ...DARK_THEME },
    effects: { density: "standard", families: ["embers", "sparks"] },
    background: { imageUrl: null },
    cinematic: {
      logoEnabled: true,
      eyeEnabled: true,
      logoEffectsEnabled: true,
      charactersEnabled: true,
      productCharactersEnabled: true,
      aurasEnabled: true,
      pointerEffectsEnabled: true,
      smokeEnabled: true,
    },
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
    background: { imageUrl: null },
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
    background: { imageUrl: null },
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
