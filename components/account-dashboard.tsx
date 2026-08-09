"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DiscordMark } from "@/components/discord-mark";
import { SiteAtmosphere } from "@/components/site-atmosphere";
import type { ExperienceStyle } from "@/lib/site-experience/presentation";
import type {
  AccountExperienceContent,
  ExperienceEffects,
} from "@/lib/site-experience/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AccountOrder = {
  id: string;
  externalId: string;
  productTitle: string;
  variantName: string;
  amountCents: number;
  status: string;
  createdAt: string;
};

type AccountData = {
  user: { id: string; email: string | null; name: string };
  balance: number | null;
  wallets?: { slot: number | null; community: number | null };
  loyalty?: { available: boolean; status: "ready" | "preparing" };
  orders: AccountOrder[];
};

type AccountState =
  | { status: "loading" }
  | { status: "anon" }
  | { status: "error"; message: string }
  | { status: "ready"; data: AccountData };

async function fetchAccountState(signal?: AbortSignal): Promise<AccountState | null> {
  try {
    const response = await fetch("/api/account", {
      cache: "no-store",
      signal,
    });
    if (response.status === 401) return { status: "anon" };
    if (!response.ok) {
      return {
        status: "error",
        message: "Sua central está temporariamente indisponível.",
      };
    }
    const data = (await response.json()) as AccountData;
    return { status: "ready", data };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return null;
    return {
      status: "error",
      message: "Não foi possível sincronizar sua conta.",
    };
  }
}

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Aguardando pagamento",
  paid: "Pagamento confirmado",
  awaiting_discord_fulfillment: "Aguardando entrega",
  delivered_manually: "Entregue",
  failed: "Falhou",
  cancelled: "Cancelado",
  expired: "Expirado",
  refunded: "Reembolsado",
  disputed: "Em análise",
  payment_creation_failed: "Pagamento não criado",
  draft: "Rascunho",
};

const COMPLETED_ORDER_STATES = new Set([
  "paid",
  "awaiting_discord_fulfillment",
  "delivered_manually",
]);

function formatBRL(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function AccountIcon({ name }: { name: "coins" | "orders" | "shield" }) {
  if (name === "coins") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <ellipse cx="12" cy="6" rx="7" ry="3" />
        <path d="M5 6v5c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 11v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
      </svg>
    );
  }

  if (name === "orders") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 3 5 6v5c0 4.4 2.8 8 7 10 4.2-2 7-5.6 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-5" />
    </svg>
  );
}

export function AccountDashboard({
  content,
  effects,
  themeStyle,
}: {
  content: AccountExperienceContent;
  effects: ExperienceEffects;
  themeStyle: ExperienceStyle;
}) {
  const router = useRouter();
  const [state, setState] = useState<AccountState>({ status: "loading" });
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetchAccountState(controller.signal).then((nextState) => {
      if (nextState) setState(nextState);
    });
    return () => controller.abort();
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
    <main className="account-page" style={themeStyle}>
      <SiteAtmosphere effects={effects} />
      <div className="account-page__ambient" aria-hidden />
      <div className="account-page__orb account-page__orb--one" aria-hidden />
      <div className="account-page__orb account-page__orb--two" aria-hidden />

      <header className="account-header">
        <Link className="account-header__brand" href="/">
          <span className="account-header__brand-mark">6</span>
          <span>
            <strong>6DNX</strong>
            <small>{content.navigationLabel}</small>
          </span>
        </Link>
        <nav className="account-header__nav" aria-label="Atalhos da conta">
          <Link href="/#produtos">Catálogo</Link>
          <Link href="/slot">Slot 6DNX</Link>
          <a
            className="account-header__support"
            href="/api/redirect"
            target="_blank"
            rel="noreferrer"
          >
            <DiscordMark className="account-header__support-icon" />
            Suporte
          </a>
          <Link href="/">Voltar ao site</Link>
        </nav>
      </header>

      <section className="account-stage" aria-live="polite">
        {state.status === "loading" ? <AccountLoading /> : null}
        {state.status === "anon" ? <AnonymousAccount content={content} /> : null}
        {state.status === "error" ? (
          <AccountError
            message={state.message}
            onRetry={() => {
              setState({ status: "loading" });
              void fetchAccountState().then((nextState) => {
                if (nextState) setState(nextState);
              });
            }}
          />
        ) : null}
        {state.status === "ready" ? (
          <AccountHome
            data={state.data}
            content={content}
            onSignOut={handleSignOut}
            signingOut={signingOut}
          />
        ) : null}
      </section>
    </main>
  );
}

function AccountLoading() {
  return (
    <div className="account-loading" aria-busy="true">
      <span className="account-loading__crest">6</span>
      <div>
        <strong>Preparando sua central</strong>
        <p>Sincronizando identidade, pedidos e benefícios.</p>
      </div>
      <span className="account-loading__line" aria-hidden />
    </div>
  );
}

function AnonymousAccount({ content }: { content: AccountExperienceContent }) {
  return (
    <section className="account-state-card">
      <div className="account-state-card__copy">
        <span className="account-kicker">{content.anonymousEyebrow}</span>
        <h1>{content.anonymousTitle}</h1>
        <p>{content.anonymousSupport}</p>
        <div className="account-actions">
          <Link className="account-primary-button" href="/#inicio">
            Entrar com Google ou Discord
          </Link>
          <Link className="account-secondary-button" href="/#produtos">
            Continuar sem login
          </Link>
        </div>
      </div>
      <div className="account-state-card__visual" aria-hidden>
        <Image
          src="/slot/dragon-idle-v2.png"
          alt=""
          width={768}
          height={768}
          loading="eager"
          sizes="(max-width: 760px) 70vw, 360px"
        />
      </div>
    </section>
  );
}

function AccountError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className="account-state-card account-state-card--error">
      <div className="account-state-card__copy">
        <span className="account-kicker">Conexão protegida</span>
        <h1>{message}</h1>
        <p>
          Seus dados e pedidos não foram apagados. Esta tela interrompe a
          exibição quando não consegue confirmar a sessão com segurança.
        </p>
        <div className="account-actions">
          <button className="account-primary-button" type="button" onClick={onRetry}>
            Tentar novamente
          </button>
          <Link className="account-secondary-button" href="/">
            Voltar à loja
          </Link>
        </div>
      </div>
      <div className="account-status-orbit" aria-hidden>
        <span>6</span>
      </div>
    </section>
  );
}

function AccountHome({
  data,
  content,
  onSignOut,
  signingOut,
}: {
  data: AccountData;
  content: AccountExperienceContent;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  const completedOrders = useMemo(
    () => data.orders.filter((order) => COMPLETED_ORDER_STATES.has(order.status)),
    [data.orders],
  );
  const totalSpent = useMemo(
    () => completedOrders.reduce((sum, order) => sum + order.amountCents, 0),
    [completedOrders],
  );
  const firstName = data.user.name.trim().split(/\s+/)[0] || "Jogador";
  const initial = firstName.charAt(0).toUpperCase();
  const slotBalance = data.wallets?.slot ?? data.balance;
  const communityBalance = data.wallets?.community ?? null;

  return (
    <>
      <section className="account-profile-hero">
        <div className="account-profile-hero__identity">
          <span className="account-avatar" aria-hidden>{initial}</span>
          <div>
            <span className="account-kicker">Conta conectada e protegida</span>
            <h1>Olá, {firstName}.</h1>
            <p>{data.user.email ?? "Identidade social conectada"}</p>
          </div>
        </div>
        <div className="account-profile-hero__actions">
          <Link className="account-primary-button" href="/slot">
            Conhecer o Slot 6DNX
          </Link>
          <button
            type="button"
            className="account-secondary-button"
            onClick={onSignOut}
            disabled={signingOut}
          >
            {signingOut ? "Saindo…" : "Sair da conta"}
          </button>
        </div>
      </section>

      <section className="account-metrics" aria-label="Resumo da conta">
        <article className="account-metric account-metric--community">
          <span className="account-metric__icon"><AccountIcon name="coins" /></span>
          <div>
            <span className="account-metric__label">6DNX Coins</span>
            <strong>{communityBalance === null ? "Em preparação" : communityBalance.toLocaleString("pt-BR")}</strong>
            <p>{communityBalance === null ? "A carteira da comunidade ainda não foi homologada." : "Use nas trocas assistidas pelo ticket 6DNX."}</p>
          </div>
        </article>
        <article className="account-metric account-metric--gold">
          <span className="account-metric__icon"><AccountIcon name="coins" /></span>
          <div>
            <span className="account-metric__label">Moedas da Slot</span>
            <strong>{slotBalance === null ? "Em preparação" : slotBalance.toLocaleString("pt-BR")}</strong>
            <p>{slotBalance === null ? "O saldo será exibido quando a carteira da Slot for homologada." : "Saldo fechado e exclusivo das experiências 6DNX."}</p>
          </div>
        </article>
        <article className="account-metric">
          <span className="account-metric__icon"><AccountIcon name="orders" /></span>
          <div>
            <span className="account-metric__label">Compras confirmadas</span>
            <strong>{completedOrders.length}</strong>
            <p>Pedidos pagos ou já encaminhados para entrega.</p>
          </div>
        </article>
        <article className="account-metric">
          <span className="account-metric__icon"><AccountIcon name="shield" /></span>
          <div>
            <span className="account-metric__label">Histórico confirmado</span>
            <strong>{formatBRL(totalSpent)}</strong>
            <p>Somente pagamentos associados a esta conta.</p>
          </div>
        </article>
      </section>

      <section className="account-content-grid">
        <article className="account-panel account-panel--journey">
          <div className="account-panel__heading">
            <div>
              <span className="account-kicker">{content.journeyEyebrow}</span>
              <h2>{content.journeyTitle}</h2>
            </div>
            <span className="account-pill">Evolução segura</span>
          </div>
          <ol className="account-journey">
            <li className="account-journey__item account-journey__item--active">
              <span>01</span>
              <div><strong>Identidade conectada</strong><p>Google ou Discord protegem o acesso ao seu histórico.</p></div>
            </li>
            <li className="account-journey__item">
              <span>02</span>
              <div><strong>Compre enquanto estiver logado</strong><p>Novos pedidos podem ser ligados automaticamente à sua conta.</p></div>
            </li>
            <li className="account-journey__item">
              <span>03</span>
              <div><strong>Ganhe recompensas separadas</strong><p>6DNX Coins e Moedas da Slot possuem saldos e usos independentes.</p></div>
            </li>
            <li className="account-journey__item">
              <span>04</span>
              <div><strong>Acesse experiências 6DNX</strong><p>Slot, missões e recompensas serão liberados por etapas.</p></div>
            </li>
          </ol>
        </article>

        <article className="account-panel account-slot-card">
          <div className="account-slot-card__image">
            <Image
              src="/slot/dragon-excited-v2.png"
              alt="Dragão mascote do Slot 6DNX"
              fill
              loading="eager"
              sizes="(max-width: 900px) 90vw, 360px"
            />
          </div>
          <div className="account-slot-card__copy">
            <span className="account-kicker">{content.slotCardEyebrow}</span>
            <h2>{content.slotCardTitle}</h2>
            <p>
              Uma experiência de fidelidade com moeda interna, resultado
              decidido no servidor e recompensas assistidas pelo Discord.
            </p>
            <Link className="account-primary-button" href="/slot">
              Abrir apresentação
            </Link>
          </div>
        </article>
      </section>

      <section className="account-panel account-orders-panel">
        <div className="account-panel__heading">
          <div>
            <span className="account-kicker">{content.ordersEyebrow}</span>
            <h2>{content.ordersTitle}</h2>
          </div>
          <span className="account-pill">{data.orders.length} registro{data.orders.length === 1 ? "" : "s"}</span>
        </div>
        {data.orders.length === 0 ? (
          <div className="account-empty-state">
            <span>Seu histórico está pronto para receber novas compras.</span>
            <p>
              Compras feitas antes do login permanecem anônimas. Entre na sua
              conta antes das próximas compras para acompanhá-las aqui.
            </p>
            <Link className="account-secondary-button" href="/#produtos">Explorar catálogo</Link>
          </div>
        ) : (
          <div className="account-orders">
            <div className="account-orders__row account-orders__row--head">
              <span>Produto</span><span>Valor</span><span>Status</span><span>Data</span>
            </div>
            {data.orders.map((order) => (
              <div className="account-orders__row" key={order.id}>
                <span className="account-orders__product">
                  <strong>{order.productTitle}</strong>
                  <small>{order.variantName} · #{order.externalId.slice(-8).toUpperCase()}</small>
                </span>
                <span className="account-orders__amount">{formatBRL(order.amountCents)}</span>
                <span><span className={`account-status account-status--${order.status}`}>{STATUS_LABEL[order.status] ?? order.status}</span></span>
                <span className="account-orders__date">{formatDate(order.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
