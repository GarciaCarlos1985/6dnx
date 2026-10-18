import type { SolutionGuide } from "./types.ts";

export const GUIDE_ORDER_STATES = [
  "paid",
  "awaiting_discord_fulfillment",
  "delivered_manually",
] as const;

export function canReadOrderGuide(
  order: { userId: string | null; status: string },
  userId: string,
) {
  return Boolean(
    userId &&
    order.userId === userId &&
    GUIDE_ORDER_STATES.some((status) => status === order.status),
  );
}

export const ORDER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type GuideOrder = {
  id: string;
  userId: string | null;
  status: string;
  productSourceKey: string;
  productSlug: string;
  productTitle: string;
  variantName: string;
};

export async function resolvePurchasedGuide(
  userId: string,
  orderId: string,
  repository: {
    findOrder: (orderId: string, userId: string) => Promise<GuideOrder | null>;
    findPublishedGuide: (sourceKey: string) => Promise<SolutionGuide | null>;
  },
) {
  if (!userId || !ORDER_ID_PATTERN.test(orderId))
    return { state: "not-found" as const };
  const order = await repository.findOrder(orderId, userId);
  if (!order || order.userId !== userId) return { state: "not-found" as const };
  if (!canReadOrderGuide(order, userId))
    return { state: "payment-pending" as const, order };
  const guide = await repository.findPublishedGuide(order.productSourceKey);
  return guide
    ? { state: "ready" as const, order, guide }
    : { state: "preparing" as const, order };
}
