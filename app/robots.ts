import type { MetadataRoute } from "next";

/**
 * Site origin used for canonical URLs / sitemap. Mirrors metadataBase in
 * app/layout.tsx so robots and sitemap agree with the canonical domain.
 */
function siteOrigin(): string {
  const official = "https://www.6dnx.com.br";
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured) return official;
  try {
    const url = new URL(configured);
    return url.protocol === "https:" ? url.origin : official;
  } catch {
    return official;
  }
}

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
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
