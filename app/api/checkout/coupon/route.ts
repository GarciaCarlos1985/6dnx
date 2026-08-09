import type { NextRequest } from "next/server";
import {
  CheckoutDomainError,
  getCommerceCouponQuote,
} from "@/lib/checkout/commerce-service";
import {
  CheckoutConfigError,
  getCheckoutRuntimeConfig,
} from "@/lib/checkout/config";
import { CommerceDatabaseError } from "@/lib/checkout/commerce-repository";
import { BoundedJsonError, readBoundedJson } from "@/lib/http/read-bounded-json";
import { isTrustedMutationOrigin } from "@/lib/security/request-origin";

const MAX_BODY_BYTES = 1_024;
const SLUG_PATTERN = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;

function noStore(payload: unknown, status = 200) {
  return Response.json(payload, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function couponError(error: CheckoutDomainError) {
  const messages: Partial<Record<CheckoutDomainError["code"], string>> = {
    "offer-unavailable": "Esta opção não está disponível para compra.",
    "coupon-invalid": "Cupom não encontrado, pausado ou inativo.",
    "coupon-not-started": "Este cupom ainda não entrou em vigor.",
    "coupon-expired": "A validade deste cupom terminou.",
    "coupon-minimum": "Esta opção não alcança o valor mínimo do cupom.",
    "coupon-schema-missing":
      "Os cupons ainda não foram habilitados no servidor.",
  };
  return noStore(
    { error: messages[error.code] ?? "Não foi possível validar o cupom.", code: error.code },
    error.code === "coupon-schema-missing" ? 503 : 409,
  );
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

  let config: ReturnType<typeof getCheckoutRuntimeConfig>;
  try {
    config = getCheckoutRuntimeConfig();
  } catch (error) {
    if (error instanceof CheckoutConfigError) {
      return noStore({ error: "O checkout PIX ainda não foi liberado." }, 503);
    }
    throw error;
  }

  let payload: {
    productSlug?: unknown;
    variantName?: unknown;
    couponCode?: unknown;
  };
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
    !SLUG_PATTERN.test(payload.productSlug) ||
    payload.productSlug.length > 96 ||
    typeof payload.variantName !== "string" ||
    payload.variantName.length < 1 ||
    payload.variantName.length > 120 ||
    typeof payload.couponCode !== "string" ||
    payload.couponCode.length < 3 ||
    payload.couponCode.length > 32
  ) {
    return noStore({ error: "Dados do cupom inválidos." }, 400);
  }

  try {
    return noStore(
      await getCommerceCouponQuote({
        config,
        productSlug: payload.productSlug,
        variantName: payload.variantName,
        couponCode: payload.couponCode,
      }),
    );
  } catch (error) {
    if (error instanceof CheckoutDomainError) return couponError(error);
    if (error instanceof CommerceDatabaseError) {
      return noStore({ error: "Não foi possível consultar o cupom agora." }, 503);
    }
    return noStore({ error: "Falha inesperada ao validar o cupom." }, 500);
  }
}
