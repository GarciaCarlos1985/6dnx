"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { products } from "@/lib/products";

type PaymentMethod = "pix" | "card";

type CheckoutSession = {
  id: string;
  productSlug: string;
  productTitle: string;
  variantName: string;
  testAmountLabel: string;
  status: "pending" | "approved";
  paymentMethod?: PaymentMethod;
  ticketStatus: "pending" | "sending" | "sent" | "failed";
  expiresAt: string;
};

type SessionPayload = {
  session?: CheckoutSession;
  error?: string;
  ticketDelivered?: boolean;
  message?: string;
};

function testMatrix(seed: string) {
  let state = 2166136261;
  for (const character of seed) {
    state ^= character.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }

  return Array.from({ length: 169 }, (_, index) => {
    const row = Math.floor(index / 13);
    const column = index % 13;
    const finder =
      (row < 4 && column < 4) ||
      (row < 4 && column > 8) ||
      (row > 8 && column < 4);
    if (finder) {
      const localRow = row > 8 ? row - 9 : row;
      const localColumn = column > 8 ? column - 9 : column;
      return (
        localRow === 0 ||
        localRow === 3 ||
        localColumn === 0 ||
        localColumn === 3 ||
        (localRow > 0 &&
          localRow < 3 &&
          localColumn > 0 &&
          localColumn < 3)
      );
    }

    state = Math.imul(state ^ (index + 1), 2246822519);
    return (state >>> 29) % 2 === 0;
  });
}

function TestPix({ sessionId }: { sessionId: string }) {
  const cells = useMemo(() => testMatrix(sessionId), [sessionId]);

  return (
    <div className="relative mx-auto w-[min(13rem,68vw)]">
      <div className="absolute -inset-5 rounded-full bg-primary/25 blur-3xl" />
      <div className="relative aspect-square border border-primary/60 bg-white p-3 shadow-[0_0_60px_var(--primary-glow)]">
        <span className="absolute -left-px -top-px size-5 border-l-2 border-t-2 border-primary" />
        <span className="absolute -right-px -top-px size-5 border-r-2 border-t-2 border-primary" />
        <span className="absolute -bottom-px -left-px size-5 border-b-2 border-l-2 border-primary" />
        <span className="absolute -bottom-px -right-px size-5 border-b-2 border-r-2 border-primary" />
        <div className="grid h-full w-full grid-cols-[repeat(13,minmax(0,1fr))]">
          {cells.map((active, index) => (
            <span
              // This is intentionally decorative and cannot be scanned or paid.
              key={index}
              className={active ? "bg-black" : "bg-white"}
            />
          ))}
        </div>
        <span className="absolute inset-x-3 top-1/2 -translate-y-1/2 bg-primary py-1.5 text-center text-[0.56rem] font-black uppercase tracking-[0.2em] text-white">
          QR ilustrativo · teste
        </span>
      </div>
    </div>
  );
}

function formatExpiry(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export function TestCheckout({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(
    sessionId ? "" : "Sessão de teste não informada.",
  );
  const [message, setMessage] = useState("");

  const product = useMemo(
    () =>
      products.find((item) => item.slug === session?.productSlug) ?? null,
    [session?.productSlug],
  );

  useEffect(() => {
    if (!sessionId) return;

    const controller = new AbortController();
    void fetch(`/api/checkout/test?session=${encodeURIComponent(sessionId)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as SessionPayload;
        if (!response.ok || !payload.session) {
          throw new Error(payload.error || "Não foi possível abrir a sessão.");
        }
        setSession(payload.session);
        if (payload.session.paymentMethod) {
          setMethod(payload.session.paymentMethod);
        }
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") {
          return;
        }
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível abrir a sessão.",
        );
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [sessionId]);

  async function completeTest() {
    if (!session || submitting) return;
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/checkout/test/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, paymentMethod: method }),
      });
      const payload = (await response.json()) as SessionPayload;
      if (!response.ok || !payload.session) {
        throw new Error(payload.error || "A simulação não pôde ser concluída.");
      }

      setSession(payload.session);
      setMessage(
        payload.ticketDelivered
          ? "Teste aprovado e pedido TESTE entregue ao canal TICKET."
          : "Pagamento simulado aprovado, mas o Discord não confirmou o TICKET. Você pode tentar reenviar.",
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "A simulação não pôde ser concluída.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050405] px-4 py-6 text-ink md:px-8 md:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_77%_16%,oklch(0.5_0.24_25_/_0.28),transparent_26%),radial-gradient(circle_at_10%_82%,oklch(0.38_0.18_25_/_0.2),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(oklch(1_0_0_/_0.025)_1px,transparent_1px),linear-gradient(90deg,oklch(1_0_0_/_0.025)_1px,transparent_1px)] [background-size:46px_46px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_35px_var(--primary-glow)]" />

      <div className="pointer-events-none absolute -bottom-16 -right-20 hidden h-[92vh] w-[36rem] opacity-[0.18] lg:block">
        <Image
          src="/anjo1-premium.webp"
          alt=""
          fill
          sizes="36rem"
          className="object-contain object-right-bottom drop-shadow-[0_0_32px_oklch(0.58_0.24_25_/_0.65)]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050405] via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <nav className="mb-6 flex items-center justify-between gap-4 md:mb-9">
          <Link
            href="/#produtos"
            className="group inline-flex items-center gap-3"
            aria-label="Voltar para a vitrine 6DNX"
          >
            <span className="grid size-10 place-items-center border border-primary/50 bg-primary/10 text-sm font-black text-primary shadow-[0_0_24px_var(--primary-glow)] transition-colors group-hover:bg-primary group-hover:text-white">
              6D
            </span>
            <span>
              <span className="block font-display text-xl tracking-[-0.04em]">
                6DNX
              </span>
              <span className="block text-[0.52rem] uppercase tracking-[0.26em] text-muted">
                Secure checkout
              </span>
            </span>
          </Link>

          <span className="inline-flex items-center gap-2 border border-amber-400/35 bg-amber-400/[0.08] px-3 py-2 text-[0.56rem] font-black uppercase tracking-[0.17em] text-amber-200">
            <span className="size-1.5 animate-pulse rounded-full bg-amber-300" />
            Laboratório · sem cobrança
          </span>
        </nav>

        {loading ? (
          <div className="min-h-[40rem] animate-pulse border border-white/10 bg-white/[0.025]" />
        ) : error && !session ? (
          <section className="mx-auto max-w-xl border border-primary/40 bg-surface/95 p-8 text-center shadow-[0_0_60px_var(--primary-glow)]">
            <p className="mb-3 text-2xl font-bold">Sessão indisponível</p>
            <p className="mb-7 text-sm text-muted">{error}</p>
            <Link
              href="/#produtos"
              className="inline-flex min-h-11 items-center border border-primary bg-primary px-6 text-xs font-black uppercase tracking-[0.16em]"
            >
              Voltar aos produtos
            </Link>
          </section>
        ) : session ? (
          <div className="relative overflow-hidden border border-white/10 bg-[#090809]/95 shadow-[0_28px_120px_oklch(0.36_0.17_25_/_0.32)] backdrop-blur-xl">
            <div className="grid border-b border-white/10 bg-black/35 md:grid-cols-3">
              {[
                ["01", "Pedido conferido"],
                ["02", "Pagamento protegido"],
                ["03", "Liberação assistida"],
              ].map(([number, label], index) => (
                <div
                  key={number}
                  className={`flex items-center gap-3 px-5 py-3 ${
                    index < 2 ? "md:border-r md:border-white/10" : ""
                  }`}
                >
                  <span
                    className={`text-[0.62rem] font-black ${
                      index === 1 ? "text-primary" : "text-muted"
                    }`}
                  >
                    {number}
                  </span>
                  <span className="text-[0.6rem] font-bold uppercase tracking-[0.17em] text-white/65">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.82fr)]">
              <section
                className="relative overflow-hidden p-5 sm:p-8 md:p-10"
                aria-labelledby="checkout-heading"
              >
                <div className="pointer-events-none absolute -bottom-10 -right-24 h-[30rem] w-[24rem] opacity-[0.22] lg:hidden">
                  <Image
                    src="/anjo1-premium.webp"
                    alt=""
                    fill
                    sizes="24rem"
                    className="object-contain object-right-bottom"
                  />
                </div>

                <div className="relative">
                  <p className="mb-3 text-[0.6rem] font-black uppercase tracking-[0.27em] text-primary">
                    6DNX // central de aquisição
                  </p>
                  <h1
                    id="checkout-heading"
                    className="max-w-xl text-[clamp(2.7rem,7vw,5.6rem)] leading-[0.84] tracking-[-0.06em]"
                  >
                    Seu acesso,
                    <br />
                    <span className="text-primary drop-shadow-[0_0_25px_var(--primary-glow)]">
                      sem ruído.
                    </span>
                  </h1>
                  <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted">
                    Confira a configuração escolhida. A aprovação real só será
                    liberada quando a integração StorM Wallet e o registro no
                    Supabase estiverem validados em produção.
                  </p>

                  <div className="mt-8 overflow-hidden border border-white/10 bg-black/35">
                    <div className="relative min-h-44 overflow-hidden border-b border-white/10">
                      <Image
                        src={
                          product?.image ??
                          "/products/card-art/dayz-6dnx.webp"
                        }
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 92vw, 36rem"
                        className="object-cover opacity-75"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/20" />
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black to-transparent" />
                      <div className="pointer-events-none absolute -bottom-12 -right-4 h-64 w-44 opacity-95 sm:right-3 sm:w-52">
                        <div className="absolute inset-8 rounded-full bg-primary/35 blur-3xl" />
                        <Image
                          src="/anjo1-premium.webp"
                          alt=""
                          fill
                          sizes="13rem"
                          className="object-contain object-right-bottom drop-shadow-[0_0_18px_oklch(0.62_0.25_25_/_0.8)]"
                        />
                      </div>
                      <div className="relative flex min-h-44 max-w-[70%] flex-col justify-end p-5">
                        <span className="mb-2 text-[0.56rem] font-black uppercase tracking-[0.25em] text-primary">
                          {product?.category ?? "Produto 6DNX"}
                        </span>
                        <h2 className="max-w-sm text-2xl leading-none md:text-3xl">
                          {session.productTitle}
                        </h2>
                        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-white/55">
                          {session.variantName}
                        </p>
                      </div>
                    </div>

                    <dl className="grid sm:grid-cols-3">
                      <div className="border-b border-white/10 px-4 py-4 sm:border-b-0 sm:border-r">
                        <dt className="text-[0.52rem] uppercase tracking-[0.18em] text-muted">
                          Total teste
                        </dt>
                        <dd className="mt-1 text-xl font-black text-primary">
                          {session.testAmountLabel}
                        </dd>
                      </div>
                      <div className="border-b border-white/10 px-4 py-4 sm:border-b-0 sm:border-r">
                        <dt className="text-[0.52rem] uppercase tracking-[0.18em] text-muted">
                          Status
                        </dt>
                        <dd className="mt-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-emerald-300">
                          <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
                          Catálogo validado
                        </dd>
                      </div>
                      <div className="px-4 py-4">
                        <dt className="text-[0.52rem] uppercase tracking-[0.18em] text-muted">
                          Suporte
                        </dt>
                        <dd className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-white/75">
                          Ticket Discord
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    {[
                      "Preço validado no servidor",
                      "Status por webhook assinado",
                      "Atendimento pós-compra",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-2 border border-white/[0.07] bg-white/[0.025] px-3 py-3"
                      >
                        <span className="mt-1 text-primary">◆</span>
                        <span className="text-[0.62rem] leading-relaxed text-white/55">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <aside className="relative flex flex-col border-t border-white/10 bg-black/45 lg:border-l lg:border-t-0">
                <div className="border-b border-white/10 px-5 py-5 sm:px-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.55rem] font-black uppercase tracking-[0.22em] text-primary">
                        Forma de pagamento
                      </p>
                      <h2 className="mt-1 text-2xl">Finalize o teste</h2>
                    </div>
                    <span
                      className={`border px-2.5 py-1 text-[0.52rem] font-black uppercase tracking-[0.15em] ${
                        session.status === "approved"
                          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                          : "border-white/10 bg-white/[0.04] text-muted"
                      }`}
                    >
                      {session.status === "approved"
                        ? "Aprovado"
                        : "Aguardando"}
                    </span>
                  </div>
                </div>

                <div className="flex-1 p-5 sm:p-7">
                  <fieldset disabled={session.status === "approved"}>
                    <legend className="sr-only">
                      Forma de pagamento de laboratório
                    </legend>
                    <div className="mb-7 grid grid-cols-2 gap-2">
                      {(
                        [
                          [
                            "pix",
                            "PIX",
                            "StorM Wallet",
                            "instantâneo",
                          ],
                          [
                            "card",
                            "Cartão",
                            "Provedor futuro",
                            "laboratório",
                          ],
                        ] as const
                      ).map(([value, label, provider, detail]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setMethod(value)}
                          aria-pressed={method === value}
                          className={`relative min-h-24 overflow-hidden border p-3 text-left transition-all ${
                            method === value
                              ? "border-primary bg-primary/10 shadow-[inset_0_-2px_0_var(--primary),0_0_25px_var(--primary-glow)]"
                              : "border-white/10 bg-white/[0.025] hover:border-white/30"
                          }`}
                        >
                          <span className="block text-sm font-black">
                            {label}
                          </span>
                          <span className="mt-1 block text-[0.58rem] uppercase tracking-[0.12em] text-muted">
                            {provider}
                          </span>
                          <span className="absolute bottom-2 right-2 text-[0.48rem] uppercase tracking-[0.14em] text-white/30">
                            {detail}
                          </span>
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {method === "pix" ? (
                    <TestPix sessionId={session.id} />
                  ) : (
                    <div className="relative mx-auto aspect-[1.58/1] w-full max-w-xs overflow-hidden border border-primary/40 bg-[linear-gradient(135deg,oklch(0.22_0.06_25),oklch(0.07_0_0))] p-5 shadow-[0_0_55px_var(--primary-glow)]">
                      <div className="absolute -right-10 -top-16 size-40 rounded-full border border-primary/20" />
                      <div className="absolute -right-4 -top-10 size-28 rounded-full border border-primary/30" />
                      <span className="block text-[0.58rem] font-black uppercase tracking-[0.22em] text-primary">
                        6DNX test card
                      </span>
                      <span className="mt-12 block font-mono text-base tracking-[0.16em] text-white/70 sm:text-lg">
                        TEST •••• •••• 0000
                      </span>
                      <span className="absolute bottom-5 right-5 text-[0.5rem] uppercase tracking-[0.16em] text-muted">
                        cartão ilustrativo
                      </span>
                    </div>
                  )}

                  <div className="mx-auto mt-5 max-w-xs border-y border-white/10 py-3 text-center">
                    <p className="text-[0.58rem] uppercase tracking-[0.17em] text-muted">
                      Sessão reservada até
                    </p>
                    <p className="mt-1 font-mono text-lg font-bold text-white/80">
                      {formatExpiry(session.expiresAt)}
                    </p>
                  </div>

                  {message ? (
                    <p
                      role="status"
                      className={`mt-5 border px-4 py-3 text-xs leading-relaxed ${
                        session.ticketStatus === "sent"
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                          : "border-amber-500/40 bg-amber-500/10 text-amber-200"
                      }`}
                    >
                      {message}
                    </p>
                  ) : null}
                  {error ? (
                    <p
                      role="alert"
                      className="mt-5 border border-primary/40 bg-primary/10 px-4 py-3 text-xs text-red-200"
                    >
                      {error}
                    </p>
                  ) : null}
                </div>

                <div className="border-t border-white/10 p-5 sm:p-7">
                  <button
                    type="button"
                    onClick={completeTest}
                    disabled={submitting || session.ticketStatus === "sent"}
                    className="group relative flex min-h-14 w-full items-center justify-center overflow-hidden border border-primary bg-primary px-5 text-xs font-black uppercase tracking-[0.17em] text-white shadow-[0_0_35px_var(--primary-glow)] transition-all hover:-translate-y-0.5 hover:bg-transparent hover:text-primary disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <span className="relative z-10">
                      {submitting
                        ? "Processando simulação…"
                        : session.ticketStatus === "sent"
                          ? "Teste concluído"
                          : session.status === "approved"
                            ? "Reenviar TICKET de teste"
                            : `Aprovar ${
                                method === "pix" ? "PIX" : "cartão"
                              } de teste`}
                    </span>
                    <span className="absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-white/30 blur-md transition-transform duration-700 group-hover:translate-x-[500%]" />
                  </button>

                  <p className="mt-3 text-center text-[0.56rem] leading-relaxed text-white/35">
                    Nenhum valor real será movimentado nesta versão.
                  </p>
                  <Link
                    href="/#produtos"
                    className="mt-3 flex min-h-10 items-center justify-center text-[0.58rem] font-bold uppercase tracking-[0.18em] text-muted transition-colors hover:text-white"
                  >
                    ← Voltar à vitrine
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
