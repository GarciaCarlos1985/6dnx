import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { requireAdminPage } from "@/lib/admin/auth";
import { listAdminCatalog } from "@/lib/catalog/repository";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ produto?: string }>;
}) {
  const session = await requireAdminPage();
  const catalog = await listAdminCatalog(session.supabase);
  const { produto } = await searchParams;

  return (
    <AdminDashboard
      key={produto ?? "catalog"}
      initialItems={catalog.items}
      initialState={catalog.state}
      initialMessage={catalog.message}
      initialSelectedId={produto}
      user={session.user}
    />
  );
}
