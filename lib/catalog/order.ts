const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const MAX_REORDERED_PRODUCTS = 500;

export type CatalogOrderPayloadResult =
  | { ok: true; orderedIds: string[] }
  | { ok: false; error: string };

export function parseCatalogOrderPayload(
  value: unknown,
): CatalogOrderPayloadResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "A nova ordem não foi reconhecida." };
  }

  const orderedIds = (value as Record<string, unknown>).orderedIds;
  if (!Array.isArray(orderedIds) || orderedIds.length < 1) {
    return { ok: false, error: "A ordem precisa conter os cards publicados." };
  }
  if (orderedIds.length > MAX_REORDERED_PRODUCTS) {
    return {
      ok: false,
      error: `A ordem excede o limite de ${MAX_REORDERED_PRODUCTS} cards.`,
    };
  }
  if (
    orderedIds.some(
      (id) => typeof id !== "string" || !UUID_PATTERN.test(id),
    )
  ) {
    return { ok: false, error: "A ordem contém um card inválido." };
  }

  const ids = orderedIds as string[];
  if (new Set(ids).size !== ids.length) {
    return { ok: false, error: "A ordem contém cards repetidos." };
  }

  return { ok: true, orderedIds: ids };
}
