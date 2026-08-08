export type OptionalLoyaltySnapshot = {
  balance: number | null;
  available: boolean;
};

export async function loadOptionalLoyaltyBalance(
  load: () => Promise<number>,
  reportUnavailable?: (error: unknown) => void,
): Promise<OptionalLoyaltySnapshot> {
  try {
    return {
      balance: await load(),
      available: true,
    };
  } catch (error) {
    reportUnavailable?.(error);
    return {
      balance: null,
      available: false,
    };
  }
}
