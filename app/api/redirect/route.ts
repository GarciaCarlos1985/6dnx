import { NextRequest, NextResponse } from "next/server";
import { notifyDiscordLead } from "@/lib/discord-notifications";
import {
  BoundedJsonError,
  readBoundedJson,
} from "@/lib/http/read-bounded-json";
import { products } from "@/lib/products";

const FALLBACK_INVITE = "https://discord.gg/6dnx";
const MAX_BODY_BYTES = 1_024;

type Selection = {
  slug: string;
  variant?: string;
};

function discordInvite() {
  const configured = process.env.DISCORD_INVITE_URL;
  if (!configured) return FALLBACK_INVITE;

  try {
    const url = new URL(configured);
    const allowedHosts = new Set(["discord.gg", "discord.com", "www.discord.com"]);
    return url.protocol === "https:" && allowedHosts.has(url.hostname)
      ? url.toString()
      : FALLBACK_INVITE;
  } catch {
    return FALLBACK_INVITE;
  }
}

function findSelection(slug: string | null, variantName?: string | null) {
  const product = products.find((item) => item.slug === slug);
  if (!product) return null;
  const variant = variantName
    ? product.variants.find((item) => item.name === variantName)
    : undefined;
  return { product, variant };
}

/**
 * Compatibility navigation: GET only redirects. Keeping side effects out of
 * GET prevents link previewers, crawlers and browser prefetch from announcing
 * customers that never clicked the purchase action.
 */
export function GET(request: NextRequest) {
  const selection = findSelection(request.nextUrl.searchParams.get("slug"));
  return NextResponse.redirect(
    selection ? discordInvite() : new URL("/", request.url).toString(),
  );
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return Response.json({ error: "Origem inválida" }, { status: 403 });
  }

  let payload: Selection;
  try {
    payload = await readBoundedJson<Selection>(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof BoundedJsonError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  if (typeof payload.slug !== "string" || payload.slug.length > 80) {
    return Response.json({ error: "Produto inválido" }, { status: 400 });
  }

  const selection = findSelection(
    payload.slug,
    typeof payload.variant === "string" ? payload.variant : undefined,
  );
  if (!selection) {
    return Response.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  await notifyDiscordLead(selection);
  return Response.json({ url: discordInvite() });
}
