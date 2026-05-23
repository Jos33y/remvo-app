import { createBrowserRouter, Navigate } from 'react-router';
import { PartnersShell } from '@components/layout/partners/PartnersShell';
import { PartnersPage } from '@pages/partners/PartnersPage';
import { AgreementPage } from '@pages/partners/AgreementPage';
import { PARTNERS_ROUTES } from '@utils/constants';

/* ──────────────────────────────────────────────────────────────────
 * Partners Router
 *
 * Mounts on partners.remvo.app (production) and on ?partners (dev).
 *
 * /           -> PartnersPage  (integration overview, was on remvo.app/partners)
 * /agreement  -> AgreementPage (Platform Services Agreement)
 * *           -> redirect to /
 *
 * Everything below the shell sits on a warm-white canvas inside a
 * partners-only header/footer pair, with a noindex meta tag injected
 * by PartnersShell on mount. PSP automated diligence on remvo.app
 * never reaches this tree, and search engines never index it.
 * ────────────────────────────────────────────────────────────────── */

export const partnersRouter = createBrowserRouter([
  {
    element: <PartnersShell />,
    children: [
      {
        path: PARTNERS_ROUTES.HOME,
        element: <PartnersPage />,
      },
      {
        path: PARTNERS_ROUTES.AGREEMENT,
        element: <AgreementPage />,
      },
      {
        path: '*',
        element: <Navigate to={PARTNERS_ROUTES.HOME} replace />,
      },
    ],
  },
]);
