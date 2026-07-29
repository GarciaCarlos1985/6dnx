import { NextRequest } from "next/server";
import {
  CheckoutRateLimitError,
  createTestCheckout,
  getTestCheckout,
  isTestCheckoutEnabled,
} from "@/lib/checkout/test-store";
import {
  BoundedJsonError,
  readBoundedJson,
} from "@/lib/http/read-bounded-json";

const MAX_BODY_BYTES = 1_024;

function noStore(payload: unknown, status = 200) {
  return Response.json(payload, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return origin === request.nextUrl.origin;
}

export function GET(request: NextRequest) {
  if (!isTestCheckoutEnabled()) {
    return noStore({ error: "Checkout de teste desativado" }, 404);
  }

  const id = request.nextUrl.searchParams.get("session");
  if (!id || id.length > 80) {
    return noStore({ error: "Sessão inválida" }, 400);
  }

  const session = getTestCheckout(id);
  return session
    ? noStore({ session })
    : noStore({ error: "Sessão expirada ou inexistente" }, 404);
}

export async function POST(request: NextRequest) {
  if (!isTestCheckoutEnabled()) {
    return noStore({ error: "Checkout de teste desativado" }, 404);
  }
  if (!isSameOrigin(request)) {
    return noStore({ error: "Origem inválida" }, 403);
  }

  let payload: { productSlug?: unknown; variantName?: unknown };
  try {
    payload = await readBoundedJson<typeof payload>(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof BoundedJsonError) {
      return noStore({ error: error.message }, error.status);
    }
    throw error;
  }

  if (
    typeof payload.productSlug !== "string" ||
    typeof payload.variantName !== "string" ||
    payload.productSlug.length > 80 ||
    payload.variantName.length > 120
  ) {
    return noStore({ error: "Produto ou variação inválidos" }, 400);
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientKey =
    forwardedFor?.split(",")[0]?.trim().slice(0, 96) || "local";

  try {
    const session = createTestCheckout(
      payload.productSlug,
      payload.variantName,
      clientKey,
    );
    if (!session) {
      return noStore({ error: "Produto ou variação não encontrados" }, 404);
    }

    return noStore({
      checkoutUrl: `/checkout/test?session=${encodeURIComponent(session.id)}`,
    });
  } catch (error) {
    if (error instanceof CheckoutRateLimitError) {
      return noStore({ error: error.message }, 429);
    }
    throw error;
  }
}
