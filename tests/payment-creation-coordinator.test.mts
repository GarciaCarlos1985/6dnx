import assert from "node:assert/strict";
import test from "node:test";
import {
  coordinatePaymentCreation,
  PaymentCreationCoordinationError,
  type CoordinatedProviderPayment,
  type PaymentCreationClaim,
  type StoredPaymentCreation,
} from "../lib/checkout/payment-creation-coordinator.ts";

const payment = {
  id: "pay_only_once",
  externalId: "6DNX-order-1",
  amount: 10.99,
  status: "PENDENTE" as const,
  pixCode: "000201010212",
  qrCode: "data:image/png;base64,iVBORw0KGgo=",
};

test("two concurrent requests create only one StorM PIX", async () => {
  let stored: StoredPaymentCreation | null = null;
  let createCalls = 0;
  let ownerToken: string | null = null;

  const dependencies = {
    claim: async (): Promise<PaymentCreationClaim> => {
      if (!stored) {
        ownerToken = "claim-owner";
        stored = {
          providerPaymentId: null,
          providerStatus: null,
          pixCode: null,
          qrCode: null,
          creationState: "creating",
        };
        return {
          ...stored,
          action: "claimed",
          claimToken: ownerToken,
        };
      }
      return { ...stored, action: "waiting", claimToken: null };
    },
    read: async () => stored,
    create: async () => {
      createCalls += 1;
      await new Promise<void>((resolve) => setTimeout(resolve, 20));
      return payment;
    },
    lookup: async (providerPaymentId: string) => {
      assert.equal(providerPaymentId, payment.id);
      return payment;
    },
    validate: (candidate: typeof payment) => {
      assert.equal(candidate.externalId, payment.externalId);
      assert.equal(candidate.amount, payment.amount);
    },
    complete: async (claimToken: string, candidate: typeof payment) => {
      assert.equal(claimToken, ownerToken);
      stored = {
        providerPaymentId: candidate.id,
        providerStatus: candidate.status,
        pixCode: candidate.pixCode,
        qrCode: candidate.qrCode,
        creationState: "created",
      };
    },
    finishFailure: async () => {
      assert.fail("a successful provider call must not be marked failed");
    },
    classifyFailure: () => ({
      outcome: "ambiguous" as const,
      errorCode: "unexpected",
    }),
    waitIntervalMs: 1,
    maxWaitIntervalMs: 2,
    waitTimeoutMs: 1_000,
  };

  const [first, second] = await Promise.all([
    coordinatePaymentCreation(dependencies),
    coordinatePaymentCreation(dependencies),
  ]);

  assert.equal(createCalls, 1);
  assert.equal(first.kind, "payment");
  assert.equal(second.kind, "payment");
  if (first.kind === "payment" && second.kind === "payment") {
    assert.equal(first.payment.id, payment.id);
    assert.equal(second.payment.id, payment.id);
    assert.deepEqual([first.reused, second.reused].sort(), [false, true]);
  }
});

test("an ambiguous provider timeout never triggers an automatic second POST", async () => {
  let state: "new" | "creating" | "ambiguous" = "new";
  let createCalls = 0;

  const run = () =>
    coordinatePaymentCreation({
      claim: async () => {
        if (state === "new") {
          state = "creating";
          return {
            action: "claimed" as const,
            claimToken: "claim-timeout",
            providerPaymentId: null,
            providerStatus: null,
            pixCode: null,
            qrCode: null,
            creationState: "creating" as const,
          };
        }
        return {
          action: "ambiguous" as const,
          claimToken: null,
          providerPaymentId: null,
          providerStatus: null,
          pixCode: null,
          qrCode: null,
          creationState: "ambiguous" as const,
        };
      },
      read: async () => null,
      create: async () => {
        createCalls += 1;
        throw new Error("timeout after request write");
      },
      lookup: async () => payment,
      validate: () => undefined,
      complete: async () => undefined,
      finishFailure: async (_claimToken, outcome) => {
        assert.equal(outcome, "ambiguous");
        state = "ambiguous";
      },
      classifyFailure: () => ({
        outcome: "ambiguous" as const,
        errorCode: "storm-ambiguous-network",
      }),
    });

  await assert.rejects(run, (error: unknown) => {
    return (
      error instanceof PaymentCreationCoordinationError &&
      error.code === "ambiguous"
    );
  });
  await assert.rejects(run, (error: unknown) => {
    return (
      error instanceof PaymentCreationCoordinationError &&
      error.code === "ambiguous"
    );
  });
  assert.equal(createCalls, 1);
});

test("an existing attempt is looked up and its original PIX is reused", async () => {
  let createCalls = 0;
  const stored: StoredPaymentCreation = {
    providerPaymentId: payment.id,
    providerStatus: payment.status,
    pixCode: payment.pixCode,
    qrCode: payment.qrCode,
    creationState: "created",
  };

  const result = await coordinatePaymentCreation<CoordinatedProviderPayment>({
    claim: async () => ({
      ...stored,
      action: "existing" as const,
      claimToken: null,
    }),
    read: async () => stored,
    create: async () => {
      createCalls += 1;
      return payment;
    },
    lookup: async () => ({
      id: payment.id,
      externalId: payment.externalId,
      amount: payment.amount,
      status: payment.status,
    }),
    validate: () => undefined,
    complete: async () => undefined,
    finishFailure: async () => undefined,
    classifyFailure: () => ({
      outcome: "ambiguous" as const,
      errorCode: "unexpected",
    }),
  });

  assert.equal(createCalls, 0);
  assert.equal(result.kind, "payment");
  if (result.kind === "payment") {
    assert.equal(result.reused, true);
    assert.equal(result.payment.pixCode, payment.pixCode);
    assert.equal(result.payment.qrCode, payment.qrCode);
  }
});

test("provider lookup must return the exact stored payment id", async () => {
  const stored: StoredPaymentCreation = {
    providerPaymentId: payment.id,
    providerStatus: payment.status,
    pixCode: payment.pixCode,
    qrCode: payment.qrCode,
    creationState: "created",
  };

  await assert.rejects(
    coordinatePaymentCreation<CoordinatedProviderPayment>({
      claim: async () => ({
        ...stored,
        action: "existing" as const,
        claimToken: null,
      }),
      read: async () => stored,
      create: async () => payment,
      lookup: async () => ({ ...payment, id: "different-provider-payment" }),
      validate: () => undefined,
      complete: async () => undefined,
      finishFailure: async () => undefined,
      classifyFailure: () => ({
        outcome: "ambiguous" as const,
        errorCode: "unexpected",
      }),
    }),
    (error: unknown) =>
      error instanceof PaymentCreationCoordinationError &&
      error.code === "recovery-unavailable",
  );
});

test("a waiter reports a deterministic owner failure as retryable", async () => {
  await assert.rejects(
    coordinatePaymentCreation<CoordinatedProviderPayment>({
      claim: async () => ({
        action: "waiting" as const,
        claimToken: null,
        providerPaymentId: null,
        providerStatus: null,
        pixCode: null,
        qrCode: null,
        creationState: "creating" as const,
      }),
      read: async () => ({
        providerPaymentId: null,
        providerStatus: null,
        pixCode: null,
        qrCode: null,
        creationState: "failed" as const,
      }),
      create: async () => payment,
      lookup: async () => payment,
      validate: () => undefined,
      complete: async () => undefined,
      finishFailure: async () => undefined,
      classifyFailure: () => ({
        outcome: "failed" as const,
        errorCode: "storm-rejected-422",
      }),
      wait: async () => undefined,
      waitIntervalMs: 1,
      maxWaitIntervalMs: 2,
      waitTimeoutMs: 100,
    }),
    (error: unknown) =>
      error instanceof PaymentCreationCoordinationError &&
      error.code === "retryable",
  );
});
