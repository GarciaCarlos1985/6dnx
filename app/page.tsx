import { Suspense } from "react";
import { HeroSection } from "@/components/hero-section";
import { CinematicCompanions } from "@/components/cinematic-companions";
import { NewsRadar, NewsRadarSkeleton } from "@/components/news-radar";
import { ProductShowcase } from "@/components/product-showcase";
import { SiteAtmosphere } from "@/components/site-atmosphere";
import { getPublishedCatalog } from "@/lib/catalog/repository";
import { checkoutReadiness } from "@/lib/checkout/config";
import { shouldEnablePaymentTestMode } from "@/lib/security/payment-test-mode";
import { resolvePublicHttpsLink } from "@/lib/security/public-link";

export default async function HomePage() {
  const catalogProducts = await getPublishedCatalog();
  const checkoutAvailable = checkoutReadiness().ready;
  const paymentTestAvailable = shouldEnablePaymentTestMode(process.env);
  const developerCreditUrl =
    resolvePublicHttpsLink(process.env.DEVELOPER_CREDIT_URL) ??
    resolvePublicHttpsLink(process.env.DISCORD_INVITE_URL);

  return (
    <main className="site-flow">
      <SiteAtmosphere />
      <HeroSection />
      <CinematicCompanions scene="products" />
      <ProductShowcase
        catalogProducts={catalogProducts}
        checkoutAvailable={checkoutAvailable}
        paymentTestAvailable={paymentTestAvailable}
        developerCreditUrl={developerCreditUrl}
      />
      <div className="hidden">
        <Suspense fallback={<NewsRadarSkeleton />}>
          <NewsRadar />
        </Suspense>
      </div>
    </main>
  );
}
