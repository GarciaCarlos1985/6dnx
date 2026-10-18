import assert from "node:assert/strict";
import test from "node:test";
import {
  gameSlug,
  groupProductsByGame,
  productPagePath,
} from "../lib/catalog/games.ts";
import { products } from "../lib/products.ts";
import { EMPTY_GUIDE } from "../lib/guides/types.ts";
import { parseGuide, parseGuideMutation } from "../lib/guides/validation.ts";
import {
  resolvePurchasedGuide,
  type GuideOrder,
} from "../lib/guides/access.ts";
import { safeAccountReturn } from "../lib/account/return-path.ts";

const orderId = "11111111-1111-4111-8111-111111111111";
const buyer = "buyer-1";
const guide = {
  ...EMPTY_GUIDE,
  title: "Orientação",
  steps: ["Confira o seu pedido."],
};

test("games use explicit relationships instead of commercial categories", () => {
  const base = products[0];
  const groups = groupProductsByGame([
    { ...base, slug: "a", category: "PRIVADO", gameName: "Arc Raiders" },
    { ...base, slug: "b", category: "GG", gameName: "arc raiders" },
    { ...base, slug: "c", category: "DayZ" },
    { ...base, slug: "d", gameName: "Ação & Aventura" },
  ]);
  assert.equal(groups.length, 2);
  assert.equal(
    groups.find((group) => group.slug === "arc-raiders")?.products.length,
    2,
  );
  assert.equal(
    groups
      .flatMap((group) => group.products)
      .some((product) => product.slug === "c"),
    false,
  );
  assert.equal(gameSlug("  Ação & Aventura  "), "acao-aventura");
  assert.equal(
    productPagePath({ slug: "produto-seguro" }),
    "/produtos/produto-seguro",
  );
});

test("guide drafts accept partial work but publication requires title and steps", () => {
  assert.equal(parseGuide(EMPTY_GUIDE).ok, true);
  assert.equal(
    parseGuideMutation({
      action: "save",
      expectedRevision: 0,
      guide: EMPTY_GUIDE,
    }).ok,
    true,
  );
  assert.equal(
    parseGuideMutation({
      action: "publish",
      expectedRevision: 1,
      guide: EMPTY_GUIDE,
    }).ok,
    false,
  );
  const parsed = parseGuideMutation({
    action: "publish",
    expectedRevision: 1,
    guide: { ...guide, youtubeId: "https://youtu.be/BqPwa1SXowE" },
  });
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.equal(parsed.value.guide.youtubeId, "BqPwa1SXowE");
});

test("guide validation rejects oversized, unknown, injected or broken content", () => {
  for (const invalid of [
    { ...guide, steps: Array(81).fill("passo") },
    { ...guide, title: "x".repeat(121) },
    { ...guide, introduction: "<script>alert(1)</script>" },
    { ...guide, youtubeId: "https://evil.example/video" },
    { ...guide, questions: [{ question: "Dúvida", answer: "" }] },
    { ...guide, script: "ignored?" },
    { ...guide, title: "Esquerda\u202E" },
  ])
    assert.equal(parseGuide(invalid).ok, false);
  assert.equal(
    parseGuideMutation({ action: "publish", expectedRevision: -1, guide }).ok,
    false,
  );
});

test("unowned, anonymous, pending and refunded orders never read private guides", async () => {
  for (const situation of [
    { user: "", owner: buyer, status: "paid" },
    { user: buyer, owner: "someone-else", status: "paid" },
    { user: buyer, owner: buyer, status: "pending_payment" },
    { user: buyer, owner: buyer, status: "refunded" },
    { user: buyer, owner: buyer, status: "cancelled" },
    { user: buyer, owner: buyer, status: "disputed" },
  ]) {
    let guideReads = 0;
    const result = await resolvePurchasedGuide(situation.user, orderId, {
      findOrder: async () => ({
        id: orderId,
        userId: situation.owner,
        status: situation.status,
        productSourceKey: "stable-key",
        productSlug: "old-slug",
        productTitle: "Produto",
        variantName: "Plano",
      }),
      findPublishedGuide: async () => {
        guideReads++;
        return guide;
      },
    });
    assert.notEqual(result.state, "ready");
    assert.equal(guideReads, 0);
  }
});

test("paid order resolves the stable purchased solution, including archived or renamed products", async () => {
  const order: GuideOrder = {
    id: orderId,
    userId: buyer,
    status: "paid",
    productSourceKey: "immutable-source-key",
    productSlug: "old-slug",
    productTitle: "Old title",
    variantName: "7 Dias",
  };
  const result = await resolvePurchasedGuide(buyer, orderId, {
    findOrder: async (id, userId) => {
      assert.equal(id, orderId);
      assert.equal(userId, buyer);
      return order;
    },
    findPublishedGuide: async (key) => {
      assert.equal(key, "immutable-source-key");
      return guide;
    },
  });
  assert.equal(result.state, "ready");
  if (result.state === "ready") assert.equal(result.guide.title, guide.title);
  const preparing = await resolvePurchasedGuide(buyer, orderId, {
    findOrder: async () => order,
    findPublishedGuide: async () => null,
  });
  assert.equal(preparing.state, "preparing");
});

test("malformed IDs and callback destinations cannot select another route", async () => {
  const result = await resolvePurchasedGuide(buyer, "not-a-uuid", {
    findOrder: async () => {
      throw new Error("must not query");
    },
    findPublishedGuide: async () => guide,
  });
  assert.equal(result.state, "not-found");
  assert.equal(
    safeAccountReturn(`/conta/pedidos/${orderId}/guia`),
    `/conta/pedidos/${orderId}/guia`,
  );
  for (const path of [
    "https://evil.example",
    "//evil.example",
    "/admin",
    "/conta/pedidos/any/guia",
    `/conta/pedidos/${orderId}/guia?next=https://evil.example`,
  ])
    assert.equal(safeAccountReturn(path), "/conta");
});
