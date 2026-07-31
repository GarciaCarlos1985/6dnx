import "server-only";

import { randomUUID } from "node:crypto";
import { getPublishedCatalog } from "@/lib/catalog/repository";
import { formatBRL } from "@/lib/products";
import { shouldEnablePaymentTestMode } from "@/lib/security/payment-test-mode";

const SESSION_TTL_MS = 20 * 60 * 1_000;
const RATE_WINDOW_MS = 10 * 60 * 1_000;
const MAX_SESSIONS_PER_WINDOW = 12;
const TEST_AMOUNT_BRL = 1;

export const testPaymentMethods = ["pix", "card"] as const;
export type TestPaymentMethod = (typeof testPaymentMethods)[number];
export type TestCheckoutStatus = "pending" | "approved";
export type TicketDeliveryStatus = "pending" | "sending" | "sent" | "failed";

export type TestCheckoutSession = {
  id: string;
  productSlug: string;
  productTitle: string;
  variantName: string;
  referenceAmountBRL?: number;
  referenceAmountLabel?: string;
  testAmountBRL: number;
  testAmountLabel: string;
  status: TestCheckoutStatus;
  paymentMethod?: TestPaymentMethod;
  ticketStatus: TicketDeliveryStatus;
  createdAt: string;
  expiresAt: string;
  approvedAt?: string;
};

type RateBucket = {
  count: number;
  startedAt: number;
};

type CheckoutRuntime = typeof globalThis & {
  __sixDnxTestCheckoutSessions?: Map<string, TestCheckoutSession>;
  __sixDnxTestCheckoutRate?: Map<string, RateBucket>;
};

const runtime = globalThis as CheckoutRuntime;
const sessions =
  runtime.__sixDnxTestCheckoutSessions ??
  (runtime.__sixDnxTestCheckoutSessions = new Map());
const rateBuckets =
  runtime.__sixDnxTestCheckoutRate ??
  (runtime.__sixDnxTestCheckoutRate = new Map());

export class CheckoutRateLimitError extends Error {
  constructor() {
    super("Limite de sessões de teste atingido. Aguarde alguns minutos.");
    this.name = "CheckoutRateLimitError";
  }
}

export function isTestCheckoutEnabled() {
  return shouldEnablePaymentTestMode(process.env);
}

function pruneExpired(now = Date.now()) {
  for (const [id, session] of sessions) {
    if (Date.parse(session.expiresAt) <= now) sessions.delete(id);
  }

  for (const [key, bucket] of rateBuckets) {
    if (bucket.startedAt + RATE_WINDOW_MS <= now) rateBuckets.delete(key);
  }
}

function consumeRateLimit(clientKey: string, now = Date.now()) {
  const bucket = rateBuckets.get(clientKey);
  if (!bucket || bucket.startedAt + RATE_WINDOW_MS <= now) {
    rateBuckets.set(clientKey, { count: 1, startedAt: now });
    return;
  }

  if (bucket.count >= MAX_SESSIONS_PER_WINDOW) {
    throw new CheckoutRateLimitError();
  }
  bucket.count += 1;
}

export async function createTestCheckout(
  productSlug: string,
  variantName: string,
  clientKey: string,
) {
  pruneExpired();
  consumeRateLimit(clientKey);

  const products = await getPublishedCatalog();
  const product = products.find((item) => item.slug === productSlug);
  const variant = product?.variants.find((item) => item.name === variantName);
  if (!product || !variant) return null;

  const now = Date.now();
  const session: TestCheckoutSession = {
    id: randomUUID(),
    productSlug: product.slug,
    productTitle: product.title,
    variantName: variant.name,
    referenceAmountBRL: variant.priceBRL,
    referenceAmountLabel:
      typeof variant.priceBRL === "number"
        ? formatBRL(variant.priceBRL)
        : undefined,
    testAmountBRL: TEST_AMOUNT_BRL,
    testAmountLabel: formatBRL(TEST_AMOUNT_BRL),
    status: "pending",
    ticketStatus: "pending",
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
  };
  sessions.set(session.id, session);
  return session;
}

export function getTestCheckout(id: string) {
  pruneExpired();
  return sessions.get(id) ?? null;
}

export function approveTestCheckout(id: string, method: TestPaymentMethod) {
  pruneExpired();
  const session = sessions.get(id);
  if (!session) return null;

  if (session.status === "pending") {
    session.status = "approved";
    session.paymentMethod = method;
    session.approvedAt = new Date().toISOString();
  }

  const shouldNotify =
    session.ticketStatus === "pending" || session.ticketStatus === "failed";
  if (shouldNotify) session.ticketStatus = "sending";

  return { session, shouldNotify };
}

export function finishTicketDelivery(id: string, delivered: boolean) {
  const session = sessions.get(id);
  if (!session) return null;
  session.ticketStatus = delivered ? "sent" : "failed";
  return session;
}
