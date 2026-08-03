import assert from "node:assert/strict";
import test from "node:test";
import { checkoutActivationState } from "../lib/checkout/activation.ts";
import {
  formatCpf,
  isValidCpf,
  isValidPayerName,
  normalizeCpf,
  normalizePayerName,
} from "../lib/checkout/customer-validation.ts";
import {
  amountToCents,
  parseStormBaseUrl,
  parseStormCreateResponse,
  parseStormWebhookEvent,
} from "../lib/checkout/storm-contract.ts";
import {
  LOCAL_PAYMENT_TEST_AMOUNT_BRL,
  LOCAL_PAYMENT_TEST_PRODUCT_KEY,
  LOCAL_PAYMENT_TEST_VARIANT_NAME,
  withLocalPaymentTestProduct,
} from "../lib/checkout/local-payment-test-product.ts";
import {
  signStormPayload,
  verifyStormSignature,
} from "../lib/checkout/storm-signature.ts";
import type { Product } from "../lib/products.ts";

const localPaymentTestCatalog: Product[] = [
  {
    slug: "other-product",
    title: "Outro",
    category: "Outro",
    tagline: "Outro produto",
    description: "",
    image: "/products/other.webp",
    status: "available",
    variants: [{ name: "1 Dia", priceBRL: 20 }],
  },
  {
    slug: LOCAL_PAYMENT_TEST_PRODUCT_KEY,
    catalogKey: LOCAL_PAYMENT_TEST_PRODUCT_KEY,
    title: "Rust1",
    category: "Rust",
    tagline: "Rust Acesso",
    description: "",
    image: "/products/rust.webp",
    status: "available",
    variants: [
      { name: LOCAL_PAYMENT_TEST_VARIANT_NAME, priceBRL: 21.99 },
      { name: "7 Dias", priceBRL: 67.99 },
    ],
  },
];

test("local PIX homologation changes only Rust1 presentation", () => {
  const disabled = withLocalPaymentTestProduct(localPaymentTestCatalog, false);
  assert.deepEqual(disabled, localPaymentTestCatalog);

  const enabled = withLocalPaymentTestProduct(localPaymentTestCatalog, true);
  assert.equal(enabled[0]?.slug, LOCAL_PAYMENT_TEST_PRODUCT_KEY);
  assert.equal(enabled[0]?.catalogKey, LOCAL_PAYMENT_TEST_PRODUCT_KEY);
  assert.equal(enabled[0]?.title, "Teste");
  assert.deepEqual(enabled[0]?.variants, [
    {
      name: LOCAL_PAYMENT_TEST_VARIANT_NAME,
      priceBRL: LOCAL_PAYMENT_TEST_AMOUNT_BRL,
      badge: "TESTE",
      note: "Oferta temporária para homologação",
    },
  ]);
  assert.equal(localPaymentTestCatalog[1]?.title, "Rust1");
  assert.equal(localPaymentTestCatalog[1]?.variants.length, 2);
});

test("CPF is normalized, formatted and validated with both check digits", () => {
  assert.equal(normalizeCpf("529.982.247-25"), "52998224725");
  assert.equal(formatCpf("52998224725"), "529.982.247-25");
  assert.equal(isValidCpf("529.982.247-25"), true);
  assert.equal(isValidCpf("529.982.247-24"), false);
  assert.equal(isValidCpf("111.111.111-11"), false);
});

test("payer name requires a bounded first and last name", () => {
  assert.equal(normalizePayerName("  Carlos   Silva "), "Carlos Silva");
  assert.equal(isValidPayerName("Carlos Silva"), true);
  assert.equal(isValidPayerName("Maria D'Ávila"), true);
  assert.equal(isValidPayerName("Carlos"), false);
  assert.equal(isValidPayerName("A 1"), false);
  assert.equal(isValidPayerName("Carlos <script>"), false);
});

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

test("StorM URL allowlist rejects lookalike hosts, paths and credentials", () => {
  assert.equal(
    parseStormBaseUrl("https://wallet.stormapplications.com"),
    "https://wallet.stormapplications.com",
  );
  assert.equal(
    parseStormBaseUrl("https://wallet.stormapplications.com.evil.example"),
    null,
  );
  assert.equal(
    parseStormBaseUrl("https://wallet.stormapplications.com/api/v1"),
    null,
  );
  assert.equal(
    parseStormBaseUrl("https://user:pass@wallet.stormapplications.com"),
    null,
  );
});

test("StorM create response accepts only bounded validated PIX data", () => {
  const valid = parseStormCreateResponse({
    success: true,
    data: {
      id: "pay_123",
      externalId: "6DNX-123",
      amount: 10.99,
      pixCode: "000201010212",
      qrCode: "iVBORw0KGgo=",
      status: "PENDENTE",
    },
  });
  assert.equal(valid?.qrCode, "data:image/png;base64,iVBORw0KGgo=");
  assert.equal(amountToCents(valid?.amount ?? 0), 1099);
  assert.equal(amountToCents(10.999), null);
  assert.equal(
    parseStormCreateResponse({ success: true, data: { ...valid, qrCode: "javascript:alert(1)" } }),
    null,
  );
});

test("webhook signature is computed from the exact raw body", () => {
  const body = new TextEncoder().encode('{"event":"payment.completed"}');
  const secret = "this-is-a-test-secret-with-32-bytes";
  const signature = signStormPayload(body, secret);
  assert.equal(verifyStormSignature(body, signature, secret), true);
  assert.equal(
    verifyStormSignature(
      new TextEncoder().encode('{"event":"payment.failed"}'),
      signature,
      secret,
    ),
    false,
  );
  assert.equal(verifyStormSignature(body, "not-hex", secret), false);
});

test("webhook event and payment status must agree", () => {
  assert.deepEqual(
    parseStormWebhookEvent({
      event: "payment.completed",
      data: {
        id: "pay_123",
        externalId: "6DNX-123",
        amount: 10.99,
        status: "COMPLETO",
        completedAt: "2026-08-01T12:00:00.000Z",
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
        amount: 10.99,
        status: "FALHA",
      },
    }),
    null,
  );
});
