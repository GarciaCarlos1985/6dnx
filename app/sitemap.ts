import type { MetadataRoute } from "next";
import { officialSiteOrigin } from "@/lib/site-origin";
import { getPublishedCatalog } from "@/lib/catalog/repository";
import { groupProductsByGame, productPagePath } from "@/lib/catalog/games";

/**
 * /sitemap.xml — public storefront routes only. Kept in sync with the
 * indexable allow-list in proxy.ts and the robots disallow list.
 *
 * Product and game URLs derive only from the published catalog. Private
 * purchase guides are deliberately absent.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = officialSiteOrigin();
  const now = new Date();
  const products = await getPublishedCatalog();

  return [
    { url: `${origin}/jogos`, changeFrequency: "daily", priority: 0.8 },
    ...groupProductsByGame(products).map((game) => ({
      url: `${origin}/jogos/${game.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${origin}${productPagePath(product)}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    {
      url: `${origin}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${origin}/noticias`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.8,
    },
  ];
}
