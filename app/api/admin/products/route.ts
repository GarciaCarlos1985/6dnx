import { requireAdminApi } from "@/lib/admin/auth";
import { noStoreJson } from "@/lib/admin/api";
import { listAdminCatalog } from "@/lib/catalog/repository";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const catalog = await listAdminCatalog(auth.supabase);
  return noStoreJson(catalog, catalog.state === "unavailable" ? 503 : 200);
}
