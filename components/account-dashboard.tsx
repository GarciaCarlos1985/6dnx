"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AccountData = {
  user: { id: string; email: string | null; name: string };
  balance: number | null;
  loyaltyAvailable: boolean;
  orders: Array<{
    id: string;
    externalId: string;
    productTitle: string;
    variantName: string;
    amountCents: number;
    status: string;
    createdAt: string;
  }>;
};

type AccountState =
  | { status: "loading" }
  | { status: "anon" }
  | { status: "error"; message: string }
  | { status: "ready"; data: AccountData };

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Aguardando pagamento",
  paid: "Pago",
  awaiting_discord_fulfillment: "Aguardando entrega",
  delivered_manually: "Entregue",
  failed: "Falhou",
  cancelled: "Cancelado",
  expired: "Expirado",
  refunded: "Reembolsado",
  disputed: "Disputa",
  payment_creation_failed: "Não foi possível criar o pagamento",
  draft: "Rascunho",
};

function formatBRL(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100);
}

function formatDate(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function AccountDashboard() {
  const router = useRouter();
  const [state, setState] = useState<AccountState>({ status: "loading" });
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/account", { cache: "no-store" });
        if (response.status === 401) {
          if (active) setState({ status: "anon" });
          return;
        }
        if (!response.ok) {
          if (active)
            setState({ status: "error", message: "Não foi possível carregar sua conta." });
          return;
        }
        const data = (await response.json()) as AccountData;
        if (active) setState({ status: "ready", data });
      } catch {
        if (active)
          setState({ status: "error", message: "Não foi possível carregar sua conta." });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.replace("/");
      router.refresh();
    } catch {
      setSigningOut(false);
    }
  }, [router]);

  return (
    <main className="account-page">
      <div className="account-page__ambient" aria-hidden />
      <header className="account-header">
        <Link className="account-header__brand" href="/">
          <strong>6DNX</strong>
          <span>Minha Conta</span>
        </Link>
        <Link className="account-header__home" href="/">
          ← Voltar ao site
        </Link>
      </header>

      <section className="account-stage">
        {state.status === "loading" ? (
          <div className="account-card account-card--center account-card--loading" aria-busy="true">
            <span className="account-loading__dot" />
            <span className="account-loading__dot" />
            <span className="account-loading__dot" />
          </div>
        ) : null}

        {state.status === "anon" ? (
          <div className="account-card account-card--center">
            <span className="admin-kicker">Acesso restrito // 6DNX</span>
            <h1>Entre para ver sua conta</h1>
            <p className="account-card__muted">
              Faça login com Google ou Discord para acessar seus pedidos, seu
              saldo de moedas e seus benefícios 6DNX.
            </p>
            <Link className="account-primary-button" href="/">
              Fazer login pelo site
            </Link>
          </div>
        ) : null}

        {state.status === "error" ? (
          <div className="account-card account-card--center">
            <span className="admin-kicker">Ops</span>
            <h1>{state.message}</h1>
            <p className="account-card__muted">Tente novamente em instantes.</p>
          </div>
        ) : null}

        {state.status === "ready" ? (
          <AccountHome
            data={state.data}
            onSignOut={handleSignOut}
            signingOut={signingOut}
          />
        ) : null}
      </section>
    </main>
  );
}

function AccountHome({
  data,
  onSignOut,
  signingOut,
}: {
  data: AccountData;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  const paidOrders = data.orders.filter((o) => o.status === "paid");
  const balance = data.balance;
  const loyaltyAvailable = data.loyaltyAvailable && balance !== null;

  return (
    <>
      <div className="account-welcome">
        <div>
          <span className="admin-kicker">Bem-vindo de volta</span>
          <h1>{data.user.name}</h1>
          <p className="account-card__muted">{data.user.email}</p>
        </div>
        <button
          type="button"
          className="account-ghost-button"
          onClick={onSignOut}
          disabled={signingOut}
        >
          {signingOut ? "Saindo…" : "Sair"}
        </button>
      </div>

      <div className="account-grid">
        <div className="account-card account-card--stat account-card--coins">
          <span className="account-card__label">Moedas 6DNX</span>
          <strong className="account-card__value">
            {loyaltyAvailable ? balance : "Em breve"}
          </strong>
          <span className="account-card__hint">
            {loyaltyAvailable
              ? "Seu saldo atual no programa de fidelidade."
              : "Seus pedidos continuam disponíveis enquanto preparamos o programa de moedas."}
          </span>
        </div>
        <div className="account-card account-card--stat">
          <span className="account-card__label">Pedidos pagos</span>
          <strong className="account-card__value">{paidOrders.length}</strong>
          <span className="account-card__hint">
            Suas compras concluídas na 6DNX.
          </span>
        </div>
      </div>

      <div className="account-card">
        <h2>Meus pedidos</h2>
        {data.orders.length === 0 ? (
          <p className="account-card__muted account-empty">
            Você ainda não tem pedidos ligados a esta conta. Compras feitas sem
            login ficam anônimas — entre antes de comprar para vincular seus
            próximos pedidos. O programa de moedas será ativado separadamente.
          </p>
        ) : (
          <div className="account-orders">
            <div className="account-orders__row account-orders__row--head">
              <span>Produto</span>
              <span>Valor</span>
              <span>Status</span>
              <span>Data</span>
            </div>
            {data.orders.map((order) => (
              <div className="account-orders__row" key={order.id}>
                <span className="account-orders__product">
                  {order.productTitle}
                  <small>{order.variantName}</small>
                </span>
                <span>{formatBRL(order.amountCents)}</span>
                <span>
                  <span
                    className={`account-status account-status--${order.status}`}
                  >
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </span>
                <span className="account-orders__date">
                  {formatDate(order.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
