import { Suspense } from "react";
import { HeroSection } from "@/components/hero-section";
import { CinematicCompanions } from "@/components/cinematic-companions";
import { NewsRadar, NewsRadarSkeleton } from "@/components/news-radar";
import { ProductShowcase } from "@/components/product-showcase";
import { SiteAtmosphere } from "@/components/site-atmosphere";
import { SiteNavigation } from "@/components/site-navigation";
import { getPublishedCatalog } from "@/lib/catalog/repository";
import { checkoutReadiness } from "@/lib/checkout/config";
import { OFFICIAL_6DNX_DISCORD_INVITE } from "@/lib/discord";
import { shouldEnablePaymentTestMode } from "@/lib/security/payment-test-mode";
import { resolvePublicHttpsLink } from "@/lib/security/public-link";
import { experienceThemeStyle } from "@/lib/site-experience/presentation";
import { getSiteExperience } from "@/lib/site-experience/repository";

export default async function HomePage() {
  const [catalogProducts, experience] = await Promise.all([
    getPublishedCatalog(),
    getSiteExperience(),
  ]);
  const storefrontContent = experience.home.content;
  const checkoutAvailable = checkoutReadiness().ready;
  const paymentTestAvailable = shouldEnablePaymentTestMode(process.env);
  const developerCreditUrl =
    resolvePublicHttpsLink(process.env.DEVELOPER_CREDIT_URL) ??
    resolvePublicHttpsLink(process.env.DISCORD_INVITE_URL);
  const announcementsUrl = OFFICIAL_6DNX_DISCORD_INVITE;

  return (
    <main className="site-flow" style={experienceThemeStyle(experience.home.theme)}>
      <SiteAtmosphere effects={experience.home.effects} />
      <SiteNavigation announcementsUrl={announcementsUrl} />
      <HeroSection
        content={storefrontContent}
        background={experience.home.background}
        cinematic={experience.home.cinematic}
      />
      {experience.home.cinematic.productCharactersEnabled ? (
        <CinematicCompanions
          scene="products"
          aurasEnabled={experience.home.cinematic.aurasEnabled}
          pointerEffectsEnabled={experience.home.cinematic.pointerEffectsEnabled}
          smokeEnabled={experience.home.cinematic.smokeEnabled}
        />
      ) : null}
      <ProductShowcase
        catalogProducts={catalogProducts}
        checkoutAvailable={checkoutAvailable}
        paymentTestAvailable={paymentTestAvailable}
        developerCreditUrl={developerCreditUrl}
        content={storefrontContent}
      />
      <div className="hidden">
        <Suspense fallback={<NewsRadarSkeleton />}>
          <NewsRadar />
        </Suspense>
      </div>
    </main>
  );
}
