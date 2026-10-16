import { HomeHero } from './sections/HomeHero';
import { HomeFeatures } from './sections/HomeFeatures';
import { HomeBulk } from './sections/HomeBulk';
import { HomePricing } from './sections/HomePricing';
import { HomeCTA } from './sections/HomeCTA';

/* Five sections on one night, told apart by space and hairlines:
 * what you get, how, many at once, what it costs, start. The hero
 * leads with a real finished listing because that is what a seller
 * came for. */
export function HomePage() {

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
