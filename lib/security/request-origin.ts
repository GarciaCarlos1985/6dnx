export function isTrustedMutationOrigin(
  origin: string | null,
  fetchSite: string | null,
  expectedOrigin: string,
) {
  if (origin !== expectedOrigin) return false;
  return fetchSite === null || fetchSite === "same-origin";
}
