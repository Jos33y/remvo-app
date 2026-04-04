import { useEffect } from 'react';
import { HeroSection } from './sections/HeroSection';
import { FlowSection } from './sections/FlowSection';
import { IntegrationSection } from './sections/IntegrationSection';
import { SettlementSection } from './sections/SettlementSection';
import { CTASection } from './sections/CTASection';

export function PartnersPage() {
  useEffect(() => {
    document.title = 'Remvo | For Platforms';
  }, []);

  return (
    <>
      <HeroSection />
      <FlowSection />
      <IntegrationSection />
      <SettlementSection />
      <CTASection />
    </>
  );
}
