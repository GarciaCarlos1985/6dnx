import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import {
  noStoreJson,
  rejectCrossOriginMutation,
} from "@/lib/admin/api";
import {
  adjustAdminRewardBalance,
  listAdminRewardUsers,
} from "@/lib/rewards/admin-repository";
import { parseRewardAdjustment } from "@/lib/rewards/validation";
import { BoundedJsonError, readBoundedJson } from "@/lib/http/read-bounded-json";

const MAX_BODY_BYTES = 8 * 1024;

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi({ requireAal2: true });
  if (auth instanceof Response) return auth;
  const query = request.nextUrl.searchParams.get("q")?.slice(0, 80) ?? "";
  return noStoreJson(await listAdminRewardUsers(auth.supabase, query));
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
    if (error instanceof BoundedJsonError) {
      return noStoreJson({ error: error.message }, error.status);
    }
    throw error;
  }

  const parsed = parseRewardAdjustment(payload);
  if (!parsed.ok) {
    return noStoreJson(
      { error: "Revise os dados do ajuste.", errors: parsed.errors },
      400,
    );
  }

  const result = await adjustAdminRewardBalance(auth.supabase, parsed.value);
  if (result.error) {
    const insufficient =
      result.error.code === "23514" ||
      result.error.message?.includes("insufficient balance");
    const invalid = result.error.code === "22023";
    return noStoreJson(
      {
        error: result.schemaMissing
          ? "O banco de recompensas ainda não foi preparado."
          : insufficient
            ? "O saldo não é suficiente para concluir esta retirada."
            : invalid
              ? "O Supabase recusou os dados deste ajuste."
              : "Não foi possível registrar o ajuste. Nenhum saldo foi alterado.",
        code: result.schemaMissing
          ? "schema-missing"
          : insufficient
            ? "insufficient-balance"
            : invalid
              ? "invalid-adjustment"
              : "database-error",
      },
      result.schemaMissing ? 503 : insufficient || invalid ? 422 : 503,
    );
  }

  return noStoreJson({ adjustment: result.result });
}
