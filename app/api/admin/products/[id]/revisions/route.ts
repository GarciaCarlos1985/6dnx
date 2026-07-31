import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { databaseErrorResponse, noStoreJson } from "@/lib/admin/api";
import { listProductRevisions } from "@/lib/catalog/repository";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/admin/products/[id]/revisions">,
) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;
  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return noStoreJson({ error: "Identificador de produto inválido." }, 400);
  }

  const result = await listProductRevisions(auth.supabase, id);
  if (result.error) return databaseErrorResponse(result.error);
  return noStoreJson({ revisions: result.revisions });
}
