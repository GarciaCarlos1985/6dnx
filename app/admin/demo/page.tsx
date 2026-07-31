import { notFound } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { products } from "@/lib/products";

export default function AdminDemoPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  const now = new Date().toISOString();
  const items = products.slice(0, 10).map((product, index) => ({
    id: `demo-${index}`,
    sourceKey: product.catalogKey ?? product.slug,
    product: {
      ...product,
      catalogKey: product.catalogKey ?? product.slug,
      theme: product.theme ?? {
        accentColor: "#e3062c",
        textColor: "#f7f3f4",
        surfaceColor: "#0b0708",
      },
    },
    publicationState: "published" as const,
    catalogOrder: index,
    revision: 1,
    createdAt: now,
    updatedAt: now,
    updatedBy: null,
  }));

  return (
    <AdminDashboard
      initialItems={items}
      initialState="ready"
      user={{ id: "demo", email: "modo.visual@6dnx.local", role: "admin" }}
      demoMode
    />
  );
}
