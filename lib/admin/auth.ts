import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ClaimsRecord = Record<string, unknown>;

export type AdminSession = {
  supabase: SupabaseClient;
  user: {
    id: string;
    email: string;
    role: "admin";
  };
};

export type AdminAuthResult =
  | { ok: true; session: AdminSession }
  | {
      ok: false;
      reason: "not-configured" | "unauthenticated" | "forbidden";
    };

export async function getAdminSession(): Promise<AdminAuthResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "not-configured" };

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims as ClaimsRecord | undefined;
  if (error || !claims || typeof claims.sub !== "string") {
    return { ok: false, reason: "unauthenticated" };
  }

  const appMetadata = (
    claims.app_metadata && typeof claims.app_metadata === "object"
      ? claims.app_metadata
      : {}
  ) as ClaimsRecord;
  if (appMetadata.role !== "admin") {
    return { ok: false, reason: "forbidden" };
  }

  return {
    ok: true,
    session: {
      supabase,
      user: {
        id: claims.sub,
        email: typeof claims.email === "string" ? claims.email : "Administrador",
        role: "admin",
      },
    },
  };
}

export async function requireAdminPage() {
  const result = await getAdminSession();
  if (!result.ok) {
    const reason = encodeURIComponent(result.reason);
    redirect(`/admin/login?reason=${reason}`);
  }
  return result.session;
}

export async function requireAdminApi() {
  const result = await getAdminSession();
  if (result.ok) return result.session;

  return Response.json(
    {
      error:
        result.reason === "forbidden"
          ? "Esta conta não possui permissão de administrador."
          : result.reason === "not-configured"
            ? "Supabase Auth ainda não está configurado."
            : "Sessão administrativa inválida ou expirada.",
      code: result.reason,
    },
    {
      status: result.reason === "forbidden" ? 403 : 401,
      headers: { "cache-control": "no-store" },
    },
  );
}
