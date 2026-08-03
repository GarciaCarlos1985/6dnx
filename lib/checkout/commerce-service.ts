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
  isValidCpf,
  isValidPayerName,
  normalizeCpf,
  normalizePayerName,
} from "@/lib/checkout/customer-validation";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000;
const RATE_LIMIT_MAX_ORDERS = 5;
const POLL_INTERVAL_MS = 7_000;

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
    return { status: "paid" as const, productSlug: order.productSlug };
  }
  if (order.status === "failed" || order.status === "cancelled") {
    return { status: "failed" as const, productSlug: order.productSlug };
  }

  const attempt = await repository.getPaymentAttempt(order.id);
  if (!attempt?.providerPaymentId) {
    return {
      status:
        order.status === "payment_creation_failed"
          ? ("failed" as const)
          : ("pending" as const),
      productSlug: order.productSlug,
    };
  }

  const lastPoll = attempt.lastPolledAt
    ? Date.parse(attempt.lastPolledAt)
    : Number.NEGATIVE_INFINITY;
  let observedComplete = Boolean(attempt.providerCompleteObservedAt);
  if (Date.now() - lastPoll >= POLL_INTERVAL_MS) {
    try {
      const payment = await getStormPayment(
        input.config,
        attempt.providerPaymentId,
      );
      if (
        payment.id !== attempt.providerPaymentId ||
        payment.externalId !== order.externalId ||
        amountToCents(payment.amount) !== order.amountCents
      ) {
        throw new CheckoutDomainError("provider-mismatch");
      }
      observedComplete = payment.status === "COMPLETO";
      await repository.savePollObservation({
        orderId: order.id,
        providerStatus: payment.status,
        completeObserved: observedComplete,
      });
      if (payment.status === "FALHA") {
        return { status: "failed" as const, productSlug: order.productSlug };
      }
    } catch (error) {
      if (error instanceof CheckoutDomainError) throw error;
      // A falha temporária no polling não pode converter um pedido em pago ou
      // apagá-lo. O frontend continuará tentando dentro de um intervalo limitado.
    }
  }

  return {
    status: observedComplete ? ("confirming" as const) : ("pending" as const),
    productSlug: order.productSlug,
  };
}
