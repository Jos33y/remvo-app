import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router';
import { MockSessionProvider } from '@context/MockSessionProvider';
import { SessionResolver } from '@pages/checkout/SessionResolver';
import { PaymentPage } from '@pages/checkout/PaymentPage';
import { LandingPage } from '@pages/checkout/LandingPage';

/* ──────────────────────────────────────────────────────────────────
 * Checkout Router
 *
 * /                  -> LandingPage  (no session, brand presence)
 * /:token            -> SessionResolver (routes by status + mode)
 * /:token/pay        -> PaymentPage    (payment window lifecycle)
 * /:token/complete   -> SessionResolver (post-payment routing)
 * *                  -> redirect to /
 *
 * SessionProviderLayout wraps every token-scoped route in a fresh
 * MockSessionProvider so each token has its own session lifecycle.
 * LandingPage is unwrapped because it has no session.
 * ────────────────────────────────────────────────────────────────── */

function SessionProviderLayout() {
  const { token } = useParams();
  return (
    <MockSessionProvider token={token}>
      <Outlet />
    </MockSessionProvider>
  );
}

export const checkoutRouter = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/:token',
    element: <SessionProviderLayout />,
    children: [
      { index: true, element: <SessionResolver /> },
      { path: 'pay', element: <PaymentPage /> },
      { path: 'complete', element: <SessionResolver /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
