import { requireAdminPage } from "@/lib/admin/auth";
import { listAdminCatalog } from "@/lib/catalog/repository";
import { listGuideSummaries } from "@/lib/guides/repository";
import { GuidanceCenter } from "@/components/admin/guidance-center";

export const dynamic = "force-dynamic";
export default async function GuidanceCenterPage() {
  const session = await requireAdminPage();
  const [catalog, guides] = await Promise.all([
    listAdminCatalog(session.supabase),
    listGuideSummaries(session.supabase),
  ]);
  return (
    <GuidanceCenter
      items={catalog.items}
      guides={guides.guides}
      available={catalog.state === "ready" && guides.available}
    />
  );
}
