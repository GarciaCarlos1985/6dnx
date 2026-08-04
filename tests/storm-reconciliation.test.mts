import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertStormPaymentMatchesCandidate,
  createStormReconciliationKey,
  StormReconciliationMismatchError,
  type StormReconciliationCandidate,
} from "../lib/checkout/storm-reconciliation.ts";
import type { StormPaymentStatusResult } from "../lib/checkout/storm-contract.ts";

const candidate: StormReconciliationCandidate = {
  orderId: "00000000-0000-4000-8000-000000000001",
  externalId: "6DNX-test-order",
  amountCents: 100,
  productSlug: "test-product",
  productTitle: "Produto de teste",
  variantName: "Teste",
  providerPaymentId: "payment_test_123",
};

const completedPayment: StormPaymentStatusResult = {
  id: candidate.providerPaymentId,
  externalId: candidate.externalId,
  amount: 1,
  status: "COMPLETO",
};

test("reconciliation requires exact provider id, external id and amount", () => {
  assert.doesNotThrow(() =>
    assertStormPaymentMatchesCandidate(candidate, completedPayment),
  );

  for (const payment of [
    { ...completedPayment, id: "another-payment" },
    { ...completedPayment, externalId: "another-order" },
    { ...completedPayment, amount: 1.01 },
  ]) {
    assert.throws(
      () => assertStormPaymentMatchesCandidate(candidate, payment),
      StormReconciliationMismatchError,
    );
  }
});

test("final provider evidence gets a deterministic non-secret key", () => {
  const first = createStormReconciliationKey(completedPayment);
  const second = createStormReconciliationKey({ ...completedPayment });
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(first, second);
  assert.notEqual(
    first,
    createStormReconciliationKey({ ...completedPayment, status: "FALHA" }),
  );
});

test("pending provider state cannot be reconciled as a final payment", () => {
  assert.throws(
    () =>
      createStormReconciliationKey({
        ...completedPayment,
        status: "PENDENTE",
      }),
    /Somente estados finais/,
  );
});

test("migration keeps reconciliation RLS-protected and service-role only", async () => {
  const sql = await readFile(
    new URL(
      "../supabase/migrations/20260803235717_storm_server_reconciliation.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(
    sql,
    /create table if not exists public\.commerce_reconciliation_events/i,
  );
  assert.match(
    sql,
    /alter table public\.commerce_reconciliation_events enable row level security/i,
  );
  assert.match(
    sql,
    /create or replace function public\.reconcile_storm_payment[\s\S]*?security definer[\s\S]*?set search_path = ''/i,
  );
  assert.match(
    sql,
    /revoke all on function public\.reconcile_storm_payment[\s\S]*?from public, anon, authenticated, service_role/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.reconcile_storm_payment[\s\S]*?to service_role/i,
  );
  assert.match(sql, /process_storm_payment_event_v2/i);
  assert.match(sql, /payment_transitioned boolean/i);
  assert.match(sql, /limit least\(greatest\(coalesce\(p_limit, 10\), 1\), 20\)/i);
  assert.doesNotMatch(sql, /payments\/create/i);
});

test("reconciliation code can only query an existing StorM payment", async () => {
  const service = await readFile(
    new URL("../lib/checkout/commerce-service.ts", import.meta.url),
    "utf8",
  );
  const reconciliationOnly = service.slice(
    service.indexOf("async function observeStormCandidate"),
  );
  assert.match(reconciliationOnly, /getStormPayment\(/);
  assert.doesNotMatch(reconciliationOnly, /createStormPayment\(/);

  const cronRoute = await readFile(
    new URL(
      "../app/api/cron/storm-reconciliation/route.ts",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(cronRoute, /export async function GET\(/);
  assert.doesNotMatch(cronRoute, /export async function POST\(/);
});
