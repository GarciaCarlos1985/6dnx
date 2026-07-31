"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminLoginForm({
  configured,
  initialMessage,
}: {
  configured: boolean;
  initialMessage?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(initialMessage ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!configured || busy) return;
    setBusy(true);
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw new Error("E-mail ou senha inválidos.");

      const response = await fetch("/api/admin/session", {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        authenticated?: boolean;
        reason?: string;
      };
      if (!response.ok || !payload.authenticated) {
        await supabase.auth.signOut();
        throw new Error(
          payload.reason === "forbidden"
            ? "A conta existe, mas ainda não recebeu o papel de administrador."
            : "Não foi possível validar a sessão administrativa.",
        );
      }

      router.replace("/admin");
      router.refresh();
    } catch (reason) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : "Não foi possível entrar no painel.",
      );
      setBusy(false);
    }
  };

  return (
    <form className="admin-login-card" onSubmit={submit}>
      <div className="admin-login-card__signal" aria-hidden />
      <span className="admin-kicker">Acesso restrito // 6DNX</span>
      <h1>Central de comando</h1>
      <p className="admin-login-card__intro">
        Entre com a conta administrativa. O painel nunca solicita chaves do
        Supabase, Vercel ou Discord.
      </p>

      <label className="admin-field">
        <span>E-mail do administrador</span>
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@seudominio.com"
          disabled={!configured || busy}
          required
        />
      </label>

      <label className="admin-field">
        <span>Senha</span>
        <div className="admin-password-field">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Sua senha segura"
            disabled={!configured || busy}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </label>

      {!configured ? (
        <p className="admin-alert admin-alert--warning">
          A autenticação pública do Supabase ainda não está configurada neste
          ambiente. Consulte o guia de ativação em <code>docs/ADMIN.md</code>.
        </p>
      ) : null}
      {message ? (
        <p className="admin-alert admin-alert--error" role="alert">
          {message}
        </p>
      ) : null}

      <button
        className="admin-primary-button admin-primary-button--wide"
        type="submit"
        disabled={!configured || busy}
      >
        <span>{busy ? "Validando acesso…" : "Entrar com segurança"}</span>
        <b aria-hidden>→</b>
      </button>

      <div className="admin-login-card__trust">
        <span>01</span>
        <p>
          <strong>Sessão protegida</strong>
          <small>Cookies seguros e autorização no servidor</small>
        </p>
        <span>02</span>
        <p>
          <strong>Cadastro não concede acesso</strong>
          <small>Só o papel de administrador libera o painel</small>
        </p>
      </div>
    </form>
  );
}
