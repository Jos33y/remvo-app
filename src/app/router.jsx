import { createBrowserRouter } from 'react-router';
import { PageShell } from '@components/layout/PageShell';
import { HomePage } from '@pages/home/HomePage';
import { PartnersPage } from '@pages/partners/PartnersPage';
import { AgreementPage } from '@pages/partners/AgreementPage';
import { TermsPage } from '@pages/legal/TermsPage';
import { PrivacyPage } from '@pages/legal/PrivacyPage';
import { AMLPage } from '@pages/legal/AMLPage';
import { RefundsPage } from '@pages/legal/RefundsPage';
import { ContactPage } from '@pages/contact/ContactPage';
import { CACRegistrationPage } from '@pages/cac/CACRegistrationPage';
import { NotFoundPage } from '@pages/not-found/NotFoundPage';
import { ROUTES } from '@utils/constants';

export const router = createBrowserRouter([
  {
    element: <PageShell />,
    children: [
      {
        path: ROUTES.HOME,
        element: <HomePage />,
      },
      {
        path: ROUTES.PARTNERS,
        element: <PartnersPage />,
      },
      {
        path: ROUTES.AGREEMENT,
        element: <AgreementPage />,
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
        // Temporary route, remove after CAC registration is complete
        path: '/cac-registration',
        element: <CACRegistrationPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
