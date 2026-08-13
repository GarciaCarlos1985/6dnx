const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const MAX_REORDERED_PRODUCTS = 500;

export function parseCatalogDestination(
  value: string,
  totalItems: number,
) {
  if (!value.trim() || totalItems < 1) return null;
  const requestedPosition = Number(value);
  if (
    !Number.isInteger(requestedPosition) ||
    requestedPosition < 1 ||
    requestedPosition > totalItems
  ) {
    return null;
  }

  return requestedPosition - 1;
}

export function moveCatalogItem(
  orderedIds: readonly string[],
  sourceId: string,
  destinationIndex: number,
) {
  const sourceIndex = orderedIds.indexOf(sourceId);
  if (
    sourceIndex < 0 ||
    !Number.isInteger(destinationIndex) ||
    destinationIndex < 0 ||
    destinationIndex >= orderedIds.length ||
    sourceIndex === destinationIndex
  ) {
    return [...orderedIds];
  }

  const next = [...orderedIds];
  const [source] = next.splice(sourceIndex, 1);
  next.splice(destinationIndex, 0, source);
  return next;
}

export function swapCatalogItems(
  orderedIds: readonly string[],
  firstId: string,
  secondId: string,
) {
  const firstIndex = orderedIds.indexOf(firstId);
  const secondIndex = orderedIds.indexOf(secondId);
  if (
    firstIndex < 0 ||
    secondIndex < 0 ||
    firstIndex === secondIndex
  ) {
    return [...orderedIds];
  }

  const next = [...orderedIds];
  [next[firstIndex], next[secondIndex]] = [
    next[secondIndex],
    next[firstIndex],
  ];
  return next;
}

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
