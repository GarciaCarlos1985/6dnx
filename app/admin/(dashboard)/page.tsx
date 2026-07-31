import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { requireAdminPage } from "@/lib/admin/auth";
import { listAdminCatalog } from "@/lib/catalog/repository";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireAdminPage();
  const catalog = await listAdminCatalog(session.supabase);

  return (
    <AdminDashboard
      initialItems={catalog.items}
      initialState={catalog.state}
      initialMessage={catalog.message}
      user={session.user}
    />
  );
}
