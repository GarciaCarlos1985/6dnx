import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import {
  databaseErrorResponse,
  noStoreJson,
  rejectCrossOriginMutation,
} from "@/lib/admin/api";
import { BoundedJsonError, readBoundedJson } from "@/lib/http/read-bounded-json";
import { updateAdminStorefrontContent } from "@/lib/storefront-content/repository";
import { parseStorefrontContentMutation } from "@/lib/storefront-content/validation";

const MAX_BODY_BYTES = 16 * 1024;

export async function PUT(request: NextRequest) {
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

  const parsed = parseStorefrontContentMutation(payload);
  if (!parsed.ok) {
    return noStoreJson(
      { error: "Revise os textos destacados.", errors: parsed.errors },
      400,
    );
  }

  const result = await updateAdminStorefrontContent(
    auth.supabase,
    parsed.value.content,
    parsed.value.expectedRevision,
  );
  if (result.error) return databaseErrorResponse(result.error);
  if (result.conflict) {
    return noStoreJson(
      {
        error:
          "Outra edição foi salva antes desta. Recarregue a página para preservar o texto mais recente.",
        code: "revision-conflict",
      },
      409,
    );
  }
  return noStoreJson({ record: result.record });
}
