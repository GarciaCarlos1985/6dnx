import "server-only";

import { randomUUID } from "node:crypto";
import {
  createCheckoutStatusToken,
  hashPayerDocument,
  hashRequestFingerprint,
  verifyCheckoutStatusToken,
} from "@/lib/checkout/checkout-crypto";
import type { CheckoutRuntimeConfig } from "@/lib/checkout/config";
import {
  CommerceRepository,
  type CommerceOrder,
} from "@/lib/checkout/commerce-repository";
import { amountToCents } from "@/lib/checkout/storm-contract";
import {
  createStormPayment,
  getStormPayment,
  StormProviderError,
} from "@/lib/checkout/storm-client";
import {
  assertStormPaymentMatchesCandidate,
  createStormReconciliationKey,
  StormReconciliationMismatchError,
  type StormReconciliationCandidate,
} from "@/lib/checkout/storm-reconciliation";
import {
  isValidCpf,
  isValidPayerName,
  normalizeCpf,
  normalizePayerName,
} from "@/lib/checkout/customer-validation";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000;
const RATE_LIMIT_MAX_ORDERS = 5;
const POLL_INTERVAL_MS = 7_000;

export type PaidOrderConfirmation = {
  id: string;
  productTitle: string;
  variantName: string;
  amountCents: number;
  confirmationSource: "provider_api";
};

type ReconciliationObservation = {
  status: "pending" | "paid" | "failed";
  notification: PaidOrderConfirmation | null;
};

export class CheckoutDomainError extends Error {
  constructor(
    readonly code:
      | "invalid-customer"
      | "offer-unavailable"
      | "request-conflict"
      | "rate-limited"
      | "order-not-found"
      | "invalid-status-token"
      | "provider-mismatch",
  ) {
    super(code);
    this.name = "CheckoutDomainError";
  }
}
function orderMatches(
  order: CommerceOrder,
  offerId: string,
  payerName: string,
  payerDocumentHash: string,
) {
  return (
    order.offerId === offerId &&
    order.payerName === payerName &&
    order.payerDocumentHash === payerDocumentHash
  );
}

export function formatAmountFromCents(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100);
}

export async function createCommerceCheckout(input: {
  config: CheckoutRuntimeConfig;
  productSlug: string;
  variantName: string;
  payerName: string;
  payerDocument: string;
  clientRequestId: string;
  requestFingerprint: string;
  userId?: string | null;
}) {
  const payerName = normalizePayerName(input.payerName);
  const payerDocument = normalizeCpf(input.payerDocument);
  if (!isValidPayerName(payerName) || !isValidCpf(payerDocument)) {
    throw new CheckoutDomainError("invalid-customer");
  }

  const repository = new CommerceRepository(input.config);
  const offer = await repository.findApprovedOffer(
    input.productSlug,
    input.variantName,
  );
  if (!offer) throw new CheckoutDomainError("offer-unavailable");

  const payerDocumentHash = hashPayerDocument(
    payerDocument,
    input.config.checkoutHashSecret,
  );
  const requestFingerprintHash = hashRequestFingerprint(
    input.requestFingerprint,
    input.config.checkoutHashSecret,
  );

  let order = await repository.findOrderByClientRequestId(
    input.clientRequestId,
  );
  if (order) {
    if (!orderMatches(order, offer.id, payerName, payerDocumentHash)) {
      throw new CheckoutDomainError("request-conflict");
    }
  } else {
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const recentOrders = await repository.countRecentOrders(
      requestFingerprintHash,
      since,
    );
    if (recentOrders >= RATE_LIMIT_MAX_ORDERS) {
      throw new CheckoutDomainError("rate-limited");
    }

    const id = randomUUID();
    order = await repository.insertOrder({
      id,
      clientRequestId: input.clientRequestId,
      externalId: `6DNX-${id}`,
      offer,
      payerName,
      payerDocumentHash,
      payerDocumentLast4: payerDocument.slice(-4),
      requestFingerprintHash,
      userId: input.userId ?? null,
    });
    if (!orderMatches(order, offer.id, payerName, payerDocumentHash)) {
      throw new CheckoutDomainError("request-conflict");
    }
  }

  if (order.status === "paid") {
    return {
      orderId: order.id,
      statusToken: createCheckoutStatusToken(
        order.id,
        input.config.checkoutHashSecret,
      ),
      status: "paid" as const,
      amountLabel: formatAmountFromCents(order.amountCents),
      pixCode: null,
      qrCode: null,
    };
  }

  try {
    const payment = await createStormPayment(input.config, {
      amountCents: order.amountCents,
      payerName,
      payerDocument,
      description: `6DNX | ${order.productTitle} | ${order.variantName}`,
      externalId: order.externalId,
    });
    if (
      payment.externalId !== order.externalId ||
      amountToCents(payment.amount) !== order.amountCents
    ) {
      await repository.markPaymentCreationFailed(
        order.id,
        "provider-response-mismatch",
      );
      throw new CheckoutDomainError("provider-mismatch");
    }
    if (payment.status === "FALHA") {
      await repository.markPaymentCreationFailed(order.id, "provider-failed");
      throw new StormProviderError("rejected");
    }

    await repository.savePaymentCreation({
      orderId: order.id,
      providerPaymentId: payment.id,
      externalId: order.externalId,
      providerStatus: payment.status,
    });

    return {
      orderId: order.id,
      statusToken: createCheckoutStatusToken(
        order.id,
        input.config.checkoutHashSecret,
      ),
      status: payment.status === "COMPLETO" ? ("confirming" as const) : ("pending" as const),
      amountLabel: formatAmountFromCents(order.amountCents),
      pixCode: payment.pixCode,
      qrCode: payment.qrCode,
    };
  } catch (error) {
    if (
      error instanceof StormProviderError ||
      error instanceof CheckoutDomainError
    ) {
      if (!(error instanceof CheckoutDomainError)) {
        await repository.markPaymentCreationFailed(
          order.id,
          `storm-${error.reason}`,
        );
      }
      throw error;
    }
    await repository.markPaymentCreationFailed(order.id, "unexpected-error");
    throw error;
  }
}

export async function getCommerceCheckoutStatus(input: {
  config: CheckoutRuntimeConfig;
  orderId: string;
  statusToken: string;
}) {
  if (
    !verifyCheckoutStatusToken(
      input.orderId,
      input.statusToken,
      input.config.checkoutHashSecret,
    )
  ) {
    throw new CheckoutDomainError("invalid-status-token");
  }

  const repository = new CommerceRepository(input.config);
  const order = await repository.getOrder(input.orderId);
  if (!order) throw new CheckoutDomainError("order-not-found");
  if (order.status === "paid") {
    return {
      status: "paid" as const,
      productSlug: order.productSlug,
      notification: null,
    };
  }
  if (order.status === "failed" || order.status === "cancelled") {
    return {
      status: "failed" as const,
      productSlug: order.productSlug,
      notification: null,
    };
  }

  const attempt = await repository.getPaymentAttempt(order.id);
  if (!attempt?.providerPaymentId) {
    return {
      status:
        order.status === "payment_creation_failed"
          ? ("failed" as const)
          : ("pending" as const),
      productSlug: order.productSlug,
      notification: null,
    };
  }

  const lastPoll = attempt.lastPolledAt
    ? Date.parse(attempt.lastPolledAt)
    : Number.NEGATIVE_INFINITY;
  let observedComplete = Boolean(attempt.providerCompleteObservedAt);
  let notification: PaidOrderConfirmation | null = null;
  if (Date.now() - lastPoll >= POLL_INTERVAL_MS) {
    try {
      const observation = await observeStormCandidate({
        config: input.config,
        repository,
        candidate: {
          orderId: order.id,
          externalId: order.externalId,
          amountCents: order.amountCents,
          productSlug: order.productSlug,
          productTitle: order.productTitle,
          variantName: order.variantName,
          providerPaymentId: attempt.providerPaymentId,
        },
      });
      notification = observation.notification;
      if (observation.status !== "pending") {
        return {
          status: observation.status,
          productSlug: order.productSlug,
          notification,
        };
      }
      observedComplete = false;
    } catch (error) {
      if (error instanceof CheckoutDomainError) throw error;
      if (!(error instanceof StormProviderError)) throw error;
      // A falha temporária na StorM não pode converter o pedido em pago ou
      // apagá-lo. O frontend continuará tentando dentro do intervalo limitado.
    }
  }

  return {
    status: observedComplete ? ("confirming" as const) : ("pending" as const),
    productSlug: order.productSlug,
    notification,
  };
}

async function observeStormCandidate(input: {
  config: CheckoutRuntimeConfig;
  repository: CommerceRepository;
  candidate: StormReconciliationCandidate;
}): Promise<ReconciliationObservation> {
  const payment = await getStormPayment(
    input.config,
    input.candidate.providerPaymentId,
  );

  try {
    assertStormPaymentMatchesCandidate(input.candidate, payment);
  } catch (error) {
    if (error instanceof StormReconciliationMismatchError) {
      throw new CheckoutDomainError("provider-mismatch");
    }
    throw error;
  }

  if (payment.status === "PENDENTE") {
    await input.repository.savePollObservation({
      orderId: input.candidate.orderId,
      providerStatus: payment.status,
      completeObserved: false,
    });
    return { status: "pending", notification: null };
  }

  const result = await input.repository.reconcileStormPayment({
    reconciliationKey: createStormReconciliationKey(payment),
    providerPaymentId: payment.id,
    externalId: payment.externalId,
    amountCents: input.candidate.amountCents,
    providerStatus: payment.status,
    observedAt: new Date().toISOString(),
  });

  const paid = result.orderStatus === "paid";
  return {
    status: paid ? "paid" : "failed",
    notification:
      paid && result.paymentTransitioned
        ? {
            id: result.orderId,
            productTitle: result.productTitle,
            variantName: result.variantName,
            amountCents: result.amountCents,
            confirmationSource: "provider_api",
          }
        : null,
  };
}

export async function reconcilePendingStormPayments(input: {
  config: CheckoutRuntimeConfig;
  limit?: number;
}) {
  const repository = new CommerceRepository(input.config);
  const candidates = await repository.listStormReconciliationCandidates(
    input.limit ?? 10,
  );
  const notifications: PaidOrderConfirmation[] = [];
  let pending = 0;
  let paid = 0;
  let failed = 0;
  let errors = 0;

  for (const candidate of candidates) {
    try {
      const observation = await observeStormCandidate({
        config: input.config,
        repository,
        candidate,
      });
      if (observation.status === "pending") pending += 1;
      if (observation.status === "paid") paid += 1;
      if (observation.status === "failed") failed += 1;
      if (observation.notification) {
        notifications.push(observation.notification);
      }
    } catch (error) {
      errors += 1;
      console.error(
        "Falha ao reconciliar pagamento StorM:",
        error instanceof Error ? error.name : "UnknownError",
      );
    }
  }

  return {
    checked: candidates.length,
    pending,
    paid,
    failed,
    errors,
    notifications,
  };
}
