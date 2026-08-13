import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  filterProductShortcuts,
  productMatchesSearch,
} from "../lib/product-discovery.ts";
import type { Product } from "../lib/products.ts";

const products: Product[] = [
  {
    slug: "arena-breakout",
    title: "Arena Breakout",
    category: "Private",
    tagline: "Externo, ESP, AntBAN",
    description: "Acesso assistido",
    image: "/arena.webp",
    status: "available",
    variants: [{ name: "30 Dias", badge: "Mais vendido" }],
  },
  {
    slug: "counter-strike-2",
    title: "Counter-Strike 2",
    category: "CS2",
    tagline: "Legit e externo",
    description: "Suporte especializado",
    image: "/cs2.webp",
    status: "available",
    variants: [{ name: "7 Dias" }],
  },
];

test("product discovery ignores accents and casing", () => {
  assert.equal(productMatchesSearch(products[0], "antban"), true);
  assert.equal(productMatchesSearch(products[0], "ARENA 30 DIAS"), true);
  assert.equal(productMatchesSearch(products[1], "suporte especializado"), true);
});

test("product discovery matches categories and keeps the admin order", () => {
  const filtered = filterProductShortcuts(products, "externo");
  assert.deepEqual(
    filtered.map((product) => product.slug),
    ["arena-breakout", "counter-strike-2"],
  );
  assert.deepEqual(filterProductShortcuts(products, "inexistente"), []);
});

test("storefront keeps only search visible and filters the real catalog", async () => {
  const source = await readFile(
    new URL("../components/product-showcase.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /const SHOW_PRODUCT_SHORTCUT_DIRECTORY = false/);
  assert.match(source, /filterProductShortcuts\(catalogProducts, searchQuery\)/);
  assert.match(source, /buildProductCatalogLayout\(\s*filteredCatalogProducts/);
  assert.match(source, /aria-controls="product-catalog-results"/);
  assert.match(source, /id="product-catalog-results"/);
  assert.match(source, /renderRows\(\[0, 1, 2, 3\]\)/);
  assert.match(source, /renderRows\(\[4, 5, 6, 7\]\)/);
  assert.match(source, /className="catalog-quick-jump"/);
  assert.match(source, /data-product-card-trigger/);
});
