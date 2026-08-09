import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminCoupon,
  AdminCouponList,
  CouponMutation,
  CouponStatus,
} from "@/lib/coupons/types";

type CouponRow = {
  id: string;
  code: string;
  name: string;
  discount_percent: number;
  minimum_amount_cents: number;
  starts_at: string | null;
  expires_at: string | null;
  status: CouponStatus;
  created_at: string;
  updated_at: string;
};

const COUPON_COLUMNS =
  "id, code, name, discount_percent, minimum_amount_cents, starts_at, expires_at, status, created_at, updated_at";

function mapCoupon(row: CouponRow): AdminCoupon {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    discountPercent: row.discount_percent,
    minimumAmountCents: row.minimum_amount_cents,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
function isSchemaMissing(error: { code?: string; message?: string } | null) {
  return Boolean(
    error &&
      (error.code === "42P01" ||
        error.code === "PGRST205" ||
        error.message?.includes("commerce_coupons")),
  );
}

function mutationColumns(mutation: CouponMutation, userId: string) {
  return {
    code: mutation.code,
    name: mutation.name,
    discount_percent: mutation.discountPercent,
    minimum_amount_cents: mutation.minimumAmountCents,
    starts_at: mutation.startsAt,
    expires_at: mutation.expiresAt,
    status: mutation.status,
    updated_by: userId,
  };
}

export async function listAdminCoupons(
  supabase: SupabaseClient,
): Promise<AdminCouponList> {
  const { data, error } = await supabase
    .from("commerce_coupons")
    .select(COUPON_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      coupons: [],
      state: isSchemaMissing(error) ? "schema-missing" : "unavailable",
      message: error.message,
    };
  }

  return {
    coupons: ((data ?? []) as CouponRow[]).map(mapCoupon),
    state: "ready",
  };
}

export async function createAdminCoupon(
  supabase: SupabaseClient,
  mutation: CouponMutation,
  userId: string,
) {
  const { data, error } = await supabase
    .from("commerce_coupons")
    .insert({
      ...mutationColumns(mutation, userId),
      created_by: userId,
    })
    .select(COUPON_COLUMNS)
    .single();

  return {
    coupon: data ? mapCoupon(data as CouponRow) : null,
    error,
  };
}

export async function updateAdminCoupon(
  supabase: SupabaseClient,
  couponId: string,
  mutation: CouponMutation,
  userId: string,
) {
  let query = supabase
    .from("commerce_coupons")
    .update(mutationColumns(mutation, userId))
    .eq("id", couponId);
  if (mutation.expectedUpdatedAt) {
    query = query.eq("updated_at", mutation.expectedUpdatedAt);
  }

  const { data, error } = await query.select(COUPON_COLUMNS).maybeSingle();
  return {
    coupon: data ? mapCoupon(data as CouponRow) : null,
    conflict: !error && !data,
    error,
  };
}
