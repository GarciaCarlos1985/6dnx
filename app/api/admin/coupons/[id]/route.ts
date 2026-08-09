import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import {
  databaseErrorResponse,
  noStoreJson,
  rejectCrossOriginMutation,
} from "@/lib/admin/api";
import { updateAdminCoupon } from "@/lib/coupons/admin-repository";
import { parseCouponMutation } from "@/lib/coupons/validation";
import { BoundedJsonError, readBoundedJson } from "@/lib/http/read-bounded-json";

const MAX_BODY_BYTES = 8 * 1024;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/admin/coupons/[id]">,
) {
  const rejected = rejectCrossOriginMutation(request);
  if (rejected) return rejected;
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;
  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return noStoreJson({ error: "Identificador de cupom inválido." }, 400);
  }

  let payload: unknown;
  try {
    payload = await readBoundedJson(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof BoundedJsonError) {
      return noStoreJson({ error: error.message }, error.status);
    }
    throw error;
  }
  const parsed = parseCouponMutation(payload);
  if (!parsed.ok) {
    return noStoreJson(
      { error: "Revise os dados do cupom.", errors: parsed.errors },
      400,
    );
  }
  if (!parsed.value.expectedUpdatedAt) {
    return noStoreJson(
      { error: "Recarregue o cupom antes de salvar novamente." },
      400,
    );
  }
  const result = await updateAdminCoupon(
    auth.supabase,
    id,
    parsed.value,
    auth.user.id,
  );
  if (result.error) return databaseErrorResponse(result.error);
  if (result.conflict) {
    return noStoreJson(
      {
        error:
          "Outro administrador alterou este cupom. Recarregue a página para preservar a versão mais recente.",
        code: "coupon-conflict",
      },
      409,
    );
  }
  return noStoreJson({ coupon: result.coupon });
}
