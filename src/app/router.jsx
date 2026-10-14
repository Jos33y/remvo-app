import { createBrowserRouter } from 'react-router';
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
import { NotFoundPage } from '@pages/not-found/NotFoundPage';
import { ROUTES } from '@utils/constants';

/* Marketing router for remvo.app.
 *
 * /aml, /partners and /partners/agreement are gone with the paused
 * corridor. A stale link to any of them reaches the catch-all and is
 * served the 404 page.
 */
export const router = createBrowserRouter([
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
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
