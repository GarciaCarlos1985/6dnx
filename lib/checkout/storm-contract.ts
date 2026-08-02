export const STORM_WALLET_ORIGIN = "https://wallet.stormapplications.com";
export const STORM_CREATE_PATH = "/api/v1/payments/create";
export const STORM_PAYMENT_PATH_PREFIX = "/api/v1/payments/";

export type StormPaymentStatus = "PENDENTE" | "COMPLETO" | "FALHA";

export type StormPayment = {
  id: string;
  externalId: string;
  amount: number;
  pixCode: string;
  qrCode: string;
  status: StormPaymentStatus;
};

export type StormPaymentStatusResult = Omit<StormPayment, "pixCode" | "qrCode"> & {
  pixCode?: string;
  qrCode?: string;
};

export type StormWebhookEvent = {
  event: "payment.completed" | "payment.failed";
  data: {
    id: string;
    externalId: string;
    amount: number;
    netAmount?: number;
    status: "COMPLETO" | "FALHA";
    completedAt?: string;
  };
};

export function parseStormBaseUrl(value: string | undefined) {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value.trim());
    if (
      url.origin !== STORM_WALLET_ORIGIN ||
      url.username ||
      url.password ||
      (url.pathname !== "/" && url.pathname !== "") ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStormStatus(value: unknown): value is StormPaymentStatus {
  return value === "PENDENTE" || value === "COMPLETO" || value === "FALHA";
}

function boundedText(value: unknown, maxLength: number) {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength
    ? value
    : null;
}

function normalizeQrCode(value: unknown) {
  const qrCode = boundedText(value, 500_000);
  if (!qrCode) return null;

  const dataUri = qrCode.startsWith("data:image/png;base64,")
    ? qrCode
    : `data:image/png;base64,${qrCode}`;
  return /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(dataUri)
    ? dataUri
    : null;
}

function parsePaymentData(value: unknown, requirePix: boolean) {
  if (!isRecord(value)) return null;
  const id = boundedText(value.id, 160);
  const externalId = boundedText(value.externalId, 100);
  const amount = value.amount;
  const status = value.status;
  if (
    !id ||
    !externalId ||
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amountToCents(amount) === null ||
    !isStormStatus(status)
  ) {
    return null;
  }

  const pixCode = boundedText(value.pixCode, 4_096);
  const qrCode = normalizeQrCode(value.qrCode);
  if (requirePix && (!pixCode || !qrCode)) return null;

  return { id, externalId, amount, status, pixCode, qrCode };
}

export function parseStormCreateResponse(payload: unknown): StormPayment | null {
  if (!isRecord(payload) || payload.success !== true) return null;
  const parsed = parsePaymentData(payload.data, true);
  if (!parsed?.pixCode || !parsed.qrCode) return null;
  return { ...parsed, pixCode: parsed.pixCode, qrCode: parsed.qrCode };
}

export function parseStormStatusResponse(
  payload: unknown,
): StormPaymentStatusResult | null {
  if (!isRecord(payload) || payload.success !== true) return null;
  const parsed = parsePaymentData(payload.data, false);
  if (!parsed) return null;
  return {
    id: parsed.id,
    externalId: parsed.externalId,
    amount: parsed.amount,
    status: parsed.status,
    ...(parsed.pixCode ? { pixCode: parsed.pixCode } : {}),
    ...(parsed.qrCode ? { qrCode: parsed.qrCode } : {}),
  };
}

export function parseStormWebhookEvent(payload: unknown): StormWebhookEvent | null {
  if (!isRecord(payload) || !isRecord(payload.data)) return null;
  if (
    payload.event !== "payment.completed" &&
    payload.event !== "payment.failed"
  ) {
    return null;
  }

  const id = boundedText(payload.data.id, 160);
  const externalId = boundedText(payload.data.externalId, 100);
  const amount = payload.data.amount;
  const status = payload.data.status;
  const completedAt = payload.data.completedAt;
  const expectedStatus =
    payload.event === "payment.completed" ? "COMPLETO" : "FALHA";
  if (
    !id ||
    !externalId ||
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amountToCents(amount) === null ||
    status !== expectedStatus ||
    (completedAt !== undefined &&
      (typeof completedAt !== "string" ||
        !Number.isFinite(Date.parse(completedAt))))
  ) {
    return null;
  }

  const netAmount = payload.data.netAmount;
  if (
    netAmount !== undefined &&
    (typeof netAmount !== "number" || !Number.isFinite(netAmount))
  ) {
    return null;
  }

  return {
    event: payload.event,
    data: {
      id,
      externalId,
      amount,
      netAmount,
      status: expectedStatus,
      completedAt,
    },
  };
}

export function amountToCents(value: number) {
  const scaled = value * 100;
  const cents = Math.round(scaled);
  return Number.isSafeInteger(cents) &&
    Math.abs(scaled - cents) < 1e-7 &&
    cents > 0 &&
    cents <= 10_000_000
    ? cents
    : null;
}
