import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import {
  databaseErrorResponse,
  noStoreJson,
  rejectCrossOriginMutation,
} from "@/lib/admin/api";
import { parseCatalogOrderPayload } from "@/lib/catalog/order";
import { reorderPublishedCatalog } from "@/lib/catalog/repository";
import { BoundedJsonError, readBoundedJson } from "@/lib/http/read-bounded-json";

const MAX_BODY_BYTES = 40 * 1024;

export async function POST(request: NextRequest) {
  const rejected = rejectCrossOriginMutation(request);
  if (rejected) return rejected;

  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await readBoundedJson(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof BoundedJsonError) {
      return noStoreJson({ error: error.message }, error.status);
    }
    throw error;
  }

  const payload = parseCatalogOrderPayload(body);
  if (!payload.ok) return noStoreJson({ error: payload.error }, 400);

  const result = await reorderPublishedCatalog(
    auth.supabase,
    payload.orderedIds,
  );
  if (result.error) return databaseErrorResponse(result.error);
  return noStoreJson({ items: result.items });
}
