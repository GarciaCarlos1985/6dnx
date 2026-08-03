const WEBHOOK_PATH_PATTERN = /(?:^|\/)api\/(?:v\d+\/)?webhooks(?:\/|$)/i;

/**
 * Resolves a link that is safe to render into public HTML. Provider webhook
 * URLs are write credentials, not contact pages, so they fail closed even when
 * an operator places one in the wrong environment variable.
 */
export function resolvePublicHttpsLink(value: string | undefined | null) {
  const configured = value?.trim();
  if (!configured) return null;

  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" || url.username || url.password) return null;

    let pathname = url.pathname;
    try {
      pathname = decodeURIComponent(pathname);
    } catch {
      return null;
    }
    if (WEBHOOK_PATH_PATTERN.test(pathname)) return null;

    return url.toString();
  } catch {
    return null;
  }
}
