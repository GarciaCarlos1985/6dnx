import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/auth";
import { getAdminProduct } from "@/lib/catalog/repository";
import { getAdminGuide } from "@/lib/guides/repository";
import { ORDER_ID_PATTERN } from "@/lib/guides/access";
import { GuideEditor } from "@/components/admin/guide-editor";
import "@/app/produtos/products.css";

export const dynamic = "force-dynamic";
export default async function GuideEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdminPage();
  const { id } = await params;
  if (!ORDER_ID_PATTERN.test(id)) notFound();
  const result = await getAdminProduct(session.supabase, id);
  if (result.error)
    throw new Error("O catálogo está temporariamente indisponível.");
  if (!result.item) notFound();
  return (
    <GuideEditor
      item={result.item}
      initialRecord={await getAdminGuide(
        session.supabase,
        result.item.sourceKey,
      )}
    />
  );
}
