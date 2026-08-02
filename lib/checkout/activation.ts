export type CheckoutActivationState =
  | "enabled"
  | "disabled"
  | "production-not-approved";

function enabled(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

export function checkoutActivationState(input: {
  checkoutEnabled?: string;
  productionApproved?: string;
  vercelEnv?: string;
}): CheckoutActivationState {
  if (!enabled(input.checkoutEnabled)) return "disabled";
  if (
    input.vercelEnv === "production" &&
    !enabled(input.productionApproved)
  ) {
    return "production-not-approved";
  }
  return "enabled";
}
