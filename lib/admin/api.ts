import type { NextRequest } from "next/server";
import { isTrustedMutationOrigin } from "@/lib/security/request-origin";

export function noStoreJson(payload: unknown, status = 200) {
  return Response.json(payload, {
    status,
    headers: { "cache-control": "private, no-store" },
  });
}

export function rejectCrossOriginMutation(request: NextRequest) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (!isTrustedMutationOrigin(origin, fetchSite, request.nextUrl.origin)) {
    return noStoreJson({ error: "Origem da solicitação inválida." }, 403);
  }
  return null;
}

export function databaseErrorResponse(error: {
  code?: string;
  message?: string;
}) {
  const duplicate = error.code === "23505";
  const catalogInvalid = error.code === "CATALOG_INVALID";
  const schemaMissing =
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.message?.includes("product_catalog");

  return noStoreJson(
    {
      error: duplicate
        ? "Já existe um produto com essa rota."
        : catalogInvalid
          ? "O catálogo atual contém um campo incompatível. Corrija a fonte antes de importar; nenhum card foi gravado."
        : schemaMissing
          ? "O banco do painel ainda não foi preparado. Revise e aplique a migração documentada."
          : "O Supabase recusou a alteração. Nenhum dado foi perdido.",
      code: duplicate
        ? "duplicate-slug"
        : catalogInvalid
          ? "catalog-invalid"
        : schemaMissing
          ? "schema-missing"
          : "database-error",
    },
    duplicate ? 409 : catalogInvalid ? 422 : 503,
  );
}
