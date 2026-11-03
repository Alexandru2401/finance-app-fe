import CustomerReviews from "./CustomerReviews";
import PublicAboutPage from "./home/HomeOurMission";
import HomeCta2 from "./home/HomeCta2";
import HomeBrands from "./home/HomeBrands";
import HomeCardCta from "./home/HomeCardCta";
import HomeFaq from "./home/HomeFaq";
import HomeFeatures from "./home/HomeFeatures";
import HomeHeroSection from "./home/HomeHeroSection";

export default function PublicHomePage() {
  return (
    <>
      {/* Hero */}
      <HomeHeroSection />

      {/* CTA 1 */}
      <HomeCardCta />

      {/* Brands */}
      <HomeBrands />

      {/* Features */}
      <HomeFeatures />

      <PublicAboutPage />

      <CustomerReviews />

      <HomeFaq />

      <HomeCta2 />
    </>
  );
}
