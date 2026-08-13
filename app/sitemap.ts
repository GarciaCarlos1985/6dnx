import type { MetadataRoute } from "next";
import { officialSiteOrigin } from "@/lib/site-origin";

/**
 * /sitemap.xml — public storefront routes only. Kept in sync with the
 * indexable allow-list in proxy.ts and the robots disallow list.
 *
 * NOTE on products: /produtos/[slug] is still BLOQUEADO in the roadmap (the
 * 59-vs-12 catalog drift is unresolved), so product URLs are NOT emitted yet —
 * pointing the sitemap at routes that do not exist would create 404s and hurt
 * SEO. Add product entries here only once the per-product route ships.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = officialSiteOrigin();
  const now = new Date();

  return [
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
