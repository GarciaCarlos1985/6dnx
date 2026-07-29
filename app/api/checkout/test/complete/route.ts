import { NextRequest } from "next/server";
import {
  approveTestCheckout,
  finishTicketDelivery,
  getTestCheckout,
  isTestCheckoutEnabled,
  testPaymentMethods,
  type TestPaymentMethod,
} from "@/lib/checkout/test-store";
import { notifyDiscordTestCheckout } from "@/lib/discord-notifications";
import {
  BoundedJsonError,
  readBoundedJson,
} from "@/lib/http/read-bounded-json";

const MAX_BODY_BYTES = 512;

function noStore(payload: unknown, status = 200) {
  return Response.json(payload, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function isPaymentMethod(value: unknown): value is TestPaymentMethod {
  return testPaymentMethods.includes(value as TestPaymentMethod);
}

export async function POST(request: NextRequest) {
  if (!isTestCheckoutEnabled()) {
    return noStore({ error: "Checkout de teste desativado" }, 404);
  }

  const origin = request.headers.get("origin");
  if (origin !== request.nextUrl.origin) {
    return noStore({ error: "Origem inválida" }, 403);
  }

  let payload: { sessionId?: unknown; paymentMethod?: unknown };
  try {
    payload = await readBoundedJson<typeof payload>(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof BoundedJsonError) {
      return noStore({ error: error.message }, error.status);
    }
    throw error;
  }

  if (
    typeof payload.sessionId !== "string" ||
    payload.sessionId.length > 80 ||
    !isPaymentMethod(payload.paymentMethod)
  ) {
    return noStore({ error: "Sessão ou forma de pagamento inválida" }, 400);
  }

  const approval = approveTestCheckout(
    payload.sessionId,
    payload.paymentMethod,
  );
  if (!approval) {
    return noStore({ error: "Sessão expirada ou inexistente" }, 404);
  }

  if (approval.shouldNotify) {
    const delivery = await notifyDiscordTestCheckout(approval.session);
    finishTicketDelivery(approval.session.id, delivery.delivered);
  }

  const session = getTestCheckout(approval.session.id);

  return noStore({
    session,
    ticketDelivered: session?.ticketStatus === "sent",
    message:
      session?.ticketStatus === "sent"
        ? "Pagamento simulado e ticket confirmados"
        : "Pagamento simulado; o ticket não pôde ser confirmado",
  });
}
