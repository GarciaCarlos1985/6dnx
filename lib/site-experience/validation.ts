import {
  DEFAULT_SITE_EXPERIENCE,
  EXPERIENCE_EFFECT_DENSITIES,
  EXPERIENCE_EFFECT_FAMILIES,
  EXPERIENCE_FONT_IDS,
  type AccountExperienceContent,
  type ExperienceEffectDensity,
  type ExperienceEffectFamily,
  type ExperienceEffects,
  type ExperienceFontId,
  type ExperienceTheme,
  type SiteExperienceConfig,
  type SlotExperienceContent,
} from "./types.ts";
import {
  DEFAULT_STOREFRONT_CONTENT,
  type StorefrontContent,
} from "../storefront-content/types.ts";

const HEX_COLOR = /^#[0-9A-F]{6}$/;
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const DIRECTIONAL_OR_INVISIBLE_CHARACTERS = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/;
const HTML_DELIMITERS = /[<>]/;
const JAVASCRIPT_LINK = /\]\s*\(\s*javascript\s*:/i;
const MAX_EFFECT_FAMILIES = 2;
const MAX_DOCUMENT_BYTES = 48 * 1024;

const HOME_LIMITS: Record<keyof StorefrontContent, number> = {
  heroHeadlineLead: 40,
  heroHeadlineAccent: 80,
  heroHeadlineTail: 60,
  heroSupport: 220,
  heroRevealTitle: 100,
  heroRevealAccent: 60,
  heroRevealSupport: 100,
  heroCtaLabel: 32,
  catalogTitle: 80,
  catalogDescription: 260,
  continuationEyebrow: 60,
  continuationTitle: 80,
};

const ACCOUNT_LIMITS: Record<keyof AccountExperienceContent, number> = {
  navigationLabel: 40,
  anonymousEyebrow: 60,
  anonymousTitle: 110,
  anonymousSupport: 260,
  journeyEyebrow: 60,
  journeyTitle: 80,
  slotCardEyebrow: 60,
  slotCardTitle: 80,
  ordersEyebrow: 60,
  ordersTitle: 80,
};

const SLOT_LIMITS: Record<keyof SlotExperienceContent, number> = {
  heroEyebrow: 60,
  heroTitle: 70,
  heroAccent: 24,
  heroSupport: 260,
  primaryAction: 40,
  secondaryAction: 40,
  mascotLabel: 60,
  machineEyebrow: 60,
  machineTitle: 90,
  rulesEyebrow: 60,
  rulesTitle: 90,
};

type ValidationResult =
  | { ok: true; value: SiteExperienceConfig }
  | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function exactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
  errors: string[],
) {
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length) errors.push(`${label} contém campos não permitidos.`);
}

function normalizeText(
  value: unknown,
  fallback: string,
  maxLength: number,
  label: string,
  errors: string[],
) {
  if (typeof value !== "string") {
    errors.push(`${label} deve ser um texto.`);
    return fallback;
  }
  const normalized = value.normalize("NFC").replace(/\s+/g, " ").trim();
  if (!normalized) errors.push(`${label} é obrigatório.`);
  if (normalized.length > maxLength) {
    errors.push(`${label} deve ter no máximo ${maxLength} caracteres.`);
  }
  if (CONTROL_CHARACTERS.test(value)) {
    errors.push(`${label} contém caracteres de controle não permitidos.`);
  }
  if (DIRECTIONAL_OR_INVISIBLE_CHARACTERS.test(value)) {
    errors.push(`${label} contém caracteres invisíveis não permitidos.`);
  }
  if (HTML_DELIMITERS.test(value) || JAVASCRIPT_LINK.test(value)) {
    errors.push(`${label} deve conter somente texto simples.`);
  }
  return normalized.slice(0, maxLength) || fallback;
}

function parseTextObject<T extends Record<string, string>>(
  value: unknown,
  fallback: T,
  limits: Record<keyof T, number>,
  label: string,
  errors: string[],
): T {
  if (!isRecord(value)) {
    errors.push(`${label} é inválido.`);
    return { ...fallback };
  }
  const keys = Object.keys(fallback) as Array<keyof T>;
  exactKeys(value, keys as string[], label, errors);
  const output = {} as T;
  for (const key of keys) {
    output[key] = normalizeText(
      value[key as string],
      fallback[key],
      limits[key],
      `${label}: ${String(key)}`,
      errors,
    ) as T[keyof T];
  }
  return output;
}

function channel(hex: string, offset: number) {
  return Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
}

function luminance(hex: string) {
  const values = [channel(hex, 1), channel(hex, 3), channel(hex, 5)].map(
    (value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4),
  );
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}

export function contrastRatio(a: string, b: string) {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function parseColor(
  value: unknown,
  fallback: string,
  label: string,
  errors: string[],
) {
  const normalized = typeof value === "string" ? value.toUpperCase() : "";
  if (!HEX_COLOR.test(normalized)) {
    errors.push(`${label} deve usar o formato hexadecimal #RRGGBB.`);
    return fallback;
  }
  return normalized;
}

function parseTheme(
  value: unknown,
  fallback: ExperienceTheme,
  label: string,
  errors: string[],
): ExperienceTheme {
  if (!isRecord(value)) {
    errors.push(`${label} é inválido.`);
    return { ...fallback };
  }
  exactKeys(value, Object.keys(fallback), label, errors);
  const output: ExperienceTheme = {
    backgroundColor: parseColor(value.backgroundColor, fallback.backgroundColor, `${label}: fundo`, errors),
    surfaceColor: parseColor(value.surfaceColor, fallback.surfaceColor, `${label}: superfície`, errors),
    accentColor: parseColor(value.accentColor, fallback.accentColor, `${label}: destaque`, errors),
    headingColor: parseColor(value.headingColor, fallback.headingColor, `${label}: títulos`, errors),
    bodyColor: parseColor(value.bodyColor, fallback.bodyColor, `${label}: textos`, errors),
    displayFont: EXPERIENCE_FONT_IDS.includes(value.displayFont as ExperienceFontId)
      ? (value.displayFont as ExperienceFontId)
      : fallback.displayFont,
    bodyFont: EXPERIENCE_FONT_IDS.includes(value.bodyFont as ExperienceFontId)
      ? (value.bodyFont as ExperienceFontId)
      : fallback.bodyFont,
  };
  if (!EXPERIENCE_FONT_IDS.includes(value.displayFont as ExperienceFontId)) {
    errors.push(`${label}: a fonte de títulos não está na biblioteca segura.`);
  }
  if (!EXPERIENCE_FONT_IDS.includes(value.bodyFont as ExperienceFontId)) {
    errors.push(`${label}: a fonte de textos não está na biblioteca segura.`);
  }
  if (contrastRatio(output.backgroundColor, output.headingColor) < 4.5) {
    errors.push(`${label}: títulos precisam de contraste mínimo 4,5:1 com o fundo.`);
  }
  if (contrastRatio(output.backgroundColor, output.bodyColor) < 4.5) {
    errors.push(`${label}: textos precisam de contraste mínimo 4,5:1 com o fundo.`);
  }
  if (contrastRatio(output.backgroundColor, output.accentColor) < 3) {
    errors.push(`${label}: o destaque precisa de contraste mínimo 3:1 com o fundo.`);
  }
  return output;
}

function parseEffects(
  value: unknown,
  fallback: ExperienceEffects,
  label: string,
  errors: string[],
): ExperienceEffects {
  if (!isRecord(value)) {
    errors.push(`${label} é inválido.`);
    return { ...fallback, families: [...fallback.families] };
  }
  exactKeys(value, ["density", "families"], label, errors);
  const density = EXPERIENCE_EFFECT_DENSITIES.includes(
    value.density as ExperienceEffectDensity,
  )
    ? (value.density as ExperienceEffectDensity)
    : fallback.density;
  if (!EXPERIENCE_EFFECT_DENSITIES.includes(value.density as ExperienceEffectDensity)) {
    errors.push(`${label}: densidade inválida.`);
  }
  const rawFamilies = Array.isArray(value.families) ? value.families : [];
  const families = Array.from(new Set(rawFamilies)).filter((family): family is ExperienceEffectFamily =>
    EXPERIENCE_EFFECT_FAMILIES.includes(family as ExperienceEffectFamily),
  );
  if (!Array.isArray(value.families) || families.length !== rawFamilies.length) {
    errors.push(`${label}: existe uma família de partículas inválida ou repetida.`);
  }
  if (families.length > MAX_EFFECT_FAMILIES) {
    errors.push(`${label}: ative no máximo ${MAX_EFFECT_FAMILIES} famílias ao mesmo tempo.`);
  }
  if (density !== "off" && families.length === 0) {
    errors.push(`${label}: escolha uma família ou desligue os efeitos.`);
  }
  return {
    density,
    families: density === "off" ? [] : families.slice(0, MAX_EFFECT_FAMILIES),
  };
}

function parsePage(
  value: unknown,
  fallback: SiteExperienceConfig["home"],
  content: (value: unknown, errors: string[]) => StorefrontContent,
  label: string,
  errors: string[],
): SiteExperienceConfig["home"];
function parsePage(
  value: unknown,
  fallback: SiteExperienceConfig["account"],
  content: (value: unknown, errors: string[]) => AccountExperienceContent,
  label: string,
  errors: string[],
): SiteExperienceConfig["account"];
function parsePage(
  value: unknown,
  fallback: SiteExperienceConfig["slot"],
  content: (value: unknown, errors: string[]) => SlotExperienceContent,
  label: string,
  errors: string[],
): SiteExperienceConfig["slot"];
function parsePage(
  value: unknown,
  fallback: SiteExperienceConfig["home"] | SiteExperienceConfig["account"] | SiteExperienceConfig["slot"],
  content: (value: unknown, errors: string[]) => StorefrontContent | AccountExperienceContent | SlotExperienceContent,
  label: string,
  errors: string[],
) {
  if (!isRecord(value)) {
    errors.push(`${label} é inválida.`);
    return structuredClone(fallback);
  }
  exactKeys(value, ["content", "theme", "effects"], label, errors);
  return {
    content: content(value.content, errors),
    theme: parseTheme(value.theme, fallback.theme, `${label}: aparência`, errors),
    effects: parseEffects(value.effects, fallback.effects, `${label}: efeitos`, errors),
  };
}

export function parseSiteExperienceConfig(value: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["A configuração visual é inválida."] };
  }
  exactKeys(value, ["schemaVersion", "home", "account", "slot"], "Configuração", errors);
  try {
    if (new TextEncoder().encode(JSON.stringify(value)).byteLength > MAX_DOCUMENT_BYTES) {
      errors.push("A configuração visual excede o limite seguro de 48 KB.");
    }
  } catch {
    errors.push("A configuração visual não pode ser serializada.");
  }
  if (value.schemaVersion !== 1) errors.push("A versão da configuração não é suportada.");

  const parsed: SiteExperienceConfig = {
    schemaVersion: 1,
    home: parsePage(
      value.home,
      DEFAULT_SITE_EXPERIENCE.home,
      (candidate, pageErrors) => parseTextObject(
        candidate,
        { ...DEFAULT_STOREFRONT_CONTENT },
        HOME_LIMITS,
        "Home: conteúdo",
        pageErrors,
      ),
      "Home",
      errors,
    ),
    account: parsePage(
      value.account,
      DEFAULT_SITE_EXPERIENCE.account,
      (candidate, pageErrors) => parseTextObject(
        candidate,
        DEFAULT_SITE_EXPERIENCE.account.content,
        ACCOUNT_LIMITS,
        "Conta: conteúdo",
        pageErrors,
      ),
      "Conta",
      errors,
    ),
    slot: parsePage(
      value.slot,
      DEFAULT_SITE_EXPERIENCE.slot,
      (candidate, pageErrors) => parseTextObject(
        candidate,
        DEFAULT_SITE_EXPERIENCE.slot.content,
        SLOT_LIMITS,
        "Slot: conteúdo",
        pageErrors,
      ),
      "Slot",
      errors,
    ),
  };
  return errors.length ? { ok: false, errors } : { ok: true, value: parsed };
}

export function parseSiteExperienceMutation(value: unknown):
  | {
      ok: true;
      value: {
        config: SiteExperienceConfig;
        expectedDraftRevision: number;
        expectedPublishedRevision: number;
      };
    }
  | { ok: false; errors: string[] } {
  if (!isRecord(value)) return { ok: false, errors: ["Dados da edição inválidos."] };
  const errors: string[] = [];
  exactKeys(
    value,
    ["config", "expectedDraftRevision", "expectedPublishedRevision"],
    "Edição",
    errors,
  );
  const parsed = parseSiteExperienceConfig(value.config);
  if (!parsed.ok) errors.push(...parsed.errors);
  const expectedDraftRevision = Number(value.expectedDraftRevision);
  const expectedPublishedRevision = Number(value.expectedPublishedRevision);
  if (!Number.isInteger(expectedDraftRevision) || expectedDraftRevision < 1) {
    errors.push("A revisão do rascunho é obrigatória.");
  }
  if (!Number.isInteger(expectedPublishedRevision) || expectedPublishedRevision < 1) {
    errors.push("A revisão publicada é obrigatória.");
  }
  return errors.length || !parsed.ok
    ? { ok: false, errors }
    : {
        ok: true,
        value: { config: parsed.value, expectedDraftRevision, expectedPublishedRevision },
      };
}
