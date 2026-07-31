import { NextRequest, NextResponse } from "next/server";
import { getPublishedCatalog } from "@/lib/catalog/repository";

const FALLBACK_INVITE = "https://discord.gg/6dnx";

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

/**
 * Compatibility navigation: GET only redirects. Keeping side effects out of
 * GET prevents link previewers, crawlers and browser prefetch from announcing
 * customers that never clicked the purchase action.
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const products = await getPublishedCatalog();
  const productExists =
    slug === null || products.some((item) => item.slug === slug);

  return NextResponse.redirect(
    productExists ? discordInvite() : new URL("/", request.url).toString(),
  );
}
