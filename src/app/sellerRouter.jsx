import { createBrowserRouter, Navigate, Outlet, ScrollRestoration } from 'react-router';
import { SellerSessionProvider } from '@context/SellerSession';
import { RequireSeller } from '@components/layout/seller/RequireSeller';
import { SellerShell } from '@components/layout/seller/SellerShell';
import { SignInPage } from '@pages/seller/SignInPage';
import { VerifyLinkPage } from '@pages/seller/VerifyLinkPage';
import { SetPasswordPage } from '@pages/seller/SetPasswordPage';
import { SellerHomePage } from '@pages/seller/SellerHomePage';
import { ListingsPage } from '@pages/seller/ListingsPage';
import { NewListingPage } from '@pages/seller/NewListingPage';
import { ListingPage } from '@pages/seller/ListingPage';
import { BulkPage } from '@pages/seller/BulkPage';
import { BatchPage } from '@pages/seller/BatchPage';
import { CreditsPage } from '@pages/seller/CreditsPage';
import { ProfilePage } from '@pages/seller/ProfilePage';
import { SupportPage } from '@pages/seller/SupportPage';
import { SellerNotFoundPage } from '@pages/seller/SellerNotFoundPage';
import { SELLER_ROUTES } from '@utils/constants';

/* Seller router for my.remvo.app.
 *
 *   /sign-in, /sign-up           signed out: password, passkey, or open an account
 *   /sign-in/verify              the confirm-your-email link
 *   /sign-in/password            the set-or-reset-password link
 *   /                            Home: balance, make a listing, recent
 *   /listings                    every listing, filter and search
 *   /listings/new                making one (covers the tabs)
 *   /listings/:id                one listing, field by field (covers the tabs)
 *   /listings/bulk               many at once: paste a column or upload a CSV (covers the tabs)
 *   /batches/:id                 a bulk run: progress, lines, the eBay file (covers the tabs)
 *   /credits                     balance, top-up, history
 *   /profile                     account, help, legal, sign out, delete
 *   /billing                     the marketing site's Top up: credits with the sheet open
 *
 * Scroll: a new screen opens at its top; going back (the browser's,
 * the phone's, or a back button to the screen just left) returns to
 * where that screen was scrolled. ScrollRestoration does both.
 */
export const sellerRouter = createBrowserRouter([
  {
    element: (
      <SellerSessionProvider>
        <ScrollRestoration />
        <Outlet />
      </SellerSessionProvider>
    ),
    children: [
      { path: SELLER_ROUTES.SIGN_IN, element: <SignInPage /> },
      { path: SELLER_ROUTES.SIGN_UP, element: <SignInPage /> },
      { path: SELLER_ROUTES.VERIFY, element: <VerifyLinkPage /> },
      { path: SELLER_ROUTES.SET_PASSWORD, element: <SetPasswordPage /> },
      {
        element: <RequireSeller />,
        children: [
          {
            element: <SellerShell />,
            children: [
              { path: SELLER_ROUTES.HOME, element: <SellerHomePage /> },
              { path: SELLER_ROUTES.LISTINGS, element: <ListingsPage /> },
              { path: SELLER_ROUTES.NEW_LISTING, element: <NewListingPage /> },
              { path: SELLER_ROUTES.BULK, element: <BulkPage /> },
              { path: SELLER_ROUTES.LISTING, element: <ListingPage /> },
              { path: SELLER_ROUTES.BATCH, element: <BatchPage /> },
              { path: SELLER_ROUTES.CREDITS, element: <CreditsPage /> },
              { path: SELLER_ROUTES.PROFILE, element: <ProfilePage /> },
              { path: SELLER_ROUTES.SUPPORT, element: <SupportPage /> },
              { path: SELLER_ROUTES.BILLING, element: <Navigate to={`${SELLER_ROUTES.CREDITS}?topup=1`} replace /> },
              // Not in Remvo: inside the app, so the tabs are still there.
              { path: '*', element: <SellerNotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
