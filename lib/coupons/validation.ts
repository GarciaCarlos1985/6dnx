import {
  COUPON_STATUSES,
  type CouponMutation,
  type CouponStatus,
} from "./types.ts";

const COUPON_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,31}$/;
const MAX_AMOUNT_CENTS = 10_000_000;

export function normalizeCouponCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function isCouponCode(value: string) {
  return COUPON_CODE_PATTERN.test(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function integer(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return Number.NaN;
}

function optionalIsoDate(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return undefined;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
}

export function parseCouponMutation(input: unknown):
  | { ok: true; value: CouponMutation }
  | { ok: false; errors: string[] } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, errors: ["Dados do cupom inválidos."] };
  }

  const record = input as Record<string, unknown>;
  const code = normalizeCouponCode(text(record.code));
  const name = text(record.name);
  const discountPercent = integer(record.discountPercent);
  const minimumAmountCents = integer(record.minimumAmountCents ?? 0);
  const startsAt = optionalIsoDate(record.startsAt);
  const expiresAt = optionalIsoDate(record.expiresAt);
  const status = text(record.status) as CouponStatus;
  const expectedUpdatedAt = optionalIsoDate(record.expectedUpdatedAt);
  const errors: string[] = [];

  if (!isCouponCode(code)) {
    errors.push("O código deve ter de 3 a 32 letras, números, hífen ou sublinhado.");
  }
  if (name.length < 3 || name.length > 80) {
    errors.push("O nome interno deve ter de 3 a 80 caracteres.");
  }
  if (!Number.isInteger(discountPercent) || discountPercent < 1 || discountPercent > 90) {
    errors.push("O desconto deve ser um percentual inteiro entre 1% e 90%.");
  }
  if (
    !Number.isSafeInteger(minimumAmountCents) ||
    minimumAmountCents < 0 ||
    minimumAmountCents > MAX_AMOUNT_CENTS
  ) {
    errors.push("O valor mínimo da compra é inválido.");
  }
  if (startsAt === undefined) errors.push("A data inicial é inválida.");
  if (expiresAt === undefined) errors.push("A validade é inválida.");
  if (
    startsAt &&
    expiresAt &&
    Date.parse(expiresAt) <= Date.parse(startsAt)
  ) {
    errors.push("A validade precisa ser posterior à data inicial.");
  }
  if (!COUPON_STATUSES.includes(status)) {
    errors.push("O status do cupom é inválido.");
  }
  if (record.expectedUpdatedAt && expectedUpdatedAt === undefined) {
    errors.push("A versão do cupom é inválida.");
  }

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      code,
      name,
      discountPercent,
      minimumAmountCents,
      startsAt: startsAt ?? null,
      expiresAt: expiresAt ?? null,
      status,
      expectedUpdatedAt: expectedUpdatedAt ?? null,
    },
  };
}
