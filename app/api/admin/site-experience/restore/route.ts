import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { databaseErrorResponse, noStoreJson, rejectCrossOriginMutation } from "@/lib/admin/api";
import { BoundedJsonError, readBoundedJson } from "@/lib/http/read-bounded-json";
import { restoreSiteExperienceRevision } from "@/lib/site-experience/repository";

const MAX_BODY_BYTES = 1024;

export async function POST(request: NextRequest) {
  const rejected = rejectCrossOriginMutation(request);
  if (rejected) return rejected;
  const auth = await requireAdminApi({ requireAal2: true });
  if (auth instanceof Response) return auth;

  let payload: Record<string, unknown>;
  try {
    payload = await readBoundedJson(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof BoundedJsonError) return noStoreJson({ error: error.message }, error.status);
    throw error;
  }
  if (Object.keys(payload).some((key) => !["revision", "expectedDraftRevision", "expectedPublishedRevision"].includes(key))) {
    return noStoreJson({ error: "Dados de restauração inválidos." }, 400);
  }
  const input = {
    revision: Number(payload.revision),
    expectedDraftRevision: Number(payload.expectedDraftRevision),
    expectedPublishedRevision: Number(payload.expectedPublishedRevision),
  };
  if (Object.values(input).some((value) => !Number.isInteger(value) || value < 1)) {
    return noStoreJson({ error: "Dados de restauração inválidos." }, 400);
  }

  const result = await restoreSiteExperienceRevision(auth.supabase, input);
  if (result.error) {
    if (result.error.code === "40001") return noStoreJson({ error: "O rascunho mudou. Recarregue antes de restaurar.", code: "revision-conflict" }, 409);
    return databaseErrorResponse(result.error);
  }
  return noStoreJson({ record: result.data });
}
