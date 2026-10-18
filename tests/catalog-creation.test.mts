import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  buildCreatedProduct,
  catalogPublishErrors,
  demoCreatedItem,
  parseCreateProduct,
  PRODUCT_PLACEHOLDER,
  type CreateProductInput,
} from "../lib/catalog/creation.ts";
import { parseProduct } from "../lib/catalog/validation.ts";
import { products } from "../lib/products.ts";

const input: CreateProductInput = {
  requestId: "12345678-1234-4123-8123-123456789abc",
  title: "Nova solução Árvore",
  category: "Software",
  gameName: "DayZ",
};

test("new products have a stable independent identity and start without invented price or content", () => {
  const product = buildCreatedProduct(input);
  assert.equal(product.slug, "nova-solucao-arvore-123456781234");
  assert.equal(product.catalogKey, `admin-${input.requestId}`);
  assert.deepEqual(product.variants, []);
  assert.equal(product.description, "");
  assert.equal(product.image, PRODUCT_PLACEHOLDER);
  assert.equal(parseProduct(product).ok, true);
  assert.equal(demoCreatedItem(input).publicationState, "draft");
  assert.deepEqual(buildCreatedProduct(input), product);
});

test("duplication copies the saved product deeply without reusing identity or mutating the original", () => {
  const source = structuredClone(products[0]);
  const before = structuredClone(source);
  const copy = buildCreatedProduct(input, source);
  assert.notEqual(copy.catalogKey, source.catalogKey ?? source.slug);
  assert.notEqual(copy.slug, source.slug);
  assert.equal(copy.title, input.title);
  assert.deepEqual(copy.variants, source.variants);
  assert.equal(copy.image, source.image);
  assert.equal(copy.youtubeId, source.youtubeId);
  assert.deepEqual(copy.tutorialSteps, source.tutorialSteps);
  copy.variants[0].name = "Plano novo";
  assert.deepEqual(source, before);
});

test("creation rejects forged commercial, publication and identity fields and stale-looking origins", () => {
  assert.equal(parseCreateProduct(input).ok, true);
  for (const payload of [
    null,
    [],
    { ...input, publicationState: "published" },
    { ...input, product: products[0] },
    { ...input, priceBRL: 1 },
    { ...input, slug: "old-product" },
    { ...input, sourceId: "invalid" },
    { ...input, sourceId: input.requestId },
    { ...input, title: "<script>" },
    { ...input, gameName: "<img>" },
    { ...input, expectedSourceRevision: 1 },
    { ...input, requestId: "invalid" },
  ]) {
    assert.equal(
      parseCreateProduct(payload).ok,
      false,
      JSON.stringify(payload),
    );
  }
  assert.equal(
    parseCreateProduct({
      ...input,
      sourceId: input.requestId,
      expectedSourceRevision: 1,
    }).ok,
    true,
  );
});

test("drafts can be incomplete while publication requires a real image, description and visible option", () => {
  const draft = buildCreatedProduct(input);
  assert.equal(catalogPublishErrors(draft).length, 3);
  const complete = {
    ...draft,
    image: products[0].image,
    description: "Descrição aprovada para o teste.",
    variants: [{ name: "Sob consulta" }],
  };
  assert.deepEqual(catalogPublishErrors(complete), []);
  assert.equal(
    catalogPublishErrors({
      ...complete,
      variants: [{ name: "Oculto", availability: "archived" }],
    }).length,
    1,
  );
  assert.ok(
    catalogPublishErrors({
      ...complete,
      variants: [{ name: "Inválido", priceBRL: -1 }],
    }).length,
  );
});

test("legacy schemas do not receive optional game or gallery columns by accident", () => {
  const { gameName: omitted, ...legacy } = input;
  void omitted;
  const product = buildCreatedProduct(legacy);
  assert.equal(Object.hasOwn(product, "gameName"), false);
  assert.equal(Object.hasOwn(product, "demoImages"), false);
});

test("authoring endpoints keep authentication, bounded bodies, optimistic publication and safe defaults", async () => {
  const route = await readFile(
    new URL("../app/api/admin/products/route.ts", import.meta.url),
    "utf8",
  );
  const repository = await readFile(
    new URL("../lib/catalog/repository.ts", import.meta.url),
    "utf8",
  );
  assert.ok(
    route.indexOf("rejectCrossOriginMutation(request)") <
      route.indexOf("readBoundedJson(request"),
  );
  assert.ok(
    route.indexOf(
      "requireAdminApi()",
      route.indexOf("export async function POST"),
    ) < route.indexOf("readBoundedJson(request"),
  );
  assert.match(route, /readBoundedJson\(request, 4 \* 1024\)/);
  const creation = repository.slice(
    repository.indexOf("export async function createAdminProduct"),
    repository.indexOf("export async function publishAdminProduct"),
  );
  assert.match(creation, /publicationState: "draft"/);
  assert.match(creation, /source\.revision !== input\.expectedSourceRevision/);
  assert.match(creation, /existing\.item\.sourceKey === sourceKey/);
  assert.doesNotMatch(creation, /\.upsert|commerce_|solution_guides/);
});
