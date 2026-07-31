import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import {
  databaseErrorResponse,
  noStoreJson,
  rejectCrossOriginMutation,
} from "@/lib/admin/api";
import {
  listProductRevisions,
  restoreProductRevision,
} from "@/lib/catalog/repository";
import { BoundedJsonError, readBoundedJson } from "@/lib/http/read-bounded-json";

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

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/admin/products/[id]/revisions">,
) {
  const rejected = rejectCrossOriginMutation(request);
  if (rejected) return rejected;

  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;
  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return noStoreJson({ error: "Identificador de produto inválido." }, 400);
  }

  let payload: { revisionId?: unknown; expectedRevision?: unknown };
  try {
    payload = await readBoundedJson(request, 2_048);
  } catch (error) {
    if (error instanceof BoundedJsonError) {
      return noStoreJson({ error: error.message }, error.status);
    }
    throw error;
  }

  const revisionId = Number(payload.revisionId);
  const expectedRevision = Number(payload.expectedRevision);
  if (
    !Number.isInteger(revisionId) ||
    revisionId < 1 ||
    !Number.isInteger(expectedRevision) ||
    expectedRevision < 1
  ) {
    return noStoreJson({ error: "Revisão inválida." }, 400);
  }

  const result = await restoreProductRevision(
    auth.supabase,
    id,
    revisionId,
    expectedRevision,
  );
  if (result.error) return databaseErrorResponse(result.error);
  if (result.conflict) {
    return noStoreJson(
      { error: "O produto mudou. Recarregue antes de restaurar." },
      409,
    );
  }
  return noStoreJson({ item: result.item });
}
