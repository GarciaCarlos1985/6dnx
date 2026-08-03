import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import {
  databaseErrorResponse,
  noStoreJson,
  rejectCrossOriginMutation,
} from "@/lib/admin/api";
import { ensureRustCatalogClones } from "@/lib/catalog/repository";
import { BoundedJsonError, readBoundedJson } from "@/lib/http/read-bounded-json";
import { RUST_CLONE_COUNT } from "@/lib/products";

const MAX_BODY_BYTES = 2 * 1024;

function parseRequestedCount(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const count = Number((value as Record<string, unknown>).count);
  return Number.isInteger(count) && count >= 1 && count <= RUST_CLONE_COUNT
    ? count
    : null;
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
  const requestedCount = parseRequestedCount(payload);
  if (requestedCount === null) {
    return noStoreJson(
      { error: `Escolha entre 1 e ${RUST_CLONE_COUNT} cards por vez.` },
      400,
    );
  }

  const result = await ensureRustCatalogClones(
    auth.supabase,
    requestedCount,
  );
  if (result.error) {
    if (result.error.code === "RUST_SOURCE_MISSING") {
      return noStoreJson({ error: result.error.message }, 409);
    }
    return databaseErrorResponse(result.error);
  }

  return noStoreJson(
    { items: result.items, createdCount: result.createdCount },
    result.createdCount > 0 ? 201 : 200,
  );
}
