import { notFound } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { products } from "@/lib/products";
import { GuidanceCenter } from "@/components/admin/guidance-center";
import { GuideEditor } from "@/components/admin/guide-editor";
import { EMPTY_GUIDE, type GuideRecord } from "@/lib/guides/types";
import "@/app/produtos/products.css";

export default async function AdminDemoPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { view } = await searchParams;

  const now = new Date().toISOString();
  const items = products.slice(0, 10).map((product, index) => ({
    id: `demo-${index}`,
    sourceKey: product.catalogKey ?? product.slug,
    product: {
      ...product,
      gameName: index < 4 ? "DayZ" : null,
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

  if (view === "orientacoes")
    return (
      <GuidanceCenter
        items={items}
        guides={[
          {
            productSourceKey: items[0].sourceKey,
            revision: 2,
            publishedAt: now,
          },
        ]}
        available
        demoMode
      />
    );
  if (view === "guia") {
    const guide: GuideRecord = {
      draft: {
        ...EMPTY_GUIDE,
        title: "Primeiros passos com sua solução",
        introduction:
          "Exemplo ilustrativo para revisar a experiência do comprador. Substitua este material por orientações aprovadas antes de publicar.",
        steps: [
          "Confira o nome da solução e o plano registrados na sua compra.",
          "Leia os requisitos de compatibilidade na apresentação do produto.",
          "Se houver alguma dúvida, informe ao suporte o produto e a etapa em que parou.",
        ],
        questions: [
          {
            question: "Onde encontro esta orientação depois?",
            answer:
              "Entre na mesma conta da compra e abra a orientação ao lado do pedido confirmado.",
          },
        ],
      },
      published: null,
      revision: 1,
      publishedAt: null,
      state: "ready",
    };
    return <GuideEditor item={items[0]} initialRecord={guide} demoMode />;
  }

  return (
    <AdminDashboard
      initialItems={items}
      initialState="ready"
      user={{ id: "demo", email: "modo.visual@6dnx.local", role: "admin" }}
      demoMode
    />
  );
}
