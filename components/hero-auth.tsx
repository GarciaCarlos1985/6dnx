"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { DiscordMark } from "@/components/discord-mark";

function GoogleMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.28V6.63H1.29A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.29 5.37l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.23 0 12 0A11.99 11.99 0 0 0 1.29 6.63l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authed"; name: string };

export function HeroAuth() {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;

        if (error) {
          setState({ status: "anonymous" });
          return;
        }

        const user = data.session?.user;
        if (user) {
          const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
          const name =
            (typeof meta.full_name === "string" && meta.full_name) ||
            (typeof meta.name === "string" && meta.name) ||
            (typeof meta.preferred_username === "string" &&
              meta.preferred_username) ||
            user.email?.split("@")[0] ||
            "Visitante";
          setState({ status: "authed", name });
        } else {
          setState({ status: "anonymous" });
        }
      } catch {
        if (active) setState({ status: "anonymous" });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const signIn = async (provider: "google" | "discord") => {
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError("Não foi possível iniciar o login. Tente novamente.");
      }
    } catch {
      setError("Não foi possível iniciar o login. Tente novamente.");
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      setState({ status: "anonymous" });
    } catch {
      setError("Não foi possível sair. Tente novamente.");
    }
  };

  if (state.status === "loading") {
    return (
      <div className="hero-auth hero-auth--loading" aria-busy="true">
        <span className="hero-auth__dot" />
        <span className="hero-auth__dot" />
        <span className="hero-auth__dot" />
      </div>
    );
  }

  if (state.status === "authed") {
    return (
      <div className="hero-auth hero-auth--authed">
        <span className="hero-auth__welcome">
          Olá, <strong>{state.name}</strong>
        </span>
        <button
          type="button"
          className="hero-auth__ghost"
          onClick={signOut}
        >
          Sair
        </button>
      </div>
    );
  }

  return (
    <div className="hero-auth">
      <span className="hero-auth__label">Entrar com</span>
      <div className="hero-auth__buttons">
        <button
          type="button"
          className="hero-auth__button hero-auth__button--google"
          onClick={() => signIn("google")}
        >
          <GoogleMark className="hero-auth__icon" />
          <span>Google</span>
        </button>
        <button
          type="button"
          className="hero-auth__button hero-auth__button--discord"
          onClick={() => signIn("discord")}
        >
          <DiscordMark className="hero-auth__icon" />
          <span>Discord</span>
        </button>
      </div>
      {error ? (
        <span className="hero-auth__error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
