import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getAdminSession } from "@/lib/admin/auth";
import { hasBrowserSupabaseConfig } from "@/lib/supabase/config";

const reasonMessages: Record<string, string> = {
  forbidden:
    "Esta conta está autenticada, mas ainda não possui permissão de administrador.",
  unauthenticated: "Sua sessão expirou. Entre novamente.",
  "not-configured":
    "O Supabase Auth ainda não está configurado neste ambiente.",
};

export default async function AdminLoginPage(
  props: PageProps<"/admin/login">,
) {
  const session = await getAdminSession();
  if (session.ok) redirect("/admin");

  const searchParams = await props.searchParams;
  const reason =
    typeof searchParams.reason === "string" ? searchParams.reason : "";

  return (
    <main className="admin-login">
      <div className="admin-login__ambient" aria-hidden />
      <Link className="admin-login__back" href="/">
        <span aria-hidden>←</span> Voltar ao site
      </Link>
      <section className="admin-login__stage">
        <div className="admin-login__brand">
          <span className="admin-kicker">6DORME NOIS XITA</span>
          <h2>
            Uma vitrine viva,
            <br />
            sob seu controle.
          </h2>
          <p>
            Edite produtos com segurança, visualize antes de publicar e
            recupere versões anteriores quando precisar.
          </p>
          <div className="admin-login__status">
            <i aria-hidden />
            Área administrativa isolada do site público
          </div>
        </div>
        <AdminLoginForm
          configured={hasBrowserSupabaseConfig()}
          initialMessage={reasonMessages[reason]}
        />
      </section>
    </main>
  );
}
