import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import {
  databaseErrorResponse,
  noStoreJson,
  rejectCrossOriginMutation,
} from "@/lib/admin/api";
import {
  createAdminCoupon,
  listAdminCoupons,
} from "@/lib/coupons/admin-repository";
import { parseCouponMutation } from "@/lib/coupons/validation";
import { BoundedJsonError, readBoundedJson } from "@/lib/http/read-bounded-json";

const MAX_BODY_BYTES = 8 * 1024;

export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;
  return noStoreJson(await listAdminCoupons(auth.supabase));
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
  const parsed = parseCouponMutation(payload);
  if (!parsed.ok) {
    return noStoreJson(
      { error: "Revise os dados do cupom.", errors: parsed.errors },
      400,
    );
  }
  const result = await createAdminCoupon(
    auth.supabase,
    parsed.value,
    auth.user.id,
  );
  if (result.error) return databaseErrorResponse(result.error);
  return noStoreJson({ coupon: result.coupon }, 201);
}
