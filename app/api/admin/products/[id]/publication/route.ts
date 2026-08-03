import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import {
  databaseErrorResponse,
  noStoreJson,
  rejectCrossOriginMutation,
} from "@/lib/admin/api";
import {
  getAdminProduct,
  listAdminCatalog,
  listProductRevisions,
  updateAdminProduct,
} from "@/lib/catalog/repository";
import { BoundedJsonError, readBoundedJson } from "@/lib/http/read-bounded-json";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 2 * 1024;

type PublicationAction = "archive" | "restore";

function parsePayload(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const payload = value as Record<string, unknown>;
  const action = payload.action;
  const expectedRevision = Number(payload.expectedRevision);

  if (
    (action !== "archive" && action !== "restore") ||
    !Number.isInteger(expectedRevision) ||
    expectedRevision < 1
  ) {
    return null;
  }

  return { action: action as PublicationAction, expectedRevision };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const rejected = rejectCrossOriginMutation(request);
  if (rejected) return rejected;

  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return noStoreJson({ error: "Identificador de produto inválido." }, 400);
  }

  let payload: unknown;
  try {
    payload = await readBoundedJson(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof BoundedJsonError) {
      return noStoreJson({ error: error.message }, error.status);
    }
    throw error;
  }
  const parsed = parsePayload(payload);
  if (!parsed) {
    return noStoreJson({ error: "Ação de publicação inválida." }, 400);
  }

  const current = await getAdminProduct(auth.supabase, id);
  if (current.error) return databaseErrorResponse(current.error);
  if (!current.item) {
    return noStoreJson({ error: "Produto não encontrado." }, 404);
  }
  if (current.item.revision !== parsed.expectedRevision) {
    return noStoreJson(
      {
        error:
          "Outra alteração foi salva antes desta. Recarregue o produto e tente novamente.",
        code: "revision-conflict",
      },
      409,
    );
  }

  if (
    (parsed.action === "archive" &&
      current.item.publicationState === "archived") ||
    (parsed.action === "restore" &&
      current.item.publicationState !== "archived")
  ) {
    return noStoreJson({ item: current.item });
  }

  let nextState: "draft" | "published" | "archived" = "archived";
  let nextCatalogOrder = current.item.catalogOrder;
  if (parsed.action === "restore") {
    const history = await listProductRevisions(auth.supabase, id);
    if (history.error) return databaseErrorResponse(history.error);
    nextState =
      history.revisions.find(
        (revision) => revision.snapshot.publicationState !== "archived",
      )?.snapshot.publicationState ?? "published";

    // A card restored to the public catalog returns at the end. This avoids
    // ambiguous duplicate positions if the owner reordered the storefront
    // while the card was archived. It can then be placed precisely using the
    // dedicated ordering board.
    if (nextState === "published") {
      const catalog = await listAdminCatalog(auth.supabase);
      if (catalog.state !== "ready") {
        return databaseErrorResponse({
          code: "CATALOG_UNAVAILABLE",
          message: catalog.message,
        });
      }
      nextCatalogOrder =
        catalog.items.reduce(
          (highest, item) =>
            item.publicationState === "published"
              ? Math.max(highest, item.catalogOrder)
              : highest,
          -1,
        ) + 1;
    }
  }

  const result = await updateAdminProduct(auth.supabase, id, {
    product: current.item.product,
    publicationState: nextState,
    catalogOrder: nextCatalogOrder,
    expectedRevision: current.item.revision,
    changeNote:
      parsed.action === "archive"
        ? "Card arquivado pelo painel administrativo"
        : `Card restaurado como ${nextState === "published" ? "publicado" : "rascunho"}`,
  });
  if (result.error) return databaseErrorResponse(result.error);
  if (result.conflict) {
    return noStoreJson(
      {
        error:
          "Outra alteração foi salva antes desta. Recarregue o produto e tente novamente.",
        code: "revision-conflict",
      },
      409,
    );
  }
  if (!result.item) {
    return noStoreJson({ error: "Produto não encontrado." }, 404);
  }

  return noStoreJson({ item: result.item });
}
