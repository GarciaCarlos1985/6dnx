const OFFICIAL_SITE_ORIGIN = "https://www.6dnx.com.br";

export function resolveSiteOrigin(configured?: string) {
  if (!configured) return OFFICIAL_SITE_ORIGIN;

  try {
    const url = new URL(configured);
    if (
      url.hostname === "6dnx.com.br" ||
      url.hostname === "www.6dnx.com.br" ||
      url.hostname === "6dnx.vercel.app"
    ) {
      return OFFICIAL_SITE_ORIGIN;
    }

    return url.protocol === "https:"
      ? url.origin
      : OFFICIAL_SITE_ORIGIN;
  } catch {
    return OFFICIAL_SITE_ORIGIN;
  }
}

export function officialSiteOrigin() {
  return resolveSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL);
}
