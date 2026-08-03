import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import {
  databaseErrorResponse,
  noStoreJson,
  rejectCrossOriginMutation,
} from "@/lib/admin/api";
import {
  getAdminProduct,
  updateAdminProduct,
} from "@/lib/catalog/repository";
import { protectedCatalogUpdateErrors } from "@/lib/catalog/admin-safety";
import { isAllowedProductImage, parseCatalogMutation } from "@/lib/catalog/validation";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";
import { BoundedJsonError, readBoundedJson } from "@/lib/http/read-bounded-json";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 96 * 1024;

export async function PUT(
  request: NextRequest,
  context: RouteContext<"/api/admin/products/[id]">,
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

  const parsed = parseCatalogMutation(payload);
  if (!parsed.ok) {
    return noStoreJson(
      { error: "Revise os campos destacados.", errors: parsed.errors },
      400,
    );
  }
  if (!parsed.value.expectedRevision) {
    return noStoreJson(
      { error: "A revisão atual é obrigatória para salvar com segurança." },
      400,
    );
  }
  if (
    !isAllowedProductImage(
      parsed.value.product.image,
      getPublicSupabaseConfig()?.url,
    )
  ) {
    return noStoreJson(
      { error: "Use uma imagem do site ou enviada pelo próprio painel." },
      400,
    );
  }
  if (
    parsed.value.product.checkoutBanner &&
    !isAllowedProductImage(
      parsed.value.product.checkoutBanner,
      getPublicSupabaseConfig()?.url,
    )
  ) {
    return noStoreJson(
      { error: "Use um banner do site ou enviado pelo próprio painel." },
      400,
    );
  }

  const current = await getAdminProduct(auth.supabase, id);
  if (current.error) return databaseErrorResponse(current.error);
  if (!current.item) {
    return noStoreJson({ error: "Produto não encontrado." }, 404);
  }

  const protectedErrors = protectedCatalogUpdateErrors(
    current.item,
    parsed.value,
  );
  if (protectedErrors.length) {
    return noStoreJson(
      {
        error:
          "Esta ação não faz parte do modo seguro do painel.",
        errors: protectedErrors,
      },
      400,
    );
  }

  const result = await updateAdminProduct(auth.supabase, id, parsed.value);
  if (result.error) return databaseErrorResponse(result.error);
  if (result.conflict) {
    return noStoreJson(
      {
        error:
          "Outra edição foi salva antes desta. Recarregue o produto para não apagar o trabalho mais recente.",
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
