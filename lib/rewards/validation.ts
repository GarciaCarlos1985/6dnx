import {
  REWARD_REASONS,
  REWARD_WALLETS,
  type RewardAdjustment,
  type RewardReason,
  type RewardWallet,
} from "./types.ts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_ABSOLUTE_ADJUSTMENT = 1_000_000;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function integer(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return Number.NaN;
}

export function parseRewardAdjustment(input: unknown):
  | { ok: true; value: RewardAdjustment }
  | { ok: false; errors: string[] } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, errors: ["Dados do ajuste inválidos."] };
  }

  const record = input as Record<string, unknown>;
  const userId = text(record.userId);
  const wallet = text(record.wallet) as RewardWallet;
  const delta = integer(record.delta);
  const reason = text(record.reason) as RewardReason;
  const note = text(record.note);
  const requestId = text(record.requestId);
  const errors: string[] = [];

  if (!UUID_PATTERN.test(userId)) errors.push("O usuário selecionado é inválido.");
  if (!REWARD_WALLETS.includes(wallet)) errors.push("A carteira é inválida.");
  if (
    !Number.isSafeInteger(delta) ||
    delta === 0 ||
    Math.abs(delta) > MAX_ABSOLUTE_ADJUSTMENT
  ) {
    errors.push("O ajuste deve ser um inteiro diferente de zero.");
  }
  if (!REWARD_REASONS.includes(reason)) errors.push("O motivo do ajuste é inválido.");
  if (delta > 0 && reason === "manual_debit") {
    errors.push("O motivo de retirada não pode ser usado em um crédito.");
  }
  if (delta < 0 && (reason === "manual_credit" || reason === "purchase_feedback")) {
    errors.push("O motivo de crédito não pode ser usado em uma retirada.");
  }
  if (note.length > 240) errors.push("A observação deve ter no máximo 240 caracteres.");
  if (!UUID_PATTERN.test(requestId)) errors.push("A identificação da solicitação é inválida.");

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      userId,
      wallet,
      delta,
      reason,
      note: note || null,
      requestId,
    },
  };
}
