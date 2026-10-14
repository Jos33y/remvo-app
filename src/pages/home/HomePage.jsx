import { useEffect } from 'react';
import { HomeHero } from './sections/HomeHero';
import { HomeFeatures } from './sections/HomeFeatures';
import { HomeBulk } from './sections/HomeBulk';
import { HomePricing } from './sections/HomePricing';
import { HomeCTA } from './sections/HomeCTA';

/* Five sections, dark, light, light, dark, dark: what you get, how,
 * many at once, what it costs, start. The hero leads with a finished listing because that is
 * what a seller came for. */
export function HomePage() {
  useEffect(() => {
    document.title = 'Remvo | A finished eBay listing from a barcode';
  }, []);

  return (
    <>
      <HomeHero />
      <HomeFeatures />
      <HomeBulk />
      <HomePricing />
      <HomeCTA />
    </>
  );
}
