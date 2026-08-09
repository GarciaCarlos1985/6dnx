export const COUPON_STATUSES = [
  "draft",
  "active",
  "paused",
  "archived",
] as const;

export type CouponStatus = (typeof COUPON_STATUSES)[number];

export type AdminCoupon = {
  id: string;
  code: string;
  name: string;
  discountPercent: number;
  minimumAmountCents: number;
  startsAt: string | null;
  expiresAt: string | null;
  status: CouponStatus;
  createdAt: string;
  updatedAt: string;
};

export type AdminCouponList = {
  coupons: AdminCoupon[];
  state: "ready" | "schema-missing" | "unavailable";
  message?: string;
};

export type CouponMutation = {
  code: string;
  name: string;
  discountPercent: number;
  minimumAmountCents: number;
  startsAt: string | null;
  expiresAt: string | null;
  status: CouponStatus;
  expectedUpdatedAt: string | null;
};

export type CouponQuote = {
  code: string;
  name: string;
  discountPercent: number;
  originalAmountCents: number;
  discountAmountCents: number;
  finalAmountCents: number;
};
