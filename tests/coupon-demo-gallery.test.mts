import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  normalizeCouponCode,
  parseCouponMutation,
} from "../lib/coupons/validation.ts";

const read = (path: string) =>
  readFile(new URL(path, import.meta.url), "utf8");

test("coupon codes are normalized and bounded before reaching the database", () => {
  assert.equal(normalizeCouponCode("  bem vindo-10 "), "BEMVINDO-10");
  assert.deepEqual(
    parseCouponMutation({
      code: "BEMVINDO10",
      name: "Campanha de boas-vindas",
      discountPercent: 10,
      minimumAmountCents: 2_000,
      startsAt: "2026-08-09T12:00:00.000Z",
      expiresAt: "2026-08-31T23:59:59.000Z",
      status: "active",
      expectedUpdatedAt: null,
    }),
    {
      ok: true,
      value: {
        code: "BEMVINDO10",
        name: "Campanha de boas-vindas",
        discountPercent: 10,
        minimumAmountCents: 2_000,
        startsAt: "2026-08-09T12:00:00.000Z",
        expiresAt: "2026-08-31T23:59:59.000Z",
        status: "active",
        expectedUpdatedAt: null,
      },
    },
  );

  const invalid = parseCouponMutation({
    code: "X",
    name: "a",
    discountPercent: 100,
    minimumAmountCents: -1,
    startsAt: "2026-09-01T00:00:00.000Z",
    expiresAt: "2026-08-01T00:00:00.000Z",
    status: "active",
  });
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.ok(invalid.errors.length >= 5);
});

test("coupon SQL derives every price from the approved offer and records an immutable snapshot", async () => {
  const migration = await read(
    "../supabase/migrations/20260809180000_add_commerce_coupons.sql",
  );

  assert.doesNotMatch(migration, /p_amount(?:_cents)?\b/i);
  assert.match(migration, /where id = p_offer_id and status = 'approved'/i);
  assert.match(migration, /v_offer\.amount_cents \* v_coupon\.discount_percent/i);
  assert.match(migration, /insert into public\.commerce_order_discounts/i);
  assert.match(migration, /pg_advisory_xact_lock/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /Admins manage commerce coupons/i);
  assert.match(migration, /revoke all on function public\.quote_commerce_coupon/i);
});

test("checkout accepts only an optional coupon code and never a client amount", async () => {
  const checkoutRoute = await read("../app/api/checkout/route.ts");
  const quoteRoute = await read("../app/api/checkout/coupon/route.ts");
  const service = await read("../lib/checkout/commerce-service.ts");

  assert.match(checkoutRoute, /couponCode\?: unknown/);
  assert.doesNotMatch(checkoutRoute, /amountCents\?: unknown/);
  assert.match(quoteRoute, /isTrustedMutationOrigin/);
  assert.match(quoteRoute, /MAX_BODY_BYTES = 1_024/);
  assert.match(service, /repository\.findApprovedOffer/);
  assert.match(service, /repository\.insertDiscountedOrder/);
  assert.match(service, /pricingPayload\(order, discount\)/);
});

test("coupon administration is authenticated, origin-protected and preserves history", async () => {
  const collectionRoute = await read("../app/api/admin/coupons/route.ts");
  const itemRoute = await read("../app/api/admin/coupons/[id]/route.ts");
  const manager = await read("../components/admin/coupon-manager.tsx");

  assert.match(collectionRoute, /requireAdminApi/);
  assert.match(collectionRoute, /rejectCrossOriginMutation/);
  assert.match(itemRoute, /expectedUpdatedAt/);
  assert.match(itemRoute, /coupon-conflict/);
  assert.match(manager, /save\("archived"\)/);
  assert.match(manager, /minimumAmountCents/);
  assert.match(manager, /expiresAt/);
});

test("demo gallery migration is additive and capped at five images", async () => {
  const migration = await read(
    "../supabase/migrations/20260809183000_add_product_demo_gallery.sql",
  );

  assert.match(migration, /add column if not exists demo_images/);
  assert.match(migration, /default '\[\]'::jsonb/);
  assert.match(migration, /jsonb_array_length\(demo_images\) <= 5/);
  assert.doesNotMatch(migration, /update public\.product_catalog/i);
  assert.doesNotMatch(migration, /delete from/i);
});

test("admin and public gallery implement five-image upload, autoplay and infinite manual navigation", async () => {
  const dashboard = await read("../components/admin/admin-dashboard.tsx");
  const showcase = await read("../components/product-showcase.tsx");
  const validation = await read("../lib/catalog/validation.ts");

  assert.match(dashboard, /MAX_PRODUCT_DEMO_IMAGES/);
  assert.match(dashboard, /x-asset-slot": "demo-gallery"/);
  assert.match(dashboard, /multiple\s+type="file"/);
  assert.match(dashboard, /moveDemoImage/);
  assert.match(dashboard, /removeDemoImage/);
  assert.match(validation, /value\.slice\(0, MAX_PRODUCT_DEMO_IMAGES\)/);
  assert.match(showcase, /window\.setInterval\(\(\) => move\(1\), 4_500\)/);
  assert.match(
    showcase,
    /\(current \+ direction \+ demoImages\.length\) % demoImages\.length/,
  );
  assert.match(showcase, /prefers-reduced-motion: reduce/);
  assert.match(showcase, /Demonstração em preparação/);
});
