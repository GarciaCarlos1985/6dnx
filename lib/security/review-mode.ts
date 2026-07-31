export function shouldProtectSiteReview(
  configuredValue: string | undefined,
  isVercelRuntime: boolean,
) {
  const normalized = configuredValue?.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;

  // A forgotten or malformed variable must not publish a private review by
  // accident. Local development remains open unless explicitly protected.
  return isVercelRuntime;
}
