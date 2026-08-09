import { type NextRequest } from "next/server";
import {
  createCommerceCheckout,
  CheckoutDomainError,
} from "@/lib/checkout/commerce-service";
import {
  CheckoutConfigError,
  getCheckoutRuntimeConfig,
} from "@/lib/checkout/config";
import { CommerceDatabaseError } from "@/lib/checkout/commerce-repository";
import { StormProviderError } from "@/lib/checkout/storm-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  BoundedJsonError,
  readBoundedJson,
} from "@/lib/http/read-bounded-json";
import { isTrustedMutationOrigin } from "@/lib/security/request-origin";

const MAX_BODY_BYTES = 2_048;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_PATTERN = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;

function noStore(payload: unknown, status = 200) {
  return Response.json(payload, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function requestFingerprint(request: NextRequest) {
  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for") ||
    "unknown";
  const ip = forwarded.split(",", 1)[0]?.trim().slice(0, 96) || "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 240) || "unknown";
  return `${ip}\0${userAgent}`;
}

function domainError(error: CheckoutDomainError) {
  switch (error.code) {
    case "invalid-customer":
      return noStore(
        { error: "Confira o nome completo e o CPF informado.", code: error.code },
        400,
      );
    case "offer-unavailable":
      return noStore(
        {
          error:
            "Esta variação ainda não foi liberada para venda automática no site. Nenhuma cobrança foi criada.",
          code: error.code,
        },
        409,
      );
    case "request-conflict":
      return noStore(
        {
          error:
            "Este pedido já foi iniciado com outros dados. Reinicie o checkout.",
          code: error.code,
        },
        409,
      );
    case "rate-limited":
      return noStore(
        {
          error: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
          code: error.code,
        },
        429,
      );
    case "coupon-invalid":
      return noStore(
        {
          error: "Cupom não encontrado, pausado ou inativo.",
          code: error.code,
        },
        409,
      );
    case "coupon-not-started":
      return noStore(
        { error: "Este cupom ainda não entrou em vigor.", code: error.code },
        409,
      );
    case "coupon-expired":
      return noStore(
        { error: "A validade deste cupom terminou.", code: error.code },
        409,
      );
    case "coupon-minimum":
      return noStore(
        {
          error: "Esta opção não alcança o valor mínimo exigido pelo cupom.",
          code: error.code,
        },
        409,
      );
    case "coupon-schema-missing":
      return noStore(
        {
          error:
            "Os cupons ainda não foram habilitados no servidor. Remova o código para continuar sem desconto.",
          code: error.code,
        },
        503,
      );
    case "payment-creation-in-progress":
      return noStore(
        {
          error:
            "Este PIX já está sendo gerado. Aguarde alguns segundos e tente consultar o mesmo pedido novamente.",
          code: error.code,
        },
        409,
      );
    case "payment-creation-ambiguous":
      return noStore(
        {
          error:
            "A StorM pode ter recebido este pedido, mas não confirmou a resposta. Por segurança, não criaremos outro PIX automaticamente. Fale com o suporte.",
          code: error.code,
        },
        409,
      );
    case "payment-recovery-unavailable":
      return noStore(
        {
          error:
            "Já existe uma cobrança para este pedido, mas a consulta à StorM está temporariamente indisponível. Não gere outro pedido; tente novamente em instantes.",
          code: error.code,
        },
        503,
      );
    case "payment-terminal":
      return noStore(
        {
          error:
            "Esta cobrança foi encerrada. Feche o checkout e inicie um novo pedido se ainda quiser comprar.",
          code: error.code,
        },
        409,
      );
    case "payment-creation-retryable":
      return noStore(
        {
          error:
            "A StorM recusou esta tentativa sem criar uma cobrança. Você pode tentar novamente com o mesmo pedido.",
          code: error.code,
        },
        502,
      );
    default:
      return noStore({ error: "Não foi possível iniciar o pedido." }, 400);
  }
}

async function currentSessionUserId(): Promise<string | null> {
  // Best-effort: se o comprador está logado via Google/Discord, captura o
  // user_id para ligar o pedido à conta (fidelidade). Sem sessão -> null
  // (compra anônima, comportamento atual inalterado).
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
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
      return noStore(
        {
          error: "O checkout PIX ainda não foi liberado pelo administrador.",
          code: "checkout-unavailable",
        },
        503,
      );
    }
    throw error;
  }

  let payload: {
    productSlug?: unknown;
    variantName?: unknown;
    payerName?: unknown;
    payerDocument?: unknown;
    requestId?: unknown;
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
    typeof payload.payerName !== "string" ||
    typeof payload.payerDocument !== "string" ||
    typeof payload.requestId !== "string" ||
    !UUID_PATTERN.test(payload.requestId) ||
    (payload.couponCode !== undefined &&
      (typeof payload.couponCode !== "string" ||
        payload.couponCode.length > 32))
  ) {
    return noStore({ error: "Dados do pedido inválidos" }, 400);
  }

  try {
    const userId = await currentSessionUserId();
    const result = await createCommerceCheckout({
      config,
      productSlug: payload.productSlug,
      variantName: payload.variantName,
      payerName: payload.payerName,
      payerDocument: payload.payerDocument,
      clientRequestId: payload.requestId,
      requestFingerprint: requestFingerprint(request),
      userId,
      couponCode:
        typeof payload.couponCode === "string" ? payload.couponCode : null,
    });
    return noStore(result, 201);
  } catch (error) {
    if (error instanceof CheckoutDomainError) return domainError(error);
    if (error instanceof CommerceDatabaseError) {
      return noStore(
        { error: "O banco de pedidos está temporariamente indisponível." },
        503,
      );
    }
    if (error instanceof StormProviderError) {
      return noStore(
        { error: "A carteira não conseguiu gerar o PIX. Tente novamente." },
        502,
      );
    }
    return noStore({ error: "Falha inesperada ao iniciar o pedido." }, 500);
  }
}
