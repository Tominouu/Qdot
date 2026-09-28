import {
  AnalyticsSection,
  CustomizationSection,
  DynamicSection,
  FinalCtaSection,
  FlowSection,
  HeroSection,
  OpenSourceSection,
  PrivacySection,
} from "@/components/marketing/landing-sections";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";

export default function LandingPage() {
  return (
    <>
      <MarketingHeader />
      <main>
        <HeroSection />
        <DynamicSection />
        <CustomizationSection />
        <FlowSection />
        <AnalyticsSection />
        <PrivacySection />
        <OpenSourceSection />
        <FinalCtaSection />
      </main>
      <MarketingFooter />
    </>
  );
}
