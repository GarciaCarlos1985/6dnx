import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  PaymentCreationClaim,
  PaymentCreationState,
} from "@/lib/checkout/payment-creation-coordinator";
import type { StormReconciliationCandidate } from "@/lib/checkout/storm-reconciliation";
import type { CouponQuote } from "@/lib/coupons/types";

type DatabaseConfig = {
  supabaseUrl: string;
  supabaseSecretKey: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export type ApprovedOffer = {
  id: string;
  productSourceKey: string;
  productSlug: string;
  productTitle: string;
  variantName: string;
  amountCents: number;
};

export type CommerceOrder = {
  id: string;
  clientRequestId: string;
  externalId: string;
  offerId: string;
  productSlug: string;
  productTitle: string;
  variantName: string;
  amountCents: number;
  payerName: string;
  payerDocumentHash: string;
  user_id?: string | null;
  status: string;
};

export type PaymentAttempt = {
  orderId: string;
  providerPaymentId: string | null;
  providerStatus: string | null;
  pixCode: string | null;
  qrCode: string | null;
  creationState: PaymentCreationState;
  providerCompleteObservedAt: string | null;
  lastPolledAt: string | null;
};

export type OrderDiscountSnapshot = CouponQuote & {
  orderId: string;
};

export type CouponFailureReason =
  | "coupon-invalid"
  | "coupon-not-started"
  | "coupon-expired"
  | "coupon-minimum"
  | "coupon-schema-missing"
  | "coupon-request-conflict";

export class CouponRepositoryError extends Error {
  constructor(readonly reason: CouponFailureReason) {
    super(reason);
    this.name = "CouponRepositoryError";
  }
}

export type StormWebhookResult = {
  orderId: string;
  productSlug: string;
  productTitle: string;
  variantName: string;
  amountCents: number;
  orderStatus: string;
  eventInserted: boolean;
  paymentTransitioned: boolean;
};

export type StormReconciliationResult = Omit<
  StormWebhookResult,
  "eventInserted"
> & {
  reconciliationInserted: boolean;
};

export class CommerceDatabaseError extends Error {
  constructor(
    readonly operation: string,
    readonly databaseCode?: string,
  ) {
    super("O banco de pedidos não está disponível");
    this.name = "CommerceDatabaseError";
  }
}

function databaseError(operation: string, error: { code?: string } | null) {
  return new CommerceDatabaseError(operation, error?.code);
}

function couponSchemaMissing(error: { code?: string; message?: string } | null) {
  return Boolean(
    error &&
      (error.code === "42P01" ||
        error.code === "PGRST202" ||
        error.code === "PGRST205" ||
        error.message?.includes("commerce_coupons") ||
        error.message?.includes("commerce_order_discounts") ||
        error.message?.includes("quote_commerce_coupon") ||
        error.message?.includes("create_discounted_commerce_order")),
  );
}

function couponFailure(error: { message?: string } | null) {
  const message = error?.message ?? "";
  const reasons: CouponFailureReason[] = [
    "coupon-invalid",
    "coupon-not-started",
    "coupon-expired",
    "coupon-minimum",
  ];
  return reasons.find((reason) => message.includes(reason)) ?? null;
}

const ORDER_SELECT =
  "id, client_request_id, external_id, offer_id, product_slug, product_title, variant_name, amount_cents, payer_name, payer_document_hash, user_id, status";

function mapOrder(row: Record<string, unknown>): CommerceOrder {
  return {
    id: String(row.id),
    clientRequestId: String(row.client_request_id),
    externalId: String(row.external_id),
    offerId: String(row.offer_id),
    productSlug: String(row.product_slug),
    productTitle: String(row.product_title),
    variantName: String(row.variant_name),
    amountCents: Number(row.amount_cents),
    payerName: String(row.payer_name),
    payerDocumentHash: String(row.payer_document_hash),
    user_id: typeof row.user_id === "string" ? row.user_id : null,
    status: String(row.status),
  };
}

function mapAttempt(row: Record<string, unknown>): PaymentAttempt {
  const creationState = row.creation_state;
  if (
    creationState !== "creating" &&
    creationState !== "created" &&
    creationState !== "ambiguous" &&
    creationState !== "failed"
  ) {
    throw new CommerceDatabaseError("invalid-payment-creation-state");
  }

  return {
    orderId: String(row.order_id),
    providerPaymentId:
      typeof row.provider_payment_id === "string"
        ? row.provider_payment_id
        : null,
    providerStatus:
      typeof row.provider_status === "string" ? row.provider_status : null,
    pixCode: typeof row.pix_code === "string" ? row.pix_code : null,
    qrCode: typeof row.qr_code === "string" ? row.qr_code : null,
    creationState,
    providerCompleteObservedAt:
      typeof row.provider_complete_observed_at === "string"
        ? row.provider_complete_observed_at
        : null,
    lastPolledAt:
      typeof row.last_polled_at === "string" ? row.last_polled_at : null,
  };
}

function mapDiscountSnapshot(
  row: Record<string, unknown>,
): OrderDiscountSnapshot {
  return {
    orderId: String(row.order_id ?? row.result_order_id),
    code: String(row.coupon_code ?? row.result_coupon_code),
    name: String(row.coupon_name ?? row.result_coupon_name),
    discountPercent: Number(
      row.discount_percent ?? row.result_discount_percent,
    ),
    originalAmountCents: Number(
      row.original_amount_cents ?? row.result_original_amount_cents,
    ),
    discountAmountCents: Number(
      row.discount_amount_cents ?? row.result_discount_amount_cents,
    ),
    finalAmountCents: Number(
      row.final_amount_cents ?? row.result_final_amount_cents,
    ),
  };
}

function mapProcessingResult(
  row: unknown,
  insertedField: "event_inserted" | "reconciliation_inserted",
) {
  if (!row || typeof row !== "object") {
    throw new CommerceDatabaseError("process-storm-empty");
  }

  const record = row as Record<string, unknown>;
  const amountCents = Number(record.amount_cents);
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new CommerceDatabaseError("process-storm-invalid");
  }

  return {
    orderId: String(record.order_id),
    productSlug: String(record.product_slug),
    productTitle: String(record.product_title),
    variantName: String(record.variant_name),
    amountCents,
    orderStatus: String(record.order_status),
    inserted: record[insertedField] === true,
    paymentTransitioned: record.payment_transitioned === true,
  };
}

export class CommerceRepository {
  private readonly client: SupabaseClient;

  constructor(config: DatabaseConfig) {
    this.client = createClient(config.supabaseUrl, config.supabaseSecretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { "X-Client-Info": "6dnx-commerce-server" } },
    });
  }

  async findApprovedOffer(productSlug: string, variantName: string) {
    const productResult = await this.client
      .from("product_catalog")
      .select("source_key, slug, title, status, variants")
      .eq("slug", productSlug)
      .eq("publication_state", "published")
      .maybeSingle();
    if (productResult.error) {
      throw databaseError("find-product", productResult.error);
    }
    if (!productResult.data) return null;
    if (productResult.data.status === "sold-out") return null;

    const catalogVariants = Array.isArray(productResult.data.variants)
      ? productResult.data.variants
      : [];
    const catalogVariant = catalogVariants.find(
      (entry) => isRecord(entry) && entry.name === variantName,
    );
    if (!isRecord(catalogVariant)) return null;
    if (
      catalogVariant.availability === "sold-out" ||
      catalogVariant.availability === "archived"
    ) {
      return null;
    }

    const offerResult = await this.client
      .from("commerce_offers")
      .select("id, product_source_key, variant_name, amount_cents")
      .eq("product_source_key", productResult.data.source_key)
      .eq("variant_name", variantName)
      .eq("status", "approved")
      .maybeSingle();
    if (offerResult.error) {
      throw databaseError("find-offer", offerResult.error);
    }
    if (!offerResult.data) return null;

    const amountCents = Number(offerResult.data.amount_cents);
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
      throw new CommerceDatabaseError("invalid-offer");
    }

    return {
      id: String(offerResult.data.id),
      productSourceKey: String(offerResult.data.product_source_key),
      productSlug: String(productResult.data.slug),
      productTitle: String(productResult.data.title),
      variantName: String(offerResult.data.variant_name),
      amountCents,
    } satisfies ApprovedOffer;
  }

  async findOrderByClientRequestId(clientRequestId: string) {
    const result = await this.client
      .from("commerce_orders")
      .select(ORDER_SELECT)
      .eq("client_request_id", clientRequestId)
      .maybeSingle();
    if (result.error) throw databaseError("find-order", result.error);
    return result.data ? mapOrder(result.data) : null;
  }

  async countRecentOrders(requestFingerprintHash: string, sinceIso: string) {
    const result = await this.client
      .from("commerce_orders")
      .select("id", { count: "exact", head: true })
      .eq("request_fingerprint_hash", requestFingerprintHash)
      .gte("created_at", sinceIso);
    if (result.error) throw databaseError("rate-limit", result.error);
    return result.count ?? 0;
  }

  async insertOrder(input: {
    id: string;
    clientRequestId: string;
    externalId: string;
    offer: ApprovedOffer;
    payerName: string;
    payerDocumentHash: string;
    payerDocumentLast4: string;
    requestFingerprintHash: string;
    userId?: string | null;
  }) {
    const result = await this.client
      .from("commerce_orders")
      .insert({
        id: input.id,
        client_request_id: input.clientRequestId,
        external_id: input.externalId,
        offer_id: input.offer.id,
        product_source_key: input.offer.productSourceKey,
        product_slug: input.offer.productSlug,
        product_title: input.offer.productTitle,
        variant_name: input.offer.variantName,
        amount_cents: input.offer.amountCents,
        payer_name: input.payerName,
        payer_document_hash: input.payerDocumentHash,
        payer_document_last4: input.payerDocumentLast4,
        request_fingerprint_hash: input.requestFingerprintHash,
        user_id: input.userId ?? null,
        status: "pending_payment",
      })
      .select(ORDER_SELECT)
      .single();

    if (!result.error && result.data) return mapOrder(result.data);
    if (result.error?.code === "23505") {
      const existing = await this.findOrderByClientRequestId(
        input.clientRequestId,
      );
      if (existing) return existing;
    }
    throw databaseError("insert-order", result.error);
  }

  async quoteCoupon(offerId: string, couponCode: string) {
    const result = await this.client.rpc("quote_commerce_coupon", {
      p_offer_id: offerId,
      p_coupon_code: couponCode,
    });
    if (result.error) {
      if (couponSchemaMissing(result.error)) {
        throw new CouponRepositoryError("coupon-schema-missing");
      }
      throw databaseError("quote-coupon", result.error);
    }

    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    if (!row || typeof row !== "object") {
      throw new CommerceDatabaseError("quote-coupon-empty");
    }
    const record = row as Record<string, unknown>;
    if (record.result_valid !== true) {
      const reason = record.result_reason;
      if (
        reason === "coupon-invalid" ||
        reason === "coupon-not-started" ||
        reason === "coupon-expired" ||
        reason === "coupon-minimum"
      ) {
        throw new CouponRepositoryError(reason);
      }
      throw new CommerceDatabaseError("quote-coupon-invalid");
    }

    const quote = {
      code: String(record.result_code),
      name: String(record.result_name),
      discountPercent: Number(record.result_discount_percent),
      originalAmountCents: Number(record.result_original_amount_cents),
      discountAmountCents: Number(record.result_discount_amount_cents),
      finalAmountCents: Number(record.result_final_amount_cents),
    } satisfies CouponQuote;
    if (
      !Number.isSafeInteger(quote.originalAmountCents) ||
      !Number.isSafeInteger(quote.discountAmountCents) ||
      !Number.isSafeInteger(quote.finalAmountCents) ||
      quote.originalAmountCents - quote.discountAmountCents !==
        quote.finalAmountCents ||
      quote.finalAmountCents <= 0
    ) {
      throw new CommerceDatabaseError("quote-coupon-amounts");
    }
    return quote;
  }

  async getOrderDiscount(orderId: string) {
    const result = await this.client
      .from("commerce_order_discounts")
      .select(
        "order_id, coupon_code, coupon_name, discount_percent, original_amount_cents, discount_amount_cents, final_amount_cents",
      )
      .eq("order_id", orderId)
      .maybeSingle();
    if (result.error) {
      if (couponSchemaMissing(result.error)) return null;
      throw databaseError("get-order-discount", result.error);
    }
    return result.data ? mapDiscountSnapshot(result.data) : null;
  }

  async insertDiscountedOrder(input: {
    id: string;
    clientRequestId: string;
    externalId: string;
    offer: ApprovedOffer;
    payerName: string;
    payerDocumentHash: string;
    payerDocumentLast4: string;
    requestFingerprintHash: string;
    userId?: string | null;
    couponCode: string;
  }) {
    const result = await this.client.rpc("create_discounted_commerce_order", {
      p_id: input.id,
      p_client_request_id: input.clientRequestId,
      p_external_id: input.externalId,
      p_offer_id: input.offer.id,
      p_product_slug: input.offer.productSlug,
      p_product_title: input.offer.productTitle,
      p_payer_name: input.payerName,
      p_payer_document_hash: input.payerDocumentHash,
      p_payer_document_last4: input.payerDocumentLast4,
      p_request_fingerprint_hash: input.requestFingerprintHash,
      p_user_id: input.userId ?? null,
      p_coupon_code: input.couponCode,
    });
    if (result.error) {
      if (couponSchemaMissing(result.error)) {
        throw new CouponRepositoryError("coupon-schema-missing");
      }
      const reason = couponFailure(result.error);
      if (reason) throw new CouponRepositoryError(reason);
      if (result.error.message?.includes("coupon-request-conflict")) {
        throw new CouponRepositoryError("coupon-request-conflict");
      }
      throw databaseError("insert-discounted-order", result.error);
    }

    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    if (!row || typeof row !== "object") {
      throw new CommerceDatabaseError("insert-discounted-order-empty");
    }
    const record = row as Record<string, unknown>;
    const order = mapOrder({
      id: record.result_order_id,
      client_request_id: record.result_client_request_id,
      external_id: record.result_external_id,
      offer_id: record.result_offer_id,
      product_slug: record.result_product_slug,
      product_title: record.result_product_title,
      variant_name: record.result_variant_name,
      amount_cents: record.result_amount_cents,
      payer_name: record.result_payer_name,
      payer_document_hash: record.result_payer_document_hash,
      user_id: record.result_user_id,
      status: record.result_status,
    });
    const discount = mapDiscountSnapshot(record);
    if (order.amountCents !== discount.finalAmountCents) {
      throw new CommerceDatabaseError("insert-discounted-order-amounts");
    }
    return { order, discount };
  }

  async getOrder(orderId: string) {
    const result = await this.client
      .from("commerce_orders")
      .select(ORDER_SELECT)
      .eq("id", orderId)
      .maybeSingle();
    if (result.error) throw databaseError("get-order", result.error);
    return result.data ? mapOrder(result.data) : null;
  }

  async getPaymentAttempt(orderId: string) {
    const result = await this.client
      .from("commerce_payment_attempts")
      .select(
        "order_id, provider_payment_id, provider_status, pix_code, qr_code, creation_state, provider_complete_observed_at, last_polled_at",
      )
      .eq("order_id", orderId)
      .maybeSingle();
    if (result.error) throw databaseError("get-attempt", result.error);
    return result.data ? mapAttempt(result.data) : null;
  }

  async claimPaymentCreation(input: {
    orderId: string;
    externalId: string;
    claimToken: string;
  }) {
    const result = await this.client.rpc("claim_storm_payment_creation", {
      p_order_id: input.orderId,
      p_external_id: input.externalId,
      p_claim_token: input.claimToken,
    });
    if (result.error) {
      throw databaseError("claim-payment-creation", result.error);
    }

    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    if (!row || typeof row !== "object") {
      throw new CommerceDatabaseError("claim-payment-creation-empty");
    }
    const record = row as Record<string, unknown>;
    const action = record.result_action;
    const creationState = record.result_creation_state;
    if (
      action !== "claimed" &&
      action !== "existing" &&
      action !== "waiting" &&
      action !== "ambiguous" &&
      action !== "paid" &&
      action !== "terminal"
    ) {
      throw new CommerceDatabaseError("claim-payment-creation-invalid");
    }
    if (
      creationState !== "creating" &&
      creationState !== "created" &&
      creationState !== "ambiguous" &&
      creationState !== "failed"
    ) {
      throw new CommerceDatabaseError("claim-payment-creation-state");
    }

    return {
      action,
      claimToken:
        typeof record.result_claim_token === "string"
          ? record.result_claim_token
          : null,
      providerPaymentId:
        typeof record.result_provider_payment_id === "string"
          ? record.result_provider_payment_id
          : null,
      providerStatus:
        typeof record.result_provider_status === "string"
          ? record.result_provider_status
          : null,
      pixCode:
        typeof record.result_pix_code === "string"
          ? record.result_pix_code
          : null,
      qrCode:
        typeof record.result_qr_code === "string"
          ? record.result_qr_code
          : null,
      creationState,
    } satisfies PaymentCreationClaim;
  }

  async completePaymentCreation(input: {
    orderId: string;
    claimToken: string;
    providerPaymentId: string;
    providerStatus: string;
    pixCode: string;
    qrCode: string;
  }) {
    const result = await this.client.rpc("complete_storm_payment_creation", {
      p_order_id: input.orderId,
      p_claim_token: input.claimToken,
      p_provider_payment_id: input.providerPaymentId,
      p_provider_status: input.providerStatus,
      p_pix_code: input.pixCode,
      p_qr_code: input.qrCode,
    });
    if (result.error) {
      throw databaseError("complete-payment-creation", result.error);
    }
  }

  async finishPaymentCreationFailure(input: {
    orderId: string;
    claimToken: string;
    outcome: "failed" | "ambiguous";
    errorCode: string;
  }) {
    const result = await this.client.rpc(
      "finish_storm_payment_creation_failure",
      {
        p_order_id: input.orderId,
        p_claim_token: input.claimToken,
        p_outcome: input.outcome,
        p_error_code: input.errorCode.slice(0, 80),
      },
    );
    if (result.error) {
      throw databaseError("finish-payment-creation", result.error);
    }
  }

  async savePollObservation(input: {
    orderId: string;
    providerStatus: string;
    completeObserved: boolean;
  }) {
    const now = new Date().toISOString();
    const attemptResult = await this.client
      .from("commerce_payment_attempts")
      .update({
        provider_status: input.providerStatus,
        provider_complete_observed_at: input.completeObserved ? now : undefined,
        last_polled_at: now,
        updated_at: now,
      })
      .eq("order_id", input.orderId);
    if (attemptResult.error) {
      throw databaseError("save-poll", attemptResult.error);
    }

    if (input.providerStatus === "FALHA") {
      const orderResult = await this.client
        .from("commerce_orders")
        .update({ status: "failed", updated_at: now })
        .eq("id", input.orderId)
        .neq("status", "paid");
      if (orderResult.error) {
        throw databaseError("save-poll-failure", orderResult.error);
      }
    }
  }

  async listStormReconciliationCandidates(limit: number) {
    const result = await this.client.rpc(
      "list_storm_reconciliation_candidates",
      { p_limit: limit },
    );
    if (result.error) {
      throw databaseError("list-reconciliation-candidates", result.error);
    }
    if (!Array.isArray(result.data)) {
      throw new CommerceDatabaseError("list-reconciliation-candidates-empty");
    }

    return result.data.map((row) => {
      if (!row || typeof row !== "object") {
        throw new CommerceDatabaseError("invalid-reconciliation-candidate");
      }
      const record = row as Record<string, unknown>;
      const amountCents = Number(record.amount_cents);
      const candidate = {
        orderId: String(record.order_id),
        externalId: String(record.external_id),
        amountCents,
        productSlug: String(record.product_slug),
        productTitle: String(record.product_title),
        variantName: String(record.variant_name),
        providerPaymentId: String(record.provider_payment_id),
      } satisfies StormReconciliationCandidate;

      if (
        !candidate.orderId ||
        !candidate.externalId ||
        !candidate.providerPaymentId ||
        !Number.isSafeInteger(amountCents) ||
        amountCents <= 0
      ) {
        throw new CommerceDatabaseError("invalid-reconciliation-candidate");
      }
      return candidate;
    });
  }

  async processStormWebhook(input: {
    eventKey: string;
    eventName: string;
    providerPaymentId: string;
    externalId: string;
    amountCents: number;
    providerStatus: string;
    completedAt: string | null;
  }) {
    const result = await this.client.rpc("process_storm_payment_event_v2", {
      p_event_key: input.eventKey,
      p_event_name: input.eventName,
      p_provider_payment_id: input.providerPaymentId,
      p_external_id: input.externalId,
      p_amount_cents: input.amountCents,
      p_provider_status: input.providerStatus,
      p_completed_at: input.completedAt,
    });
    if (result.error) throw databaseError("process-webhook", result.error);

    const mapped = mapProcessingResult(
      Array.isArray(result.data) ? result.data[0] : result.data,
      "event_inserted",
    );
    return {
      orderId: mapped.orderId,
      productSlug: mapped.productSlug,
      productTitle: mapped.productTitle,
      variantName: mapped.variantName,
      amountCents: mapped.amountCents,
      orderStatus: mapped.orderStatus,
      eventInserted: mapped.inserted,
      paymentTransitioned: mapped.paymentTransitioned,
    } satisfies StormWebhookResult;
  }

  async reconcileStormPayment(input: {
    reconciliationKey: string;
    providerPaymentId: string;
    externalId: string;
    amountCents: number;
    providerStatus: "COMPLETO" | "FALHA";
    observedAt: string;
  }) {
    const result = await this.client.rpc("reconcile_storm_payment", {
      p_reconciliation_key: input.reconciliationKey,
      p_provider_payment_id: input.providerPaymentId,
      p_external_id: input.externalId,
      p_amount_cents: input.amountCents,
      p_provider_status: input.providerStatus,
      p_observed_at: input.observedAt,
    });
    if (result.error) throw databaseError("reconcile-payment", result.error);

    const mapped = mapProcessingResult(
      Array.isArray(result.data) ? result.data[0] : result.data,
      "reconciliation_inserted",
    );
    return {
      orderId: mapped.orderId,
      productSlug: mapped.productSlug,
      productTitle: mapped.productTitle,
      variantName: mapped.variantName,
      amountCents: mapped.amountCents,
      orderStatus: mapped.orderStatus,
      reconciliationInserted: mapped.inserted,
      paymentTransitioned: mapped.paymentTransitioned,
    } satisfies StormReconciliationResult;
  }
}
