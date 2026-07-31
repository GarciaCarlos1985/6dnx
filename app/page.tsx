import { Suspense } from "react";
import { HeroSection } from "@/components/hero-section";
import { CinematicCompanions } from "@/components/cinematic-companions";
import { NewsRadar, NewsRadarSkeleton } from "@/components/news-radar";
import { ProductShowcase } from "@/components/product-showcase";
import { SiteAtmosphere } from "@/components/site-atmosphere";
import { getPublishedCatalog } from "@/lib/catalog/repository";

export default async function HomePage() {
  const catalogProducts = await getPublishedCatalog();

  return (
    <main className="site-flow">
      <SiteAtmosphere />
      <HeroSection
        showBrandOverlay={false}
        showCinematicEffects={false}
        showVideoOverlay
      />
      <CinematicCompanions scene="products" />
      <ProductShowcase catalogProducts={catalogProducts} />
      <div className="hidden">
        <Suspense fallback={<NewsRadarSkeleton />}>
          <NewsRadar />
        </Suspense>
      </div>
    </main>
  );
}
