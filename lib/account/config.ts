import "server-only";

// Config details for the account module. Unlike the checkout module this does
// NOT require the checkout/payment activation switches — a logged-in user must
// be able to see their own account even if a new purchase isn't possible yet.
function validSupabaseUrl(value: string | undefined) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && !url.username && !url.password
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

export function getAccountDatabaseConfig():
  | { supabaseUrl: string; supabaseSecretKey: string }
  | null {
  const supabaseUrl = validSupabaseUrl(process.env.SUPABASE_URL);
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return supabaseUrl && supabaseSecretKey
    ? { supabaseUrl, supabaseSecretKey }
    : null;
}
