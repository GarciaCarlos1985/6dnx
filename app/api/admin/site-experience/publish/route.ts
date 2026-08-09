import type { NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdminApi } from "@/lib/admin/auth";
import { databaseErrorResponse, noStoreJson, rejectCrossOriginMutation } from "@/lib/admin/api";
import { BoundedJsonError, readBoundedJson } from "@/lib/http/read-bounded-json";
import { publishSiteExperience, SITE_EXPERIENCE_CACHE_TAG } from "@/lib/site-experience/repository";

const MAX_BODY_BYTES = 1024;

function parseRevisions(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !["expectedDraftRevision", "expectedPublishedRevision"].includes(key))) return null;
  const expectedDraftRevision = Number(input.expectedDraftRevision);
  const expectedPublishedRevision = Number(input.expectedPublishedRevision);
  return Number.isInteger(expectedDraftRevision) && expectedDraftRevision > 0 &&
    Number.isInteger(expectedPublishedRevision) && expectedPublishedRevision > 0
    ? { expectedDraftRevision, expectedPublishedRevision }
    : null;
}

export async function POST(request: NextRequest) {
  const rejected = rejectCrossOriginMutation(request);
  if (rejected) return rejected;

  const auth = await requireAdminApi({ requireAal2: true });
  if (auth instanceof Response) return auth;

  let payload: unknown;
  try {
    payload = await readBoundedJson(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof BoundedJsonError) return noStoreJson({ error: error.message }, error.status);
    throw error;
  }
  const revisions = parseRevisions(payload);
  if (!revisions) return noStoreJson({ error: "Revisões inválidas." }, 400);

  const result = await publishSiteExperience(auth.supabase, revisions);
  if (result.error) {
    if (result.error.code === "40001") {
      return noStoreJson({ error: "O conteúdo mudou em outra sessão. Recarregue antes de publicar.", code: "revision-conflict" }, 409);
    }
    return databaseErrorResponse(result.error);
  }

  revalidateTag(SITE_EXPERIENCE_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/conta");
  revalidatePath("/slot");
  return noStoreJson({ record: result.data });
}
