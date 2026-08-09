import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseRewardAdjustment } from "../lib/rewards/validation.ts";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const REQUEST_ID = "22222222-2222-4222-8222-222222222222";

test("reward adjustment parser separates wallets and rejects unsafe values", () => {
  const valid = parseRewardAdjustment({
    userId: USER_ID,
    wallet: "community",
    delta: 10,
    reason: "purchase_feedback",
    note: "Feedback conferido no ticket",
    requestId: REQUEST_ID,
  });
  assert.equal(valid.ok, true);

  for (const invalid of [
    { wallet: "shared", delta: 10 },
    { wallet: "slot", delta: 0 },
    { wallet: "community", delta: 1.5 },
    { wallet: "community", delta: -1_000_001 },
    { wallet: "community", delta: -10, reason: "purchase_feedback" },
    { wallet: "community", delta: 10, reason: "reward_redemption" },
  ]) {
    assert.equal(parseRewardAdjustment({
      userId: USER_ID,
      reason: "manual_credit",
      requestId: REQUEST_ID,
      ...invalid,
    }).ok, false);
  }
});

test("dual-wallet migration is fail-closed, immutable and admin-only", async () => {
  const [baseSql, sql] = await Promise.all([
    readFile(
      new URL("../supabase/migrations/20260806100000_add_user_fidelity.sql", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../supabase/migrations/20260809210000_add_dual_loyalty_wallets.sql", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(sql, /wallet in \('slot', 'community'\)/);
  assert.match(sql, /primary key \(user_id, wallet\)/);
  assert.match(sql, /drop trigger if exists trg_credit_loyalty_on_order_paid/);
  assert.doesNotMatch(baseSql, /return\s*\(\s*select\s+b\.\*/i);
  assert.doesNotMatch(sql, /return\s*\(\s*select\s+b\.\*/i);
  assert.match(baseSql, /select b\.\* into v_new[\s\S]*return v_new/i);
  assert.match(baseSql, /select b\.balance into v_prev[\s\S]*for update/i);
  assert.match(sql, /on conflict on constraint loyalty_balances_pkey do nothing/i);
  assert.doesNotMatch(sql, /on conflict \(user_id, wallet\) do nothing/i);
  assert.match(sql, /grant select on public\.loyalty_balances to authenticated, service_role/i);
  assert.match(baseSql, /grant select on public\.loyalty_balances to authenticated, service_role/i);
  assert.match(sql, /if not public\.is_catalog_admin\(\)/);
  assert.match(sql, /auth\.jwt\(\) ->> 'aal'/);
  assert.match(sql, /'aal2'/);
  assert.match(sql, /for update/);
  assert.match(sql, /if v_new < 0/);
  assert.match(sql, /credit reason does not match delta/);
  assert.match(sql, /debit reason does not match delta/);
  assert.match(sql, /request_id uuid/);
  assert.match(sql, /if p_request_id is null/);
  assert.match(sql, /pg_advisory_xact_lock\(hashtextextended\(p_request_id::text, 0\)\)/);
  assert.match(sql, /uq_loyalty_ledger_request/);
  assert.match(sql, /v_existing_delta <> p_delta/);
  assert.match(sql, /v_existing_reason <> p_reason/);
  assert.match(sql, /actor_user_id/);
  assert.match(sql, /actor_user_id_snapshot/);
  assert.match(sql, /revoke select on public\.loyalty_ledger, public\.loyalty_balance_log/);
  assert.match(sql, /from anon, authenticated, service_role/);
  assert.doesNotMatch(sql, /policy[\s\S]{0,120}for (insert|update|delete)/i);
  assert.doesNotMatch(baseSql, /create\s+trigger\s+trg_credit_loyalty_on_order_paid/i);
  assert.doesNotMatch(baseSql, /create\s+or\s+replace\s+function\s+public\.credit_purchase_loyalty_coins/i);
  assert.match(baseSql, /drop trigger if exists trg_credit_loyalty_on_order_paid/i);
  assert.match(baseSql, /drop function if exists public\.credit_purchase_loyalty_coins\(uuid, integer\)/i);
  assert.match(baseSql, /on delete set null/i);
});

test("admin reward mutation revalidates origin, session and bounded JSON", async () => {
  const route = await readFile(
    new URL("../app/api/admin/rewards/route.ts", import.meta.url),
    "utf8",
  );
  const origin = route.indexOf("rejectCrossOriginMutation(request)");
  const auth = route.indexOf("requireAdminApi({ requireAal2: true })", origin);
  const bounded = route.indexOf("readBoundedJson(request, MAX_BODY_BYTES)", auth);
  assert.ok(origin >= 0 && auth > origin && bounded > auth);
  assert.match(route, /parseRewardAdjustment\(payload\)/);
});

test("account and admin expose two independent balances without enabling Slot", async () => {
  const [accountRoute, dashboard, manager, slot] = await Promise.all([
    readFile(new URL("../app/api/account/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/account-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/reward-manager.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/slot-experience.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(accountRoute, /slot: wallets\?\.slot \?\? null/);
  assert.match(accountRoute, /community: wallets\?\.community \?\? null/);
  assert.match(dashboard, /6DNX Coins/);
  assert.match(dashboard, /Moedas da Slot/);
  assert.match(manager, /Compra \+ feedback/);
  assert.match(manager, /Central de Recompensas própria/);
  assert.doesNotMatch(manager, /Zerar após troca/);
  assert.doesNotMatch(manager, /"reward_redemption"/);
  assert.match(manager, /pendingRequestRef\.current\?\.fingerprint === fingerprint/);
  assert.doesNotMatch(slot, /fetch\(["'`]\/api\/slot/);
});
