import { createBrowserRouter } from 'react-router';
import { PageShell } from '@components/layout/marketing/PageShell';
import { HomePage } from '@pages/home/HomePage';
import { TermsPage } from '@pages/legal/TermsPage';
import { PrivacyPage } from '@pages/legal/PrivacyPage';
import { AMLPage } from '@pages/legal/AMLPage';
import { RefundsPage } from '@pages/legal/RefundsPage';
import { ContactPage } from '@pages/contact/ContactPage';
import { NotFoundPage } from '@pages/not-found/NotFoundPage';
import { ROUTES } from '@utils/constants';

/* Marketing router for remvo.app.
 *
 * Partners + Agreement routes intentionally removed. The integration
 * material now lives on partners.remvo.app (see partnersRouter.jsx).
 * If a stale link hits /partners or /partners/agreement here, the
 * catch-all NotFoundPage serves a 404 — exactly what we want when a
 * PSP automated reviewer probes the old URLs.
 */
export const router = createBrowserRouter([
  {
    element: <PageShell />,
    children: [
      {
        path: ROUTES.HOME,
        element: <HomePage />,
      },
      {
        path: ROUTES.TERMS,
        element: <TermsPage />,
      },
      {
        path: ROUTES.PRIVACY,
        element: <PrivacyPage />,
      },
      {
        path: ROUTES.AML,
        element: <AMLPage />,
      },
      {
        path: ROUTES.REFUNDS,
        element: <RefundsPage />,
      },
      {
        path: ROUTES.CONTACT,
        element: <ContactPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
