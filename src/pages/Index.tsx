import { useCallback } from "react";
import LandingLayout from "@/components/landing/LandingLayout";
import HeroCommunitySection from "@/components/landing/HeroCommunitySection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import DemosSection from "@/components/landing/DemosSection";
import PricingSection from "@/components/landing/PricingSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import FaqSection from "@/components/landing/FaqSection";
import Footer from "@/components/landing/Footer";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useDataLayer } from "@/hooks/useDataLayer";
import { useEngagementTracking } from "@/hooks/useEngagementTracking";

const WHATSAPP_JOIN_URL =
  "https://wa.me/1XXXXXXXXXX?text=Hola,%20Gustavo.%20Quiero%20unirme%20al%20grupo%20de%20DJs%20gratis";
const WHATSAPP_TRIAL_URL =
  "https://wa.me/1XXXXXXXXXX?text=INICIAR%20PRUEBA%20DE%207%20D%C3%8DAS%20%28100GB%29";

export default function Index() {
  const { trackEvent } = useAnalytics();
  const { trackClick } = useDataLayer();

  useEngagementTracking();

  const trackCta = useCallback(
    (buttonText: string, ctaId: string, destination: string) => {
      trackClick(buttonText);
      trackEvent("click", {
        button_text: buttonText,
        cta_id: ctaId,
        section: "hero",
        destination,
        funnel_step: "home",
      });
    },
    [trackClick, trackEvent]
  );

  return (
    <LandingLayout>
      <HeroCommunitySection
        whatsappGroupUrl={WHATSAPP_TRIAL_URL}
        onPrimaryCtaClick={() =>
          trackCta("INICIAR PRUEBA DE 7 DÍAS (100GB)", "hero_start_trial_7_days", WHATSAPP_TRIAL_URL)
        }
        onSecondaryCtaClick={() => trackCta("VER DEMOS Y PRECIOS", "hero_scroll_demos_pricing", "#demos")}
      />
      <HowItWorksSection />
      <DemosSection />
      <PricingSection />
      <SocialProofSection />
      <FaqSection />
      <Footer
        whatsappJoinUrl={WHATSAPP_JOIN_URL}
        onCtaClick={() => trackCta("QUIERO UNIRME AL GRUPO (GRATIS)", "footer_join_group_free", WHATSAPP_JOIN_URL)}
      />
    </LandingLayout>
  );
}
