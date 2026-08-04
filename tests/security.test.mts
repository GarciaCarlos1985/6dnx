import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  detectImageType,
  readBoundedBody,
  UploadBodyTooLargeError,
} from "../lib/security/image-upload.ts";
import { isTrustedMutationOrigin } from "../lib/security/request-origin.ts";
import { shouldProtectSiteReview } from "../lib/security/review-mode.ts";
import { shouldEnablePaymentTestMode } from "../lib/security/payment-test-mode.ts";
import { resolvePublicHttpsLink } from "../lib/security/public-link.ts";
import { isSocialPreviewImagePath } from "../lib/security/social-preview.ts";
import { protectedCatalogUpdateErrors } from "../lib/catalog/admin-safety.ts";
import {
  buildRustCloneProducts,
  isRustCloneCatalogKey,
  products,
  RUST_CLONE_COUNT,
  RUST_SOURCE_CATALOG_KEY,
  selectMissingRustCloneProducts,
} from "../lib/products.ts";
import {
  buildProductCatalogLayout,
  CATALOG_CARDS_PER_ROW,
  CATALOG_INITIAL_VISIBLE_COUNT,
  CATALOG_VISIBLE_ROWS,
} from "../lib/product-catalog-layout.ts";
import {
  moveCatalogItem,
  parseCatalogOrderPayload,
  swapCatalogItems,
} from "../lib/catalog/order.ts";
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

test("public footer links reject webhook credentials and non-HTTPS destinations", () => {
  assert.equal(resolvePublicHttpsLink(""), null);
  assert.equal(resolvePublicHttpsLink("http://example.com/profile"), null);
  assert.equal(
    resolvePublicHttpsLink(
      "https://discord.com/api/webhooks/123456789/secret-token",
    ),
    null,
  );
  assert.equal(
    resolvePublicHttpsLink(
      "https://discord.com/api/v10/webhooks/123456789/secret-token",
    ),
    null,
  );
  assert.equal(
    resolvePublicHttpsLink("https://example.com/developer-bicho"),
    "https://example.com/developer-bicho",
  );
});

test("only root social preview images bypass image indexing restrictions", () => {
  assert.equal(isSocialPreviewImagePath("/opengraph-image.jpg"), true);
  assert.equal(isSocialPreviewImagePath("/opengraph-image.png"), true);
  assert.equal(isSocialPreviewImagePath("/twitter-image.jpeg"), true);
  assert.equal(isSocialPreviewImagePath("/admin/opengraph-image.jpg"), false);
  assert.equal(isSocialPreviewImagePath("/api/opengraph-image.jpg"), false);
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

test("Rust expansion creates exactly twenty complete and independent cards", () => {
  const source = products.find(
    (product) =>
      (product.catalogKey ?? product.slug) === RUST_SOURCE_CATALOG_KEY,
  );
  assert.ok(source);

  const clones = products.filter((product) =>
    isRustCloneCatalogKey(product.catalogKey ?? product.slug),
  );
  assert.equal(clones.length, RUST_CLONE_COUNT);
  assert.deepEqual(
    clones.map((product) => product.title),
    Array.from({ length: RUST_CLONE_COUNT }, (_, index) => `Rust${index + 1}`),
  );
  assert.equal(new Set(clones.map((product) => product.slug)).size, 20);

  const rebuilt = buildRustCloneProducts(source);
  const withoutIdentity = (product: (typeof products)[number]) => {
    const content = structuredClone(product) as unknown as Record<
      string,
      unknown
    >;
    Reflect.deleteProperty(content, "slug");
    Reflect.deleteProperty(content, "catalogKey");
    Reflect.deleteProperty(content, "title");
    return content;
  };
  rebuilt.forEach((clone) => {
    assert.deepEqual(withoutIdentity(clone), withoutIdentity(source));
    assert.notEqual(clone.variants, source.variants);
    assert.notEqual(clone.features, source.features);
  });
});

test("Rust creation defaults to one next missing card and honors an explicit limit", () => {
  const source = products.find(
    (product) =>
      (product.catalogKey ?? product.slug) === RUST_SOURCE_CATALOG_KEY,
  );
  assert.ok(source);

  const existing = new Set([
    RUST_SOURCE_CATALOG_KEY,
    "rust-1-6dnx-software",
    "rust-3-6dnx-software",
  ]);
  assert.deepEqual(
    selectMissingRustCloneProducts(source, existing).map(
      (product) => product.title,
    ),
    ["Rust2"],
  );
  assert.deepEqual(
    selectMissingRustCloneProducts(source, existing, 3).map(
      (product) => product.title,
    ),
    ["Rust2", "Rust4", "Rust5"],
  );
  assert.throws(
    () => selectMissingRustCloneProducts(source, existing, 0),
    RangeError,
  );
});

test("the catalog exposes twelve unique cards across four independent rows", () => {
  const layout = buildProductCatalogLayout(products);
  assert.equal(layout.rows.length, CATALOG_VISIBLE_ROWS);
  assert.ok(
    layout.rows.every((row) =>
      row.every((page) => page.length <= CATALOG_CARDS_PER_ROW),
    ),
  );

  const initialCards = layout.rows.flatMap((row) => row[0] ?? []);
  assert.equal(initialCards.length, CATALOG_INITIAL_VISIBLE_COUNT);
  assert.deepEqual(
    initialCards.map((product) => product.slug),
    products
      .slice(0, CATALOG_INITIAL_VISIBLE_COUNT)
      .map((product) => product.slug),
  );

  const allCards = layout.rows
    .flatMap((row) => row)
    .flatMap((page) => page);
  assert.equal(allCards.length, products.length);
  assert.equal(new Set(allCards.map((product) => product.slug)).size, products.length);
});

test("catalog ordering accepts only one complete-looking list of unique UUIDs", () => {
  const first = "11111111-1111-4111-8111-111111111111";
  const second = "22222222-2222-4222-8222-222222222222";

  assert.deepEqual(parseCatalogOrderPayload({ orderedIds: [first, second] }), {
    ok: true,
    orderedIds: [first, second],
  });
  assert.equal(
    parseCatalogOrderPayload({ orderedIds: [first, first] }).ok,
    false,
  );
  assert.equal(parseCatalogOrderPayload({ orderedIds: ["not-a-uuid"] }).ok, false);
  assert.equal(parseCatalogOrderPayload({ orderedIds: [] }).ok, false);
});

test("catalog quick move can send one distant card directly to any position", () => {
  const original = ["a", "b", "c", "d", "e"];

  assert.deepEqual(moveCatalogItem(original, "e", 0), ["e", "a", "b", "c", "d"]);
  assert.deepEqual(moveCatalogItem(original, "a", 4), ["b", "c", "d", "e", "a"]);
  assert.deepEqual(moveCatalogItem(original, "d", 1), ["a", "d", "b", "c", "e"]);
  assert.deepEqual(moveCatalogItem(original, "missing", 1), original);
  assert.deepEqual(moveCatalogItem(original, "c", 99), original);
  assert.deepEqual(original, ["a", "b", "c", "d", "e"]);
});

test("catalog board swaps exactly two selected cards without mutating input", () => {
  const original = ["a", "b", "c", "d", "e"];

  assert.deepEqual(swapCatalogItems(original, "b", "e"), [
    "a",
    "e",
    "c",
    "d",
    "b",
  ]);
  assert.deepEqual(swapCatalogItems(original, "a", "a"), original);
  assert.deepEqual(swapCatalogItems(original, "missing", "c"), original);
  assert.deepEqual(original, ["a", "b", "c", "d", "e"]);
});

test("catalog ordering migration stays atomic and admin-only", async () => {
  const sql = await readFile(
    new URL(
      "../supabase/migrations/20260801143000_add_catalog_ordering.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(sql, /security definer/i);
  assert.match(sql, /if not public\.is_catalog_admin\(\)/i);
  assert.match(sql, /lock table public\.product_catalog/i);
  assert.match(sql, /published_count <> cardinality\(p_ordered_ids\)/i);
  assert.match(sql, /grant execute[\s\S]*to authenticated/i);
});
