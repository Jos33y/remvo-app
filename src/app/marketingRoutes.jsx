import { PageShell } from '@components/layout/marketing/PageShell';
import { HomePage } from '@pages/home/HomePage';
import { HowItWorksPage } from '@pages/how-it-works/HowItWorksPage';
import { PricingPage } from '@pages/pricing/PricingPage';
import { TermsPage } from '@pages/legal/TermsPage';
import { PrivacyPage } from '@pages/legal/PrivacyPage';
import { RefundsPage } from '@pages/legal/RefundsPage';
import { CreditsPage } from '@pages/legal/CreditsPage';
import { ContactPage } from '@pages/contact/ContactPage';
import { ExamplePage } from '@pages/example/ExamplePage';
import { FeeCalculatorUsPage, FeeCalculatorUkPage } from '@pages/tools/FeeCalculatorPage';
import { GuidesPage } from '@pages/guides/GuidesPage';
import { GuidePage } from '@pages/guides/GuidePage';
import { HelpPage } from '@pages/help/HelpPage';
import { HelpArticlePage } from '@pages/help/HelpArticlePage';
import { NotFoundPage } from '@pages/not-found/NotFoundPage';
import { ROUTES } from '@utils/constants';

/* The marketing site's routes, on their own so the build can render
 * them on the server (prerender/) and the browser can hydrate the same
 * tree (router.jsx). No browser globals at module level here.
 *
 * /aml, /partners and /partners/agreement are gone with the paused
 * corridor. A stale link to any of them reaches the catch-all and is
 * served the 404 page.
 */
export const marketingRoutes = [
  {
    element: <PageShell />,
    children: [
      { path: ROUTES.HOME, element: <HomePage /> },
      { path: ROUTES.HOW, element: <HowItWorksPage /> },
      { path: ROUTES.PRICING, element: <PricingPage /> },
      { path: ROUTES.TERMS, element: <TermsPage /> },
      { path: ROUTES.PRIVACY, element: <PrivacyPage /> },
      { path: ROUTES.REFUNDS, element: <RefundsPage /> },
      { path: ROUTES.CREDITS, element: <CreditsPage /> },
      { path: ROUTES.CONTACT, element: <ContactPage /> },
      { path: ROUTES.EXAMPLE, element: <ExamplePage /> },
      { path: ROUTES.FEES_US, element: <FeeCalculatorUsPage /> },
      { path: ROUTES.FEES_UK, element: <FeeCalculatorUkPage /> },
      { path: ROUTES.GUIDES, element: <GuidesPage /> },
      { path: `${ROUTES.GUIDES}/:slug`, element: <GuidePage /> },
      { path: ROUTES.HELP, element: <HelpPage /> },
      { path: `${ROUTES.HELP}/:slug`, element: <HelpArticlePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
