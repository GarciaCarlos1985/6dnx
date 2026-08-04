"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import {
  formatCpf,
  isValidCpf,
  isValidPayerName,
  normalizeCpf,
  normalizePayerName,
} from "@/lib/checkout/customer-validation";
import type { Product, Variant } from "@/lib/products";
import { DiscordMark } from "@/components/discord-mark";

type CheckoutSession = {
  orderId: string;
  statusToken: string;
  amountLabel: string;
  pixCode: string;
  qrCode: string;
};

type CheckoutPhase =
  | "unavailable"
  | "form"
  | "creating"
  | "pix"
  | "confirming"
  | "paid"
  | "failed";

type ApiError = { error?: string; code?: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_POLL_ATTEMPTS = 120;
const POLL_DELAY_MS = 7_000;

function requestStorageKey(productSlug: string, variantName: string) {
  return `6dnx:checkout-request:${productSlug}:${variantName}`;
}

function getOrCreateRequestId(productSlug: string, variantName: string) {
  const key = requestStorageKey(productSlug, variantName);
  const existing = window.sessionStorage.getItem(key);
  if (existing && UUID_PATTERN.test(existing)) return existing;
  const created = window.crypto.randomUUID();
  window.sessionStorage.setItem(key, created);
  return created;
}

function clearRequestId(productSlug: string, variantName: string) {
  window.sessionStorage.removeItem(requestStorageKey(productSlug, variantName));
}

async function responsePayload<T>(response: Response) {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

export function PixCheckoutModal({
  product,
  variant,
  checkoutAvailable,
  paymentTestAvailable,
  onClose,
}: {
  product: Product;
  variant: Variant;
  checkoutAvailable: boolean;
  paymentTestAvailable: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const pollCountRef = useRef(0);
  const [phase, setPhase] = useState<CheckoutPhase>(
    checkoutAvailable ? "form" : "unavailable",
  );
  const [payerName, setPayerName] = useState("");
  const [payerDocument, setPayerDocument] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    payerName?: string;
    payerDocument?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [copied, setCopied] = useState(false);
  const [supportUrl, setSupportUrl] = useState(
    `/api/redirect?slug=${encodeURIComponent(product.slug)}`,
  );
  const [pollingStopped, setPollingStopped] = useState(false);
  const [testLaunching, setTestLaunching] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const checkoutArtwork = product.checkoutBanner || product.image;
  const hasDedicatedCheckoutBanner = Boolean(product.checkoutBanner);

  useEffect(() => {
    const focusFrame = window.requestAnimationFrame(() => {
      if (checkoutAvailable) {
        firstInputRef.current?.focus({ preventScroll: true });
      } else {
        closeButtonRef.current?.focus({ preventScroll: true });
      }
    });
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };

    window.addEventListener("keydown", closeWithEscape, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", closeWithEscape, true);
      requestControllerRef.current?.abort();
    };
  }, [checkoutAvailable, onClose]);

  useEffect(() => {
    if (!session || (phase !== "pix" && phase !== "confirming")) return;

    let stopped = false;
    let timer: number | null = null;
    let controller: AbortController | null = null;

    const schedule = () => {
      if (stopped) return;
      timer = window.setTimeout(poll, POLL_DELAY_MS);
    };

    const poll = async () => {
      if (stopped) return;
      if (document.visibilityState !== "visible") {
        schedule();
        return;
      }
      pollCountRef.current += 1;
      if (pollCountRef.current > MAX_POLL_ATTEMPTS) {
        setPollingStopped(true);
        return;
      }

      controller = new AbortController();
      try {
        const response = await fetch("/api/checkout/status", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            orderId: session.orderId,
            statusToken: session.statusToken,
          }),
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await responsePayload<{
          status?: "pending" | "confirming" | "paid" | "failed";
          supportUrl?: string | null;
        }>(response);
        if (stopped) return;

        if (response.ok && payload.status === "paid") {
          clearRequestId(product.slug, variant.name);
          if (payload.supportUrl) setSupportUrl(payload.supportUrl);
          setPhase("paid");
          return;
        }
        if (response.ok && payload.status === "failed") {
          setError("A carteira informou que esta cobrança falhou.");
          setPhase("failed");
          return;
        }
        if (response.ok && payload.status === "confirming") {
          setPhase("confirming");
        }
      } catch (pollError) {
        if (
          pollError instanceof DOMException &&
          pollError.name === "AbortError"
        ) {
          return;
        }
        // Falhas transitórias são silenciosas: a próxima rodada tenta de novo.
      }
      schedule();
    };

    schedule();
    return () => {
      stopped = true;
      if (timer !== null) window.clearTimeout(timer);
      controller?.abort();
    };
  }, [phase, product.slug, session, variant.name]);

  const validate = () => {
    const nextErrors: typeof fieldErrors = {};
    if (!isValidPayerName(payerName)) {
      nextErrors.payerName = "Digite nome e sobrenome.";
    }
    if (!isValidCpf(payerDocument)) {
      nextErrors.payerDocument = "Digite um CPF válido.";
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setErrorCode(null);
    if (!validate()) return;

    setPhase("creating");
    const controller = new AbortController();
    requestControllerRef.current?.abort();
    requestControllerRef.current = controller;

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          variantName: variant.name,
          payerName: normalizePayerName(payerName),
          payerDocument: normalizeCpf(payerDocument),
          requestId: getOrCreateRequestId(product.slug, variant.name),
        }),
        cache: "no-store",
        signal: controller.signal,
      });
      const payload = await responsePayload<
        ApiError & {
          orderId?: string;
          statusToken?: string;
          amountLabel?: string;
          pixCode?: string | null;
          qrCode?: string | null;
          status?: "pending" | "confirming" | "paid";
        }
      >(response);

      if (!response.ok) {
        setError(payload.error || "Não foi possível iniciar o pedido.");
        setErrorCode(payload.code || null);
        setPhase("failed");
        return;
      }
      if (payload.status === "paid") {
        clearRequestId(product.slug, variant.name);
        setPhase("paid");
        return;
      }
      if (
        !payload.orderId ||
        !payload.statusToken ||
        !payload.amountLabel ||
        !payload.pixCode ||
        !payload.qrCode
      ) {
        setError("A carteira respondeu sem os dados completos do PIX.");
        setPhase("failed");
        return;
      }

      setSession({
        orderId: payload.orderId,
        statusToken: payload.statusToken,
        amountLabel: payload.amountLabel,
        pixCode: payload.pixCode,
        qrCode: payload.qrCode,
      });
      setPhase(payload.status === "confirming" ? "confirming" : "pix");
    } catch (submitError) {
      if (
        submitError instanceof DOMException &&
        submitError.name === "AbortError"
      ) {
        return;
      }
      setError("A conexão falhou antes de gerar o PIX. Tente novamente.");
      setPhase("failed");
    }
  };

  const copyPix = async () => {
    if (!session) return;
    try {
      await navigator.clipboard.writeText(session.pixCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setError("Não foi possível copiar automaticamente. Selecione o código abaixo.");
    }
  };

  const resetRequest = () => {
    clearRequestId(product.slug, variant.name);
    setError(null);
    setErrorCode(null);
    setSession(null);
    setPhase("form");
    window.requestAnimationFrame(() => firstInputRef.current?.focus());
  };

  const openTestCheckout = async () => {
    if (!paymentTestAvailable || testLaunching) return;
    setTestLaunching(true);
    setTestError(null);
    try {
      const response = await fetch("/api/checkout/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          variantName: variant.name,
        }),
        cache: "no-store",
      });
      const payload = await responsePayload<{
        checkoutUrl?: string;
        error?: string;
      }>(response);
      if (!response.ok || !payload.checkoutUrl) {
        setTestError(payload.error || "O laboratório não pôde ser iniciado.");
        return;
      }
      window.location.assign(payload.checkoutUrl);
    } catch {
      setTestError("A conexão com o laboratório falhou. Tente novamente.");
    } finally {
      setTestLaunching(false);
    }
  };

  const closeFromBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      data-pix-checkout-root
      className="pix-checkout-backdrop fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-black/78 px-4 py-6 backdrop-blur-xl"
      onClick={closeFromBackdrop}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="pix-checkout-panel relative my-auto w-full max-w-[54rem] overflow-hidden border border-primary/45 bg-[linear-gradient(145deg,rgba(21,9,12,.98),rgba(5,3,4,.98))] shadow-[0_0_90px_oklch(0.55_0.22_25_/_0.32)]"
      >
        <div className="pix-checkout-scan pointer-events-none absolute inset-0" aria-hidden />
        <header className="relative z-[1] flex items-start justify-between gap-5 border-b border-white/10 px-5 py-4 sm:px-7">
          <div>
            <p className="mb-1 text-[0.6rem] font-black uppercase tracking-[0.24em] text-primary">
              Checkout seguro // PIX
            </p>
            <h2 id={titleId} className="text-2xl leading-tight text-white sm:text-3xl">
              {product.title}
            </h2>
            <p id={descriptionId} className="mt-1 text-xs text-white/62">
              {variant.name} · pagamento PIX seguro
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar checkout"
            data-checkout-close
            className="grid size-10 shrink-0 place-items-center border border-white/15 text-white/65 transition hover:border-primary hover:text-primary"
          >
            ✕
          </button>
        </header>

        <div className="relative z-[1] grid min-h-[28rem] lg:grid-cols-[.86fr_1.14fr]">
          <aside className="hidden min-h-full overflow-hidden border-r border-white/10 bg-black/55 lg:flex lg:flex-col">
            <div className="pix-checkout-artwork relative aspect-[4/5] w-full shrink-0 overflow-hidden border-b border-white/10">
              <Image
                src={checkoutArtwork}
                alt=""
                fill
                sizes="380px"
                className="scale-110 object-cover opacity-30 blur-xl saturate-75"
              />
              <Image
                src={checkoutArtwork}
                alt={`Arte do checkout de ${product.title}`}
                fill
                sizes="380px"
                className={
                  hasDedicatedCheckoutBanner
                    ? "object-cover"
                    : "object-contain p-4"
                }
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.03),rgba(8,2,4,.48))]" />
            </div>
            <div className="px-6 py-5">
              <p className="text-[0.58rem] font-black uppercase tracking-[0.22em] text-primary">
                6DNX // pedido protegido
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/72">
                O site nunca recebe a senha da carteira. A cobrança é criada no
                servidor e o produto só segue para atendimento após confirmação
                assinada.
              </p>
            </div>
          </aside>

          <div className="flex min-h-[28rem] flex-col justify-center px-5 py-7 sm:px-9">
            {phase === "unavailable" && (
              <div className="text-center" aria-live="polite">
                <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-primary">
                  Checkout em homologação
                </p>
                <h3 className="mt-3 text-3xl text-white">
                  O PIX ainda não foi liberado.
                </h3>
                <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/68">
                  A integração está protegida por uma trava operacional. Nenhum
                  dado pessoal será solicitado e nenhuma cobrança será criada
                  até a validação comercial e técnica terminar.
                </p>
                <a
                  href={supportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-7 inline-flex min-h-12 w-full items-center justify-center border border-primary bg-primary/12 px-5 text-xs font-black uppercase tracking-[0.14em] text-primary transition hover:bg-primary hover:text-white"
                >
                  Falar com o atendimento
                </a>
                {paymentTestAvailable ? (
                  <div className="mt-4 border border-white/10 bg-black/35 p-3">
                    <button
                      type="button"
                      onClick={openTestCheckout}
                      disabled={testLaunching}
                      className="inline-flex min-h-11 w-full items-center justify-center border border-white/18 px-4 text-[0.65rem] font-black uppercase tracking-[0.13em] text-white/78 transition hover:border-primary hover:text-primary disabled:cursor-wait disabled:opacity-55"
                    >
                      {testLaunching
                        ? "Abrindo laboratório…"
                        : "Testar simulação de R$ 1,00"}
                    </button>
                    <p className="mt-2 text-[0.65rem] leading-relaxed text-white/48">
                      Ambiente cenográfico: não cria PIX, não movimenta dinheiro
                      e marca o atendimento como TESTE.
                    </p>
                    {testError ? (
                      <p className="mt-2 text-xs text-red-300" role="alert">
                        {testError}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}

            {(phase === "form" || phase === "creating") && (
              <form onSubmit={submit} noValidate>
                <p className="mb-6 text-sm leading-relaxed text-white/68">
                  Informe os dados do titular do PIX. O CPF completo é enviado
                  somente para a carteira; a 6DNX guarda apenas um hash de
                  segurança e os quatro últimos dígitos.
                </p>

                <label className="block text-[0.65rem] font-bold uppercase tracking-[0.16em] text-white/78">
                  Nome completo
                  <input
                    ref={firstInputRef}
                    type="text"
                    name="payer-name"
                    autoComplete="name"
                    value={payerName}
                    onChange={(event) => setPayerName(event.target.value.slice(0, 100))}
                    maxLength={100}
                    aria-invalid={Boolean(fieldErrors.payerName)}
                    className="mt-2 h-12 w-full border border-white/14 bg-black/45 px-4 text-base normal-case tracking-normal text-white outline-none transition focus:border-primary focus:shadow-[0_0_24px_oklch(0.55_0.22_25_/_0.18)]"
                  />
                </label>
                {fieldErrors.payerName && (
                  <p className="mt-1 text-xs text-red-300">{fieldErrors.payerName}</p>
                )}

                <label className="mt-5 block text-[0.65rem] font-bold uppercase tracking-[0.16em] text-white/78">
                  CPF
                  <input
                    type="text"
                    name="payer-document"
                    inputMode="numeric"
                    autoComplete="off"
                    value={payerDocument}
                    onChange={(event) => setPayerDocument(formatCpf(event.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    aria-invalid={Boolean(fieldErrors.payerDocument)}
                    className="mt-2 h-12 w-full border border-white/14 bg-black/45 px-4 text-base normal-case tracking-[0.08em] text-white outline-none transition focus:border-primary focus:shadow-[0_0_24px_oklch(0.55_0.22_25_/_0.18)]"
                  />
                </label>
                {fieldErrors.payerDocument && (
                  <p className="mt-1 text-xs text-red-300">
                    {fieldErrors.payerDocument}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={phase === "creating"}
                  className="mt-7 inline-flex min-h-13 w-full items-center justify-center gap-3 bg-primary px-6 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-black disabled:cursor-wait disabled:opacity-65"
                >
                  {phase === "creating" ? (
                    <>
                      <span className="pix-checkout-loader" aria-hidden />
                      Gerando PIX com segurança
                    </>
                  ) : (
                    "Gerar cobrança PIX"
                  )}
                </button>
              </form>
            )}

            {(phase === "pix" || phase === "confirming") && session && (
              <div className="text-center">
                <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-primary">
                  {phase === "confirming"
                    ? "Pagamento detectado // validando assinatura"
                    : "Aguardando pagamento"}
                </p>
                <p className="mt-2 text-3xl font-black text-white">
                  {session.amountLabel}
                </p>
                <div className="mx-auto mt-5 w-fit border border-primary/35 bg-white p-2 shadow-[0_0_35px_oklch(0.55_0.22_25_/_0.2)]">
                  <Image
                    src={session.qrCode}
                    alt="QR Code da cobrança PIX"
                    width={224}
                    height={224}
                    unoptimized
                    className="size-48 sm:size-56"
                  />
                </div>
                <button
                  type="button"
                  onClick={copyPix}
                  className="mt-5 min-h-12 w-full border border-primary bg-primary/12 px-5 text-xs font-black uppercase tracking-[0.14em] text-primary transition hover:bg-primary hover:text-white"
                >
                  {copied ? "PIX copiado" : "Copiar código PIX"}
                </button>
                <label className="sr-only" htmlFor={`${titleId}-pix-code`}>
                  Código PIX copia e cola
                </label>
                <textarea
                  id={`${titleId}-pix-code`}
                  readOnly
                  value={session.pixCode}
                  rows={2}
                  className="product-scrollbar mt-3 w-full resize-none border border-white/10 bg-black/45 p-3 text-[0.65rem] leading-relaxed text-white/55"
                />
                <p className="mt-4 text-xs leading-relaxed text-white/58" aria-live="polite">
                  {phase === "confirming"
                    ? "A carteira viu o pagamento. A liberação aguarda o webhook assinado para impedir falsos positivos."
                    : "Após pagar, mantenha esta tela aberta. A confirmação é automática."}
                </p>
                {pollingStopped && (
                  <p className="mt-3 border border-amber-400/25 bg-amber-400/8 p-3 text-xs text-amber-100">
                    A confirmação está demorando. Não pague novamente; fale com o
                    suporte e informe os oito primeiros caracteres do pedido: {session.orderId.slice(0, 8)}.
                  </p>
                )}
              </div>
            )}

            {phase === "paid" && (
              <div className="text-center" aria-live="polite">
                <div className="mx-auto grid size-20 place-items-center rounded-full border border-green-400/45 bg-green-400/10 text-4xl text-green-300 shadow-[0_0_45px_rgba(74,222,128,.18)]">
                  ✓
                </div>
                <p className="mt-6 text-[0.62rem] font-black uppercase tracking-[0.22em] text-green-300">
                  Pagamento confirmado
                </p>
                <h3 className="mt-2 text-3xl text-white">Pedido recebido.</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/65">
                  Agora abra o atendimento 6DNX. O Discord receberá somente os
                  dados do pedido, nunca o seu CPF.
                </p>
                <a
                  href={supportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-7 inline-flex min-h-13 w-full items-center justify-center bg-primary px-6 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-black"
                >
                  Continuar no Discord
                </a>
              </div>
            )}

            {phase === "failed" && (
              <div className="text-center" aria-live="assertive">
                <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-primary">
                  PIX não gerado
                </p>
                <h3 className="mt-3 text-2xl text-white">
                  {errorCode === "offer-unavailable"
                    ? "Esta opção está sendo atualizada."
                    : "Não foi possível gerar o PIX."}
                </h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/68">
                  {error || "Não foi possível continuar com esta cobrança."}
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={
                      errorCode === "offer-unavailable"
                        ? onClose
                        : errorCode === "request-conflict"
                          ? resetRequest
                          : () => setPhase("form")
                    }
                    className="min-h-12 border border-primary bg-primary px-4 text-xs font-black uppercase tracking-[0.12em] text-white"
                  >
                    {errorCode === "offer-unavailable"
                      ? "Voltar às opções"
                      : errorCode === "request-conflict"
                        ? "Reiniciar pedido"
                        : "Tentar novamente"}
                  </button>
                  <a
                    href={supportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/25 bg-white/[0.08] px-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:border-white/45 hover:bg-white/[0.14]"
                  >
                    <DiscordMark className="size-5 text-[#5865f2]" />
                    Canal Welcome
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
