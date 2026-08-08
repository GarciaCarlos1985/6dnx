import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { loadOptionalLoyaltyBalance } from "../lib/account/optional-loyalty.ts";

test("optional loyalty reports an available numeric balance", async () => {
  const result = await loadOptionalLoyaltyBalance(async () => 12);

  assert.deepEqual(result, { balance: 12, available: true });
});

test("optional loyalty degrades to unavailable without hiding the error", async () => {
  const expectedError = { code: "PGRST205" };
  let reportedError: unknown;

  const result = await loadOptionalLoyaltyBalance(
    async () => {
      throw expectedError;
    },
    (error) => {
      reportedError = error;
    },
  );

  assert.deepEqual(result, { balance: null, available: false });
  assert.equal(reportedError, expectedError);
});

test("account keeps orders authoritative and renders loyalty honestly", async () => {
  const route = await readFile(
    new URL("../app/api/account/route.ts", import.meta.url),
    "utf8",
  );
  const dashboard = await readFile(
    new URL("../components/account-dashboard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(route, /repository\.listOrdersByUser\(user\.id\)/);
  assert.match(route, /loadOptionalLoyaltyBalance\(/);
  assert.match(route, /loyaltyAvailable: loyalty\.available/);
  assert.match(dashboard, /balance: number \| null/);
  assert.match(dashboard, /"Em breve"/);
  assert.doesNotMatch(dashboard, /Ganhe moedas a cada compra/);
});
