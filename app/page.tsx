import { Suspense } from "react";
import { CinematicCompanions } from "@/components/cinematic-companions";
import { HeroSection } from "@/components/hero-section";
import { NewsRadar, NewsRadarSkeleton } from "@/components/news-radar";
import { ProductShowcase } from "@/components/product-showcase";

export default function HomePage() {
  return (
    <main className="site-flow">
      <HeroSection />
      <CinematicCompanions />
      <ProductShowcase />
      <Suspense fallback={<NewsRadarSkeleton />}>
        <NewsRadar />
      </Suspense>
    </main>
  );
}
