export type PaymentCreationState =
  | "creating"
  | "created"
  | "ambiguous"
  | "failed";

export type StoredPaymentCreation = {
  providerPaymentId: string | null;
  providerStatus: string | null;
  pixCode: string | null;
  qrCode: string | null;
  creationState: PaymentCreationState;
};

export type PaymentCreationClaim = StoredPaymentCreation & {
  action:
    | "claimed"
    | "existing"
    | "waiting"
    | "ambiguous"
    | "paid"
    | "terminal";
  claimToken: string | null;
};

export type CoordinatedProviderPayment = {
  id: string;
  externalId: string;
  amount: number;
  status: "PENDENTE" | "COMPLETO" | "FALHA";
  pixCode?: string;
  qrCode?: string;
};

type FailureOutcome = "failed" | "ambiguous";

export class PaymentCreationCoordinationError extends Error {
  readonly code:
    | "in-progress"
    | "ambiguous"
    | "recovery-unavailable"
    | "terminal"
    | "retryable";

  constructor(code: PaymentCreationCoordinationError["code"]) {
    super(code);
    this.name = "PaymentCreationCoordinationError";
    this.code = code;
  }
}

type PaymentCreationCoordinatorInput<
  TPayment extends CoordinatedProviderPayment,
> = {
  claim: () => Promise<PaymentCreationClaim>;
  read: () => Promise<StoredPaymentCreation | null>;
  create: () => Promise<TPayment>;
  lookup: (providerPaymentId: string) => Promise<TPayment>;
  validate: (payment: TPayment) => void;
  complete: (claimToken: string, payment: TPayment) => Promise<void>;
  finishFailure: (
    claimToken: string,
    outcome: FailureOutcome,
    errorCode: string,
  ) => Promise<void>;
  classifyFailure: (error: unknown) => {
    outcome: FailureOutcome;
    errorCode: string;
  };
  wait?: (milliseconds: number) => Promise<void>;
  waitTimeoutMs?: number;
  waitIntervalMs?: number;
  maxWaitIntervalMs?: number;
};

export type CoordinatedPaymentResult<
  TPayment extends CoordinatedProviderPayment,
> =
  | { kind: "paid" }
  | { kind: "payment"; payment: TPayment; reused: boolean };

const DEFAULT_WAIT_TIMEOUT_MS = 9_000;
const DEFAULT_WAIT_INTERVAL_MS = 150;
const DEFAULT_MAX_WAIT_INTERVAL_MS = 1_000;

function sleep(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

function requireArtifacts<TPayment extends CoordinatedProviderPayment>(
  payment: TPayment,
  stored: StoredPaymentCreation,
): TPayment {
  if (payment.status === "FALHA") return payment;

  const pixCode = payment.pixCode || stored.pixCode;
  const qrCode = payment.qrCode || stored.qrCode;
  if (!pixCode || !qrCode) {
    throw new PaymentCreationCoordinationError("recovery-unavailable");
  }

  return { ...payment, pixCode, qrCode };
}

async function recoverExisting<TPayment extends CoordinatedProviderPayment>(
  input: PaymentCreationCoordinatorInput<TPayment>,
  stored: StoredPaymentCreation,
) {
  if (!stored.providerPaymentId) {
    throw new PaymentCreationCoordinationError(
      stored.creationState === "ambiguous" ? "ambiguous" : "in-progress",
    );
  }

  let payment: TPayment;
  try {
    payment = await input.lookup(stored.providerPaymentId);
    if (payment.id !== stored.providerPaymentId) {
      throw new PaymentCreationCoordinationError("recovery-unavailable");
    }
    input.validate(payment);
  } catch (error) {
    if (error instanceof PaymentCreationCoordinationError) throw error;
    throw new PaymentCreationCoordinationError("recovery-unavailable");
  }

  return requireArtifacts(payment, stored);
}

async function waitForWinner<TPayment extends CoordinatedProviderPayment>(
  input: PaymentCreationCoordinatorInput<TPayment>,
) {
  const wait = input.wait ?? sleep;
  const timeoutMs = input.waitTimeoutMs ?? DEFAULT_WAIT_TIMEOUT_MS;
  let intervalMs = input.waitIntervalMs ?? DEFAULT_WAIT_INTERVAL_MS;
  const maxIntervalMs =
    input.maxWaitIntervalMs ?? DEFAULT_MAX_WAIT_INTERVAL_MS;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await wait(intervalMs);
    intervalMs = Math.min(maxIntervalMs, Math.ceil(intervalMs * 1.8));
    const stored = await input.read();
    if (!stored) continue;
    if (stored.providerPaymentId) return recoverExisting(input, stored);
    if (stored.creationState === "ambiguous") {
      throw new PaymentCreationCoordinationError("ambiguous");
    }
    if (stored.creationState === "failed") {
      throw new PaymentCreationCoordinationError("retryable");
    }
  }

  throw new PaymentCreationCoordinationError("in-progress");
}

export async function coordinatePaymentCreation<
  TPayment extends CoordinatedProviderPayment,
>(
  input: PaymentCreationCoordinatorInput<TPayment>,
): Promise<CoordinatedPaymentResult<TPayment>> {
  const claim = await input.claim();

  if (claim.action === "paid") return { kind: "paid" };
  if (claim.action === "terminal") {
    throw new PaymentCreationCoordinationError("terminal");
  }
  if (claim.action === "ambiguous") {
    throw new PaymentCreationCoordinationError("ambiguous");
  }
  if (claim.action === "existing") {
    return {
      kind: "payment",
      payment: await recoverExisting(input, claim),
      reused: true,
    };
  }
  if (claim.action === "waiting") {
    return {
      kind: "payment",
      payment: await waitForWinner(input),
      reused: true,
    };
  }

  if (!claim.claimToken) {
    throw new PaymentCreationCoordinationError("ambiguous");
  }

  try {
    const payment = await input.create();
    input.validate(payment);
    await input.complete(claim.claimToken, payment);
    return { kind: "payment", payment, reused: false };
  } catch (error) {
    const failure = input.classifyFailure(error);
    try {
      await input.finishFailure(
        claim.claimToken,
        failure.outcome,
        failure.errorCode,
      );
    } catch {
      // A claim persistente continua impedindo uma segunda criação. Se até a
      // gravação da falha não estiver disponível, o próximo acesso a converte
      // em ambíguo após o lease, nunca em uma nova cobrança automática.
    }
    if (failure.outcome === "ambiguous") {
      throw new PaymentCreationCoordinationError("ambiguous");
    }
    throw error;
  }
}
