import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DEFAULT_STOREFRONT_CONTENT } from "../lib/storefront-content/types.ts";
import { parseStorefrontContentMutation } from "../lib/storefront-content/validation.ts";

test("storefront defaults form one valid bounded admin mutation", () => {
  const result = parseStorefrontContentMutation({
    content: DEFAULT_STOREFRONT_CONTENT,
    expectedRevision: 1,
  });
  assert.equal(result.ok, true);
});

test("storefront content rejects blanks and stale-looking revisions", () => {
  const result = parseStorefrontContentMutation({
    content: { ...DEFAULT_STOREFRONT_CONTENT, catalogTitle: "   " },
    expectedRevision: 0,
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.errors.join(" "), /Título do catálogo é obrigatório/);
    assert.match(result.errors.join(" "), /revisão atual é obrigatória/i);
  }
});

test("storefront migration is singleton, versioned and admin-only for writes", async () => {
  const sql = await readFile(
    new URL(
      "../supabase/migrations/20260809120000_add_storefront_content_admin.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(sql, /constraint storefront_content_singleton check \(id = 'home'\)/);
  assert.match(sql, /capture_storefront_content_revision/);
  assert.match(
    sql,
    /for update[\s\S]+to authenticated[\s\S]+using \(public\.is_catalog_admin\(\)\)/,
  );
  assert.match(sql, /No INSERT or DELETE policy by design/);
});

test("legacy global pager stays reversible but disabled", async () => {
  const source = await readFile(
    new URL("../components/product-showcase.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /const SHOW_GLOBAL_PRODUCT_PAGER = false/);
  assert.match(source, /product-pager--disabled/);
  assert.match(source, /data-pager-shadow/);
});
