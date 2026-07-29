import type { MetadataRoute } from "next";

/**
 * The storefront is still an owner-only review environment. Remove this
 * blanket rule only as part of the explicit public-launch checklist.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
