import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { databaseErrorResponse, noStoreJson, rejectCrossOriginMutation } from "@/lib/admin/api";
import { BoundedJsonError, readBoundedJson } from "@/lib/http/read-bounded-json";
import { saveSiteExperienceDraft } from "@/lib/site-experience/repository";
import { parseSiteExperienceMutation } from "@/lib/site-experience/validation";

const MAX_BODY_BYTES = 64 * 1024;

export async function PUT(request: NextRequest) {
  const rejected = rejectCrossOriginMutation(request);
  if (rejected) return rejected;

  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  let payload: unknown;
  try {
    payload = await readBoundedJson(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof BoundedJsonError) return noStoreJson({ error: error.message }, error.status);
    throw error;
  }

  const parsed = parseSiteExperienceMutation(payload);
  if (!parsed.ok) {
    return noStoreJson({ error: "Revise os campos destacados.", errors: parsed.errors }, 400);
  }

  const result = await saveSiteExperienceDraft(auth.supabase, parsed.value);
  if (result.error) {
    if (result.error.code === "40001") {
      return noStoreJson({ error: "O rascunho mudou em outra sessão. Recarregue antes de salvar.", code: "revision-conflict" }, 409);
    }
    return databaseErrorResponse(result.error);
  }
  return noStoreJson({ record: result.data });
}
