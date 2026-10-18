import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAccountDatabaseConfig } from "@/lib/account/config";
import {
  AccountDatabaseError,
  AccountRepository,
} from "@/lib/account/repository";
import { ORDER_ID_PATTERN } from "@/lib/guides/access";
import { GuideReader } from "@/components/guide-reader";
import "@/app/produtos/products.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Guia da sua compra",
  robots: { index: false, follow: false },
};

function GuideMessage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="solution-page guide-message">
      <Link href="/conta" className="solution-back">
        Voltar à minha conta
      </Link>
      <h1>{title}</h1>
      <div className="solution-prose">{children}</div>
    </main>
  );
}

export default async function PurchasedGuidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!ORDER_ID_PATTERN.test(id)) notFound();
  const supabase = await createSupabaseServerClient();
  const config = getAccountDatabaseConfig();
  if (!supabase || !config)
    return (
      <GuideMessage title="Sua orientação estará aqui.">
        <p>
          A central está temporariamente indisponível. Tente novamente em alguns
          instantes.
        </p>
      </GuideMessage>
    );
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user)
    return (
      <GuideMessage title="Entre para acessar sua orientação.">
        <p>
          Use a mesma conta da compra para abrir o guia correspondente ao seu
          pedido.
        </p>
        <Link
          className="solution-primary"
          href={`/conta?retorno=${encodeURIComponent(`/conta/pedidos/${id}/guia`)}`}
        >
          Entrar na minha conta
        </Link>
      </GuideMessage>
    );
  const result = await new AccountRepository(config)
    .getPurchasedGuide(data.user.id, id)
    .catch((error) => {
      if (!(error instanceof AccountDatabaseError)) throw error;
      return null;
    });
  if (!result)
    return (
      <GuideMessage title="Não foi possível abrir a orientação.">
        <p>
          Seus pedidos estão preservados. Recarregue esta página ou procure o
          suporte se a indisponibilidade continuar.
        </p>
      </GuideMessage>
    );
  if (result.state === "not-found") notFound();
  if (result.state === "payment-pending")
    return (
      <GuideMessage title="O guia acompanha uma compra confirmada.">
        <p>
          O estado atual deste pedido ainda não permite acesso à orientação.
          Confira o pagamento na sua conta.
        </p>
      </GuideMessage>
    );
  if (result.state === "preparing")
    return (
      <GuideMessage title="A orientação desta solução está em preparação.">
        <p>
          Seu pedido continua na sua conta. A equipe está preparando o material
          correspondente a {result.order.productTitle}.
        </p>
        <a
          className="solution-primary"
          href="/api/redirect"
          target="_blank"
          rel="noreferrer"
        >
          Pedir orientação ao suporte
        </a>
      </GuideMessage>
    );
  return (
    <main className="solution-page purchased-guide">
      <Link href="/conta" className="solution-back">
        Voltar às minhas compras
      </Link>
      <header className="guide-purchase-heading">
        <div>
          <h1>{result.guide.title}</h1>
          <p>
            {result.order.productTitle} · {result.order.variantName}
          </p>
        </div>
        <span className="solution-status">Compra confirmada</span>
      </header>
      <GuideReader guide={result.guide} />
    </main>
  );
}
