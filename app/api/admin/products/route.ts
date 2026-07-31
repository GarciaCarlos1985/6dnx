import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import {
  databaseErrorResponse,
  noStoreJson,
  rejectCrossOriginMutation,
} from "@/lib/admin/api";
import {
  insertAdminProduct,
  listAdminCatalog,
} from "@/lib/catalog/repository";
import { parseCatalogMutation, isAllowedProductImage } from "@/lib/catalog/validation";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";
import { BoundedJsonError, readBoundedJson } from "@/lib/http/read-bounded-json";

const MAX_BODY_BYTES = 96 * 1024;

export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const catalog = await listAdminCatalog(auth.supabase);
  return noStoreJson(catalog, catalog.state === "unavailable" ? 503 : 200);
}

export async function POST(request: NextRequest) {
  const rejected = rejectCrossOriginMutation(request);
  if (rejected) return rejected;

  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

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

  const sourceKey = `custom-${randomUUID()}`;
  const result = await insertAdminProduct(
    auth.supabase,
    sourceKey,
    parsed.value,
  );
  if (result.error) return databaseErrorResponse(result.error);
  if (!result.item) {
    return noStoreJson({ error: "O produto não pôde ser criado." }, 500);
  }
  return noStoreJson({ item: result.item }, 201);
}
