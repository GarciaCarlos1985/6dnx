import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { requireAdminPage } from "@/lib/admin/auth";
import { listAdminCatalog } from "@/lib/catalog/repository";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ produto?: string; novo?: string }>;
}) {
  const session = await requireAdminPage();
  const catalog = await listAdminCatalog(session.supabase);
  const { produto, novo } = await searchParams;

  return (
    <AdminDashboard
      key={novo === "1" ? "new-product" : produto ?? "catalog"}
      initialItems={catalog.items}
      initialState={catalog.state}
      initialMessage={catalog.message}
      initialSelectedId={produto}
      initialCreate={novo === "1"}
      user={session.user}
    />
  );
}
