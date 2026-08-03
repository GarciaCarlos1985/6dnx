import { after } from "next/server";
import {
  amountToCents,
  parseStormWebhookEvent,
} from "@/lib/checkout/storm-contract";
import { getStormWebhookConfig } from "@/lib/checkout/config";
import {
  CommerceDatabaseError,
  CommerceRepository,
} from "@/lib/checkout/commerce-repository";
import {
  stormPayloadDigest,
  verifyStormSignature,
} from "@/lib/checkout/storm-signature";
import { notifyDiscordPaidOrder } from "@/lib/checkout/paid-order-notification";
import {
  BoundedBodyError,
  readBoundedBytes,
} from "@/lib/http/read-bounded-bytes";

const MAX_WEBHOOK_BYTES = 16_384;

function noStore(payload: unknown, status = 200) {
  return Response.json(payload, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function POST(request: Request) {
  const config = getStormWebhookConfig();
  if (!config) return noStore({ error: "Webhook indisponível" }, 503);

  const mediaType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();
  if (mediaType !== "application/json") {
    return noStore({ error: "Content-Type inválido" }, 415);
  }

  let body: Uint8Array;
  try {
    body = await readBoundedBytes(request, MAX_WEBHOOK_BYTES);
  } catch (error) {
    if (error instanceof BoundedBodyError) {
      return noStore({ error: error.message }, error.status);
    }
    throw error;
  }

  if (
    !verifyStormSignature(
      body,
      request.headers.get("x-storm-signature"),
      config.webhookSecret,
    )
  ) {
    return noStore({ error: "Assinatura inválida" }, 401);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
  } catch {
    return noStore({ error: "Payload inválido" }, 400);
  }

  const event = parseStormWebhookEvent(payload);
  const eventHeader = request.headers.get("x-storm-event");
  if (!event || eventHeader !== event.event) {
    return noStore({ error: "Evento inválido" }, 400);
  }
  const amountCents = amountToCents(event.data.amount);
  if (!amountCents) return noStore({ error: "Valor inválido" }, 400);

  try {
    const repository = new CommerceRepository(config);
    const result = await repository.processStormWebhook({
      eventKey: stormPayloadDigest(body),
      eventName: event.event,
      providerPaymentId: event.data.id,
      externalId: event.data.externalId,
      amountCents,
      providerStatus: event.data.status,
      completedAt: event.data.completedAt ?? null,
    });

    if (
      result.eventInserted &&
      result.orderStatus === "paid" &&
      event.event === "payment.completed"
    ) {
      after(async () => {
        await notifyDiscordPaidOrder({
          id: result.orderId,
          productTitle: result.productTitle,
          variantName: result.variantName,
          amountCents: result.amountCents,
        });
      });
    }

    return noStore({ received: true, duplicate: !result.eventInserted });
  } catch (error) {
    if (error instanceof CommerceDatabaseError) {
      return noStore({ error: "Evento não pôde ser confirmado" }, 422);
    }
    return noStore({ error: "Falha ao processar evento" }, 500);
  }
}
