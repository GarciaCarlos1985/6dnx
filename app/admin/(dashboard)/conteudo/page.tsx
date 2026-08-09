import { StorefrontContentEditor } from "@/components/admin/storefront-content-editor";
import { requireAdminPage } from "@/lib/admin/auth";
import { getAdminStorefrontContent } from "@/lib/storefront-content/repository";

export const dynamic = "force-dynamic";

export default async function AdminStorefrontContentPage() {
  const session = await requireAdminPage();
  const record = await getAdminStorefrontContent(session.supabase);

  return (
    <StorefrontContentEditor
      initialRecord={record}
      userEmail={session.user.email}
    />
  );
}
