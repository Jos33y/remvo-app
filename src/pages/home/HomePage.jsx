import { useEffect } from 'react';
import { HomeHero } from './sections/HomeHero';
import { HomeFeatures } from './sections/HomeFeatures';
import { HomeCheckout } from './sections/HomeCheckout';
import { HomeCTA } from './sections/HomeCTA';

export function HomePage() {
  useEffect(() => {
    document.title = 'Remvo | The digital value card';
  }, []);

  return (
    <>
      <HomeHero />
      <HomeFeatures />
      <HomeCheckout />
      <HomeCTA />
    </>
  );
}
