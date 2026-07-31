import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import {
  databaseErrorResponse,
  noStoreJson,
  rejectCrossOriginMutation,
} from "@/lib/admin/api";
import { bootstrapAdminCatalog } from "@/lib/catalog/repository";

export async function POST(request: NextRequest) {
  const rejected = rejectCrossOriginMutation(request);
  if (rejected) return rejected;

  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;
  const result = await bootstrapAdminCatalog(auth.supabase);
  if (result.error) return databaseErrorResponse(result.error);
  return noStoreJson({ items: result.items }, 201);
}
