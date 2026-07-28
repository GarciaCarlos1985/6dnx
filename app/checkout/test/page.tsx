import type { Metadata } from "next";
import { TestCheckout } from "@/components/test-checkout";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout de teste",
  description: "Laboratório de pagamento simulado da 6DNX.",
  robots: { index: false, follow: false },
};

export default async function TestCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string | string[] }>;
}) {
  const params = await searchParams;
  const sessionId =
    typeof params.session === "string" ? params.session : "";

  return <TestCheckout sessionId={sessionId} />;
}
