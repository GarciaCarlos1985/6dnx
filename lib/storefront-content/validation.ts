import {
  DEFAULT_STOREFRONT_CONTENT,
  type StorefrontContent,
} from "./types.ts";

type StorefrontContentKey = keyof StorefrontContent;

const FIELD_LIMITS: Record<StorefrontContentKey, number> = {
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

const FIELD_LABELS: Record<StorefrontContentKey, string> = {
  heroHeadlineLead: "Início do slogan do hero",
  heroHeadlineAccent: "Destaque do slogan do hero",
  heroHeadlineTail: "Final do slogan do hero",
  heroSupport: "Texto de apoio do hero",
  heroRevealTitle: "Mensagem de transição do hero",
  heroRevealAccent: "Destaque da transição do hero",
  heroRevealSupport: "Apoio da transição do hero",
  heroCtaLabel: "Botão principal do hero",
  catalogTitle: "Título do catálogo",
  catalogDescription: "Descrição do catálogo",
  continuationEyebrow: "Chamada do catálogo em profundidade",
  continuationTitle: "Título do catálogo em profundidade",
};

export type StorefrontContentMutation = {
  content: StorefrontContent;
  expectedRevision: number;
};

export type StorefrontContentValidationResult =
  | { ok: true; value: StorefrontContentMutation }
  | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function parseStorefrontContentMutation(
  value: unknown,
): StorefrontContentValidationResult {
  const errors: string[] = [];
  if (!isRecord(value) || !isRecord(value.content)) {
    return { ok: false, errors: ["Conteúdo da vitrine inválido."] };
  }

  const expectedRevision = Number(value.expectedRevision);
  if (!Number.isInteger(expectedRevision) || expectedRevision < 1) {
    errors.push("A revisão atual é obrigatória para salvar com segurança.");
  }

  const content = {} as StorefrontContent;
  for (const key of Object.keys(
    DEFAULT_STOREFRONT_CONTENT,
  ) as StorefrontContentKey[]) {
    const candidate = value.content[key];
    const label = FIELD_LABELS[key];
    const maxLength = FIELD_LIMITS[key];
    if (typeof candidate !== "string" || !candidate.trim()) {
      errors.push(`${label} é obrigatório.`);
      content[key] = DEFAULT_STOREFRONT_CONTENT[key];
      continue;
    }
    const normalized = candidate.trim();
    if (normalized.length > maxLength) {
      errors.push(`${label} deve ter no máximo ${maxLength} caracteres.`);
    }
    content[key] = normalized.slice(0, maxLength);
  }

  return errors.length
    ? { ok: false, errors }
    : { ok: true, value: { content, expectedRevision } };
}
