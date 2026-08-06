import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { StormReconciliationCandidate } from "@/lib/checkout/storm-reconciliation";

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
  providerCompleteObservedAt: string | null;
  lastPolledAt: string | null;
};

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
  return {
    orderId: String(row.order_id),
    providerPaymentId:
      typeof row.provider_payment_id === "string"
        ? row.provider_payment_id
        : null,
    providerStatus:
      typeof row.provider_status === "string" ? row.provider_status : null,
    providerCompleteObservedAt:
      typeof row.provider_complete_observed_at === "string"
        ? row.provider_complete_observed_at
        : null,
    lastPolledAt:
      typeof row.last_polled_at === "string" ? row.last_polled_at : null,
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
        "order_id, provider_payment_id, provider_status, provider_complete_observed_at, last_polled_at",
      )
      .eq("order_id", orderId)
      .maybeSingle();
    if (result.error) throw databaseError("get-attempt", result.error);
    return result.data ? mapAttempt(result.data) : null;
  }

  async savePaymentCreation(input: {
    orderId: string;
    providerPaymentId: string;
    externalId: string;
    providerStatus: string;
  }) {
    const attemptResult = await this.client
      .from("commerce_payment_attempts")
      .upsert(
        {
          order_id: input.orderId,
          provider: "storm_wallet",
          provider_payment_id: input.providerPaymentId,
          idempotency_key: input.externalId,
          provider_status: input.providerStatus,
          last_error_code: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "order_id" },
      );
    if (attemptResult.error) {
      throw databaseError("save-payment-attempt", attemptResult.error);
    }

    const orderResult = await this.client
      .from("commerce_orders")
      .update({ status: "pending_payment", updated_at: new Date().toISOString() })
      .eq("id", input.orderId)
      .in("status", ["pending_payment", "payment_creation_failed"]);
    if (orderResult.error) {
      throw databaseError("save-payment-order", orderResult.error);
    }
  }

  async markPaymentCreationFailed(orderId: string, errorCode: string) {
    const now = new Date().toISOString();
    const attemptResult = await this.client
      .from("commerce_payment_attempts")
      .upsert(
        {
          order_id: orderId,
          provider: "storm_wallet",
          last_error_code: errorCode.slice(0, 80),
          updated_at: now,
        },
        { onConflict: "order_id" },
      );
    if (attemptResult.error) {
      throw databaseError("save-payment-error", attemptResult.error);
    }

    const orderResult = await this.client
      .from("commerce_orders")
      .update({ status: "payment_creation_failed", updated_at: now })
      .eq("id", orderId)
      .in("status", ["pending_payment", "payment_creation_failed"]);
    if (orderResult.error) {
      throw databaseError("mark-order-failed", orderResult.error);
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
