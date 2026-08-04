import { after, type NextRequest } from "next/server";
import {
  CheckoutDomainError,
  getCommerceCheckoutStatus,
} from "@/lib/checkout/commerce-service";
import {
  CheckoutConfigError,
  getCheckoutObservationConfig,
} from "@/lib/checkout/config";
import { CommerceDatabaseError } from "@/lib/checkout/commerce-repository";
import { notifyDiscordPaidOrder } from "@/lib/checkout/paid-order-notification";
import {
  BoundedJsonError,
  readBoundedJson,
} from "@/lib/http/read-bounded-json";
import { isTrustedMutationOrigin } from "@/lib/security/request-origin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function noStore(payload: unknown, status = 200) {
  return Response.json(payload, {
    status,
    headers: { "cache-control": "no-store" },
  });
}
export async function POST(request: NextRequest) {
  if (
    !isTrustedMutationOrigin(
      request.headers.get("origin"),
      request.headers.get("sec-fetch-site"),
      request.nextUrl.origin,
    )
  ) {
    return noStore({ error: "Origem inválida" }, 403);
  }

  let payload: { orderId?: unknown; statusToken?: unknown };
  try {
    payload = await readBoundedJson<typeof payload>(request, 512);
  } catch (error) {
    if (error instanceof BoundedJsonError) {
      return noStore({ error: error.message }, error.status);
    }
    throw error;
  }

  if (
    typeof payload.orderId !== "string" ||
    !UUID_PATTERN.test(payload.orderId) ||
    typeof payload.statusToken !== "string" ||
    !/^[a-f0-9]{64}$/i.test(payload.statusToken)
  ) {
    return noStore({ error: "Pedido inválido" }, 400);
  }

  try {
    const { notification, ...result } = await getCommerceCheckoutStatus({
      config: getCheckoutObservationConfig(),
      orderId: payload.orderId,
      statusToken: payload.statusToken,
    });
    if (notification) {
      after(() => notifyDiscordPaidOrder(notification));
    }
    return noStore({
      ...result,
      supportUrl:
        result.status === "paid"
          ? `/api/redirect?slug=${encodeURIComponent(result.productSlug)}`
          : null,
    });
  } catch (error) {
    if (error instanceof CheckoutDomainError) {
      const status = error.code === "order-not-found" ? 404 : 403;
      return noStore({ error: "Não foi possível consultar este pedido." }, status);
    }
    if (
      error instanceof CheckoutConfigError ||
      error instanceof CommerceDatabaseError
    ) {
      return noStore(
        { error: "A consulta do pedido está temporariamente indisponível." },
        503,
      );
    }
    return noStore({ error: "Falha ao consultar o pedido." }, 500);
  }
}
