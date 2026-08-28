import { NextRequest, NextResponse } from "next/server";
import { getPublishedCatalog } from "@/lib/catalog/repository";
import { OFFICIAL_6DNX_DISCORD_INVITE } from "@/lib/discord";

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
    productExists
      ? OFFICIAL_6DNX_DISCORD_INVITE
      : new URL("/", request.url).toString(),
  );
}
