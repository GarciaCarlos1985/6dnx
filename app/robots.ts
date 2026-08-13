import type { MetadataRoute } from "next";
import { officialSiteOrigin } from "@/lib/site-origin";

/**
 * Allow crawling of the public storefront while keeping private and
 * administrative surfaces out of search engines. Public landing pages
 * (icon, /noticias, and future /produtos/*) are indexable; anything under
 * /admin, /api, /conta, /checkout stays disallowed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/conta",
          "/checkout",
        ],
      },
    ],
    sitemap: `${officialSiteOrigin()}/sitemap.xml`,
    host: officialSiteOrigin(),
  };
}
