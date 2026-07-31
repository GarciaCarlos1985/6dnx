import assert from "node:assert/strict";
import test from "node:test";
import {
  detectImageType,
  readBoundedBody,
  UploadBodyTooLargeError,
} from "../lib/security/image-upload.ts";
import { isTrustedMutationOrigin } from "../lib/security/request-origin.ts";
import { shouldProtectSiteReview } from "../lib/security/review-mode.ts";
import { shouldEnablePaymentTestMode } from "../lib/security/payment-test-mode.ts";
import { protectedCatalogUpdateErrors } from "../lib/catalog/admin-safety.ts";
import type {
  CatalogAdminItem,
  CatalogMutation,
} from "../lib/catalog/types.ts";

test("private review fails closed on Vercel when configuration is absent", () => {
  assert.equal(shouldProtectSiteReview(undefined, true), true);
  assert.equal(shouldProtectSiteReview("unexpected", true), true);
  assert.equal(shouldProtectSiteReview(undefined, false), false);
  assert.equal(shouldProtectSiteReview("false", true), false);
  assert.equal(shouldProtectSiteReview("true", false), true);
});

test("payment laboratory can never be enabled in Vercel Production", () => {
  assert.equal(
    shouldEnablePaymentTestMode({
      NODE_ENV: "production",
      PAYMENT_TEST_MODE: "true",
      VERCEL: "1",
      VERCEL_ENV: "production",
    }),
    false,
  );
  assert.equal(
    shouldEnablePaymentTestMode({
      NODE_ENV: "production",
      PAYMENT_TEST_MODE: "true",
      VERCEL: "1",
      VERCEL_ENV: "preview",
    }),
    true,
  );
});

test("admin mutations require the exact same origin", () => {
  const expected = "https://6dnx.vercel.app";
  assert.equal(isTrustedMutationOrigin(expected, "same-origin", expected), true);
  assert.equal(isTrustedMutationOrigin(expected, null, expected), true);
  assert.equal(isTrustedMutationOrigin(null, null, expected), false);
  assert.equal(
    isTrustedMutationOrigin("https://preview.example", "same-site", expected),
    false,
  );
});

test("image detection checks file signatures instead of trusting MIME", () => {
  assert.equal(
    detectImageType(
      Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ),
    "image/png",
  );
  assert.equal(
    detectImageType(
      Uint8Array.from([
        0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
      ]),
    ),
    "image/webp",
  );
  assert.equal(detectImageType(new TextEncoder().encode("not an image")), null);
});

test("bounded upload reader rejects a stream above the configured limit", async () => {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(Uint8Array.from([1, 2, 3]));
      controller.enqueue(Uint8Array.from([4, 5, 6]));
      controller.close();
    },
  });

  await assert.rejects(
    () => readBoundedBody(body, 5),
    UploadBodyTooLargeError,
  );
});

test("owner-safe catalog updates cannot change structural fields", () => {
  const current: CatalogAdminItem = {
    id: "demo",
    sourceKey: "dayz-private",
    product: {
      slug: "dayz-private",
      title: "DayZ Private",
      category: "DayZ",
      tagline: "Acesso",
      description: "",
      image: "/product.webp",
      status: "available",
      variants: [{ name: "30 dias", priceBRL: 100 }],
      theme: {
        accentColor: "#e3062c",
        textColor: "#f7f3f4",
        surfaceColor: "#0b0708",
      },
    },
    publicationState: "published",
    catalogOrder: 4,
    revision: 2,
    createdAt: "2026-07-31T00:00:00.000Z",
    updatedAt: "2026-07-31T00:00:00.000Z",
    updatedBy: null,
  };

  const safeMutation: CatalogMutation = {
    product: {
      ...current.product,
      title: "DayZ Private atualizado",
      variants: [{ name: "30 dias", priceBRL: 120 }],
    },
    publicationState: current.publicationState,
    catalogOrder: current.catalogOrder,
    expectedRevision: current.revision,
  };

  assert.deepEqual(protectedCatalogUpdateErrors(current, safeMutation), []);

  const unsafeMutation: CatalogMutation = {
    ...safeMutation,
    product: {
      ...safeMutation.product,
      slug: "rota-trocada",
      variants: [],
      theme: {
        accentColor: "#e3062c",
        textColor: "#000000",
        surfaceColor: "#0b0708",
      },
    },
    publicationState: "archived",
    catalogOrder: 999,
  };

  assert.equal(
    protectedCatalogUpdateErrors(current, unsafeMutation).length,
    5,
  );
});
