import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../supabase/migrations/20260808103000_add_commerce_orders_user_id_compat.sql",
  import.meta.url,
);

async function migrationSql() {
  return readFile(migrationUrl, "utf8");
}

function executableSql(source: string) {
  return source
    .split("\n")
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n")
    .toLowerCase();
}

test("checkout compatibility migration keeps anonymous orders nullable", async () => {
  const sql = executableSql(await migrationSql());

  assert.match(sql, /add column if not exists user_id uuid null/);
  assert.match(sql, /references auth\.users\s*\(id\) on delete set null/);
  assert.doesNotMatch(sql, /user_id uuid[^;]*not null/);
  assert.doesNotMatch(sql, /user_id uuid[^;]*default/);
});

test("checkout compatibility migration adds only the authorized index and read policy", async () => {
  const sql = executableSql(await migrationSql());

  assert.match(sql, /create index if not exists idx_orders_user/);
  assert.match(sql, /create policy "authenticated users read own commerce orders"/);
  assert.match(sql, /for select\s+to authenticated/);
  assert.match(sql, /using \(user_id = auth\.uid\(\)\)/);

  for (const forbiddenObject of [
    "loyalty_ledger",
    "loyalty_balances",
    "loyalty_balance_log",
    "user_profiles",
  ]) {
    assert.doesNotMatch(sql, new RegExp(`\\b${forbiddenObject}\\b`));
  }
  assert.doesNotMatch(sql, /create\s+(or\s+replace\s+)?function/);
  assert.doesNotMatch(sql, /create\s+trigger/);
});

test("checkout request path does not depend on loyalty tables", async () => {
  const sourceUrls = [
    new URL("../app/api/checkout/route.ts", import.meta.url),
    new URL("../lib/checkout/commerce-service.ts", import.meta.url),
    new URL("../lib/checkout/commerce-repository.ts", import.meta.url),
  ];
  const source = (await Promise.all(sourceUrls.map((url) => readFile(url, "utf8")))).join("\n");

  assert.doesNotMatch(source, /loyalty_balances|loyalty_ledger|user_profiles/);
});
