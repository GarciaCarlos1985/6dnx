import assert from "node:assert/strict";
import test from "node:test";
import { checkoutActivationState } from "../lib/checkout/activation.ts";
import { parseStormWebhookEvent } from "../lib/checkout/storm-contract.ts";
import {
  signStormPayload,
  verifyStormSignature,
} from "../lib/checkout/storm-signature.ts";

test("real checkout remains fail-closed without both production switches", () => {
  assert.equal(checkoutActivationState({}), "disabled");
  assert.equal(
    checkoutActivationState({
      checkoutEnabled: "true",
      vercelEnv: "production",
    }),
    "production-not-approved",
  );
  assert.equal(
    checkoutActivationState({
      checkoutEnabled: "true",
      productionApproved: "true",
      vercelEnv: "production",
    }),
    "enabled",
  );
});

test("webhook signature covers the exact raw body", () => {
  const exactBody = new TextEncoder().encode(
    '{"event":"payment.completed","data":{"id":"pay_123"}}',
  );
  const tamperedBody = new TextEncoder().encode(
    '{"event":"payment.failed","data":{"id":"pay_123"}}',
  );
  const secret = "test-only-secret-with-at-least-32-bytes";
  const signature = signStormPayload(exactBody, secret);

  assert.equal(verifyStormSignature(exactBody, signature, secret), true);
  assert.equal(verifyStormSignature(tamperedBody, signature, secret), false);
  assert.equal(verifyStormSignature(exactBody, "not-hex", secret), false);
});

test("webhook event name and provider status must agree", () => {
  assert.equal(
    parseStormWebhookEvent({
      event: "payment.completed",
      data: {
        id: "pay_123",
        externalId: "6DNX-123",
        amount: 1,
        status: "COMPLETO",
      },
    })?.data.status,
    "COMPLETO",
  );
  assert.equal(
    parseStormWebhookEvent({
      event: "payment.completed",
      data: {
        id: "pay_123",
        externalId: "6DNX-123",
        amount: 1,
        status: "FALHA",
      },
    }),
    null,
  );
});
