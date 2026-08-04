import { createHash } from "node:crypto";
import {
  amountToCents,
  type StormPaymentStatusResult,
} from "./storm-contract.ts";

export type StormReconciliationCandidate = {
  orderId: string;
  externalId: string;
  amountCents: number;
  productSlug: string;
  productTitle: string;
  variantName: string;
  providerPaymentId: string;
};

export class StormReconciliationMismatchError extends Error {
  constructor() {
    super("A resposta da StorM não corresponde ao pedido");
    this.name = "StormReconciliationMismatchError";
  }
}

export function assertStormPaymentMatchesCandidate(
  candidate: StormReconciliationCandidate,
  payment: StormPaymentStatusResult,
) {
  if (
    payment.id !== candidate.providerPaymentId ||
    payment.externalId !== candidate.externalId ||
    amountToCents(payment.amount) !== candidate.amountCents
  ) {
    throw new StormReconciliationMismatchError();
  }
}

export function createStormReconciliationKey(
  payment: StormPaymentStatusResult,
) {
  if (payment.status !== "COMPLETO" && payment.status !== "FALHA") {
    throw new TypeError("Somente estados finais podem ser reconciliados");
  }

  const amountCents = amountToCents(payment.amount);
  if (!amountCents) {
    throw new TypeError("Valor StorM inválido para reconciliação");
  }

  return createHash("sha256")
    .update(
      [
        "storm-provider-api-v1",
        payment.id,
        payment.externalId,
        String(amountCents),
        payment.status,
      ].join("\0"),
      "utf8",
    )
    .digest("hex");
}
