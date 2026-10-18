import { requireAdminApi } from "@/lib/admin/auth";
import type { NextRequest } from "next/server";
import {
  databaseErrorResponse,
  noStoreJson,
  rejectCrossOriginMutation,
} from "@/lib/admin/api";
import { createAdminProduct, listAdminCatalog } from "@/lib/catalog/repository";
import { parseCreateProduct } from "@/lib/catalog/creation";
import {
  BoundedJsonError,
  readBoundedJson,
} from "@/lib/http/read-bounded-json";

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
  let body: unknown;
  try {
    body = await readBoundedJson(request, 4 * 1024);
  } catch (error) {
    if (error instanceof BoundedJsonError)
      return noStoreJson({ error: error.message }, error.status);
    throw error;
  }
  const parsed = parseCreateProduct(body);
  if (!parsed.ok)
    return noStoreJson(
      { error: "Revise o cadastro.", errors: parsed.errors },
      400,
    );
  const result = await createAdminProduct(auth.supabase, parsed.value);
  if (result.error) {
    if (result.error.code?.startsWith("CREATE_"))
      return noStoreJson(
        { error: result.error.message },
        result.error.code === "CREATE_SOURCE_MISSING" ? 404 : 409,
      );
    return databaseErrorResponse(result.error);
  }
  return noStoreJson({ item: result.item }, result.created ? 201 : 200);
}
