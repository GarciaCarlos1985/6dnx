type PaymentTestEnvironment = {
  NODE_ENV?: string;
  PAYMENT_TEST_MODE?: string;
  VERCEL?: string;
  VERCEL_ENV?: string;
};

export function shouldEnablePaymentTestMode(
  environment: PaymentTestEnvironment,
) {
  if (environment.VERCEL_ENV === "production") return false;

  const configured = environment.PAYMENT_TEST_MODE?.trim().toLowerCase();
  if (configured === "true") return true;
  if (configured === "false") return false;

  return environment.NODE_ENV !== "production" && environment.VERCEL !== "1";
}
