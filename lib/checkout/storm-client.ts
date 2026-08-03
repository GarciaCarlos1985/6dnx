import "server-only";

import {
  STORM_CREATE_PATH,
  STORM_PAYMENT_PATH_PREFIX,
  parseStormCreateResponse,
  parseStormStatusResponse,
  type StormPayment,
  type StormPaymentStatusResult,
} from "@/lib/checkout/storm-contract";
import { readBoundedResponseJson } from "@/lib/http/read-bounded-response";

const CREATE_RESPONSE_LIMIT = 600_000;
const STATUS_RESPONSE_LIMIT = 32_000;

type StormClientConfig = {
  stormBaseUrl: string;
  stormApiKey: string;
};

type CreatePaymentInput = {
  amountCents: number;
  payerName: string;
  payerDocument: string;
  description: string;
  externalId: string;
};

export class StormProviderError extends Error {
  constructor(
    readonly reason: "network" | "rejected" | "invalid-response",
    readonly upstreamStatus?: number,
  ) {
    super("A carteira não conseguiu gerar a cobrança PIX");
    this.name = "StormProviderError";
  }
}
async function stormRequest<T>(
  url: string,
  init: RequestInit,
  maxBytes: number,
  parse: (payload: unknown) => T | null,
) {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new StormProviderError("network");
  }

  if (!response.ok) {
    throw new StormProviderError("rejected", response.status);
  }

  try {
    const payload = await readBoundedResponseJson<unknown>(response, maxBytes);
    const parsed = parse(payload);
    if (!parsed) throw new StormProviderError("invalid-response");
    return parsed;
  } catch (error) {
    if (error instanceof StormProviderError) throw error;
    throw new StormProviderError("invalid-response");
  }
}

export async function createStormPayment(
  config: StormClientConfig,
  input: CreatePaymentInput,
): Promise<StormPayment> {
  const amount = Number((input.amountCents / 100).toFixed(2));
  return stormRequest(
    `${config.stormBaseUrl}${STORM_CREATE_PATH}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": config.stormApiKey,
        "Idempotency-Key": input.externalId,
      },
      body: JSON.stringify({
        amount,
        payerName: input.payerName,
        payerDocument: input.payerDocument,
        description: input.description.slice(0, 200),
        externalId: input.externalId,
      }),
    },
    CREATE_RESPONSE_LIMIT,
    parseStormCreateResponse,
  );
}

export async function getStormPayment(
  config: StormClientConfig,
  providerPaymentId: string,
): Promise<StormPaymentStatusResult> {
  return stormRequest(
    `${config.stormBaseUrl}${STORM_PAYMENT_PATH_PREFIX}${encodeURIComponent(providerPaymentId)}`,
    {
      method: "GET",
      headers: { "x-api-key": config.stormApiKey },
    },
    STATUS_RESPONSE_LIMIT,
    parseStormStatusResponse,
  );
}
