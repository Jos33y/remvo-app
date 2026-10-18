import { HomeHero } from './sections/HomeHero';
import { HomeFeatures } from './sections/HomeFeatures';
import { HomeBulk } from './sections/HomeBulk';
import { HomePricing } from './sections/HomePricing';
import { HomeFees } from './sections/HomeFees';
import { HomeCTA } from './sections/HomeCTA';
import { ChatInvite } from '@components/ui/marketing/ChatInvite';

/* Six sections on one night, told apart by space and hairlines:
 * what you get, how, many at once, what it costs, talk to us, start. The hero
 * leads with a real finished listing because that is what a seller
 * came for. */
export function HomePage() {

  return (
    <>
      <HomeHero />
      <HomeFeatures />
      <HomeBulk />
      <HomePricing />
      <HomeFees />
      <ChatInvite />
      <HomeCTA />
    </>
  );
}
