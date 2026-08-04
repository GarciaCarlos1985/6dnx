import { timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import {
  reconcilePendingStormPayments,
} from "@/lib/checkout/commerce-service";
import {
  CheckoutConfigError,
  getCheckoutObservationConfig,
} from "@/lib/checkout/config";
import { CommerceDatabaseError } from "@/lib/checkout/commerce-repository";
import { notifyDiscordPaidOrder } from "@/lib/checkout/paid-order-notification";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function jsonNoStore(payload: unknown, status = 200) {
  return Response.json(payload, {
    status,
    headers: { "cache-control": "private, no-store" },
  });
}

function hasValidBearer(header: string | null, expected: string) {
  if (!header?.startsWith("Bearer ")) return false;
  const provided = Buffer.from(header.slice(7), "utf8");
  const secret = Buffer.from(expected, "utf8");
  return (
    provided.length === secret.length && timingSafeEqual(provided, secret)
  );
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (
    !cronSecret ||
    !hasValidBearer(request.headers.get("authorization"), cronSecret)
  ) {
    return jsonNoStore({ ok: false, error: "Unauthorized" }, 401);
  }

  try {
    const result = await reconcilePendingStormPayments({
      config: getCheckoutObservationConfig(),
      limit: 5,
    });

    for (const notification of result.notifications) {
      after(() => notifyDiscordPaidOrder(notification));
    }

    return jsonNoStore(
      {
        ok: result.errors === 0,
        checked: result.checked,
        pending: result.pending,
        paid: result.paid,
        failed: result.failed,
        errors: result.errors,
        completedAt: new Date().toISOString(),
      },
      result.errors === 0 ? 200 : 503,
    );
  } catch (error) {
    console.error(
      "Falha na reconciliação periódica da StorM:",
      error instanceof Error ? error.name : "UnknownError",
    );
    const unavailable =
      error instanceof CheckoutConfigError ||
      error instanceof CommerceDatabaseError;
    return jsonNoStore(
      {
        ok: false,
        error: unavailable
          ? "Storm reconciliation unavailable"
          : "Storm reconciliation failed",
      },
      503,
    );
  }
}
