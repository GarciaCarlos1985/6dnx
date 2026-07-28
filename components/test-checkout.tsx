"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PaymentMethod = "pix" | "card";

type CheckoutSession = {
  id: string;
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
    <div className="relative mx-auto aspect-square w-44 border border-primary/40 bg-white p-3 shadow-[0_0_45px_var(--primary-glow)]">
      <div className="grid h-full w-full grid-cols-[repeat(13,minmax(0,1fr))]">
        {cells.map((active, index) => (
          <span
            // This is intentionally decorative and cannot be scanned or paid.
            key={index}
            className={active ? "bg-black" : "bg-white"}
          />
        ))}
      </div>
      <span className="absolute inset-x-3 top-1/2 -translate-y-1/2 bg-primary py-1 text-center text-[0.56rem] font-black uppercase tracking-[0.18em] text-white">
        QR ilustrativo · teste
      </span>
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
        if (payload.session.paymentMethod) setMethod(payload.session.paymentMethod);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
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
    <main className="relative min-h-screen overflow-hidden bg-bg px-4 py-8 text-ink md:px-8 md:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,var(--primary-glow),transparent_28%),radial-gradient(circle_at_16%_82%,oklch(0.35_0.15_25_/_0.22),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(oklch(1_0_0_/_0.025)_1px,transparent_1px),linear-gradient(90deg,oklch(1_0_0_/_0.025)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="relative mx-auto max-w-5xl">
        <nav className="mb-8 flex items-center justify-between">
          <Link
            href="/#produtos"
            className="font-display text-2xl tracking-[-0.06em] transition-colors hover:text-primary"
          >
            6DNX
          </Link>
          <span className="border border-primary/50 bg-primary/10 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.2em] text-primary">
            Checkout Lab · sem cobrança
          </span>
        </nav>

        {loading ? (
          <div className="min-h-[34rem] animate-pulse border border-white/10 bg-white/[0.025]" />
        ) : error && !session ? (
          <section className="border border-primary/40 bg-surface/95 p-8 text-center shadow-[0_0_60px_var(--primary-glow)]">
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
          <div className="grid overflow-hidden border border-white/10 bg-surface/95 shadow-[0_0_80px_oklch(0.4_0.16_25_/_0.22)] lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.72fr)]">
            <section className="p-6 md:p-10" aria-labelledby="checkout-heading">
              <p className="mb-3 text-[0.64rem] font-black uppercase tracking-[0.25em] text-primary">
                Ambiente isolado // pedido TESTE
              </p>
              <h1
                id="checkout-heading"
                className="mb-8 text-[clamp(2.4rem,7vw,5rem)] leading-[0.9] tracking-[-0.055em]"
              >
                Simular
                <br />
                pagamento
              </h1>

              <dl className="mb-8 divide-y divide-white/10 border-y border-white/10">
                <div className="grid grid-cols-[7rem_1fr] gap-4 py-4">
                  <dt className="text-xs uppercase tracking-[0.16em] text-muted">
                    Produto
                  </dt>
                  <dd className="font-bold">{session.productTitle}</dd>
                </div>
                <div className="grid grid-cols-[7rem_1fr] gap-4 py-4">
                  <dt className="text-xs uppercase tracking-[0.16em] text-muted">
                    Variação
                  </dt>
                  <dd className="font-bold">{session.variantName}</dd>
                </div>
                <div className="grid grid-cols-[7rem_1fr] gap-4 py-4">
                  <dt className="text-xs uppercase tracking-[0.16em] text-muted">
                    Total
                  </dt>
                  <dd>
                    <span className="text-2xl font-black text-primary">
                      {session.testAmountLabel}
                    </span>
                    <span className="ml-2 text-xs uppercase tracking-wider text-muted">
                      simulado
                    </span>
                  </dd>
                </div>
              </dl>

              <fieldset disabled={session.status === "approved"}>
                <legend className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted">
                  Forma de pagamento de laboratório
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["pix", "Pix simulado", "QR ilustrativo, sem transação"],
                      ["card", "Cartão de teste", "Sem pedir número ou documento"],
                    ] as const
                  ).map(([value, label, detail]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMethod(value)}
                      aria-pressed={method === value}
                      className={`min-h-24 border p-4 text-left transition-colors ${
                        method === value
                          ? "border-primary bg-primary/10"
                          : "border-white/10 bg-black/20 hover:border-white/30"
                      }`}
                    >
                      <span className="mb-1 block font-bold">{label}</span>
                      <span className="block text-xs leading-relaxed text-muted">
                        {detail}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <p className="mt-5 text-xs leading-relaxed text-muted">
                Esta tela não usa gateway bancário, não coleta cartão, CPF ou
                endereço e não movimenta dinheiro. Serve somente para validar o
                fluxo do produto até o canal TICKET.
              </p>
            </section>

            <aside className="flex flex-col justify-between border-t border-white/10 bg-black/30 p-6 lg:border-l lg:border-t-0 md:p-9">
              <div>
                {method === "pix" ? (
                  <TestPix sessionId={session.id} />
                ) : (
                  <div className="relative mx-auto aspect-[1.58/1] w-full max-w-xs overflow-hidden border border-primary/40 bg-[linear-gradient(135deg,oklch(0.19_0.03_25),oklch(0.08_0_0))] p-5 shadow-[0_0_45px_var(--primary-glow)]">
                    <span className="block text-[0.58rem] font-black uppercase tracking-[0.22em] text-primary">
                      6DNX test card
                    </span>
                    <span className="mt-12 block font-mono text-lg tracking-[0.18em] text-white/70">
                      TEST •••• •••• 0000
                    </span>
                    <span className="absolute bottom-5 right-5 text-[0.58rem] uppercase tracking-[0.16em] text-muted">
                      não é um cartão real
                    </span>
                  </div>
                )}
                <p className="mt-5 text-center text-[0.68rem] uppercase tracking-[0.16em] text-muted">
                  Sessão expira às {formatExpiry(session.expiresAt)}
                </p>
              </div>

              <div className="mt-8">
                {message ? (
                  <p
                    role="status"
                    className={`mb-4 border px-4 py-3 text-sm leading-relaxed ${
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
                    className="mb-4 border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-red-200"
                  >
                    {error}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={completeTest}
                  disabled={submitting || session.ticketStatus === "sent"}
                  className="flex min-h-12 w-full items-center justify-center border border-primary bg-primary px-5 text-xs font-black uppercase tracking-[0.16em] transition-colors hover:bg-transparent hover:text-primary disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {submitting
                    ? "Processando simulação…"
                    : session.ticketStatus === "sent"
                      ? "Teste concluído"
                      : session.status === "approved"
                        ? "Reenviar TICKET de teste"
                        : `Aprovar ${method === "pix" ? "Pix" : "cartão"} de teste`}
                </button>
                <Link
                  href="/#produtos"
                  className="mt-3 flex min-h-11 items-center justify-center text-xs font-bold uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
                >
                  Voltar à vitrine
                </Link>
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </main>
  );
}
