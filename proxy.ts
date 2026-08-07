import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { shouldProtectSiteReview } from "@/lib/security/review-mode";
import { isSocialPreviewImagePath } from "@/lib/security/social-preview";
import { refreshSupabaseSession } from "@/lib/supabase/proxy";

const MIN_REVIEW_PASSWORD_LENGTH = 16;
const ROBOTS_POLICY = "noindex, nofollow, noarchive, nosnippet";

/**
 * Public, indexable routes. Everything else keeps X-Robots-Tag: noindex so the
 * private/admin/account/checkout surfaces never leak into search engines.
 * Extend this list as new public landing pages (e.g. /produtos/[slug]) are
 * released; do not widen it to private routes.
 */
function isPublicIndexablePath(pathname: string) {
  return (
    pathname === "/" ||
    pathname.startsWith("/noticias") ||
    pathname.startsWith("/produtos")
  );
}

function applySecurityHeaders(
  response: NextResponse,
  request: NextRequest,
  privateReview = false,
) {
  const socialPreviewImage = isSocialPreviewImagePath(
    request.nextUrl.pathname,
  );

  const indexable = socialPreviewImage || isPublicIndexablePath(
    request.nextUrl.pathname,
  );
  if (indexable) {
    response.headers.delete("X-Robots-Tag");
  } else {
    response.headers.set("X-Robots-Tag", ROBOTS_POLICY);
  }
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), geolocation=(), microphone=()",
  );
  response.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
  response.headers.set(
    "Cross-Origin-Resource-Policy",
    socialPreviewImage ? "cross-origin" : "same-origin",
  );

  if (request.nextUrl.protocol === "https:") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000");
  }
  if (privateReview) {
    response.headers.set("Cache-Control", "private, no-store");
  }

  return response;
}

function isServerToServerRoute(pathname: string) {
  return (
    pathname === "/robots.txt" ||
    pathname.startsWith("/api/cron/") ||
    pathname.startsWith("/api/webhooks/")
  );
}

function safeEqual(value: string, expected: string) {
  const valueBuffer = Buffer.from(value, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  return (
    valueBuffer.length === expectedBuffer.length &&
    timingSafeEqual(valueBuffer, expectedBuffer)
  );
}

function readBasicCredentials(header: string | null) {
  if (!header?.startsWith("Basic ")) return null;

  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator < 0) return null;

    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

function restrictedResponse(
  request: NextRequest,
  status: 401 | 503,
  message: string,
) {
  const response = new NextResponse(
    `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow,noarchive">
    <title>6DNX — ambiente de revisão</title>
    <style>
      :root { color-scheme: dark; font-family: system-ui, sans-serif; }
      body { min-height: 100vh; margin: 0; display: grid; place-items: center; background: #050203; color: #f7f3f4; }
      main { width: min(32rem, calc(100% - 3rem)); border: 1px solid #5f101d; padding: 2rem; background: #0c0708; box-shadow: 0 0 4rem rgb(155 18 39 / 18%); }
      small { color: #e3062c; letter-spacing: .22em; text-transform: uppercase; }
      h1 { margin: .8rem 0; font-size: clamp(1.8rem, 6vw, 3rem); }
      p { color: #b9afb2; line-height: 1.65; }
    </style>
  </head>
  <body>
    <main>
      <small>6DNX // acesso controlado</small>
      <h1>Ambiente de revisão</h1>
      <p>${message}</p>
    </main>
  </body>
</html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        ...(status === 401
          ? { "WWW-Authenticate": 'Basic realm="6DNX Review", charset="UTF-8"' }
          : {}),
      },
    },
  );

  return applySecurityHeaders(response, request, true);
}

function usesAdminSession(pathname: string) {
  return pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin/");
}

async function nextResponse(request: NextRequest) {
  return usesAdminSession(request.nextUrl.pathname)
    ? refreshSupabaseSession(request)
    : NextResponse.next();
}

export async function proxy(request: NextRequest) {
  const configuredReviewMode = process.env.SITE_REVIEW_ENABLED;
  const reviewEnabled = shouldProtectSiteReview(
    configuredReviewMode,
    process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV),
  );

  if (!reviewEnabled || isServerToServerRoute(request.nextUrl.pathname)) {
    return applySecurityHeaders(await nextResponse(request), request);
  }

  const expectedUsername = process.env.SITE_REVIEW_USER?.trim() || "6dnx";
  const expectedPassword = process.env.SITE_REVIEW_PASSWORD || "";

  if (expectedPassword.length < MIN_REVIEW_PASSWORD_LENGTH) {
    return restrictedResponse(
      request,
      503,
      "A proteção está ativa, mas a senha segura ainda não foi configurada.",
    );
  }

  const credentials = readBasicCredentials(
    request.headers.get("authorization"),
  );
  const authenticated =
    credentials !== null &&
    safeEqual(credentials.username, expectedUsername) &&
    safeEqual(credentials.password, expectedPassword);

  if (!authenticated) {
    return restrictedResponse(
      request,
      401,
      "Informe as credenciais fornecidas pelo responsável para continuar.",
    );
  }

  return applySecurityHeaders(await nextResponse(request), request, true);
}
