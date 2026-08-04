import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../supabase/migrations/20260804030000_sync_published_catalog_offers.sql",
  import.meta.url,
);

test("published catalog prices drive approved server-side offers", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(
    sql,
    /create or replace function public\.sync_catalog_commerce_offers[\s\S]*?security definer[\s\S]*?set search_path = ''/i,
  );
  assert.match(sql, /publication_state <> 'published'/i);
  assert.match(sql, /'approved'/i);
  assert.match(sql, /status = excluded\.status/i);
  assert.match(sql, /amount_cents = excluded\.amount_cents/i);
  assert.match(sql, /after insert or update of variants, publication_state/i);
  assert.match(
    sql,
    /revoke all on function public\.sync_catalog_commerce_offers\(text\)[\s\S]*?from public, anon, authenticated, service_role/i,
  );
  assert.doesNotMatch(sql, /delete\s+from\s+public\.commerce_offers/i);
});

test("checkout still requires an approved server-side offer", async () => {
  const repository = await readFile(
    new URL("../lib/checkout/commerce-repository.ts", import.meta.url),
    "utf8",
  );

  assert.match(repository, /\.from\("commerce_offers"\)/);
  assert.match(repository, /\.eq\("status", "approved"\)/);
  assert.doesNotMatch(repository, /priceBRL/);
});
