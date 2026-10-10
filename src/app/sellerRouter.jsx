import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { SellerSessionProvider } from '@context/SellerSession';
import { RequireSeller } from '@components/layout/seller/RequireSeller';
import { SellerShell } from '@components/layout/seller/SellerShell';
import { SignInPage } from '@pages/seller/SignInPage';
import { VerifyLinkPage } from '@pages/seller/VerifyLinkPage';
import { SellerHomePage } from '@pages/seller/SellerHomePage';
import { ListingsPage } from '@pages/seller/ListingsPage';
import { NewListingPage } from '@pages/seller/NewListingPage';
import { ListingPage } from '@pages/seller/ListingPage';
import { CreditsPage } from '@pages/seller/CreditsPage';
import { ProfilePage } from '@pages/seller/ProfilePage';
import { SellerNotFoundPage } from '@pages/seller/SellerNotFoundPage';
import { SELLER_ROUTES } from '@utils/constants';

/* Seller router for my.remvo.app.
 *
 *   /sign-in, /sign-in/verify    signed out
 *   /                            Home: balance, make a listing, recent
 *   /listings                    every listing, filter and search
 *   /listings/new                making one (covers the tabs)
 *   /listings/:id                one listing, field by field (covers the tabs)
 *   /credits                     balance, top-up, history
 *   /profile                     account, help, legal, sign out, delete
 *   /billing                     the marketing site's Top up: credits with the sheet open
 */
export const sellerRouter = createBrowserRouter([
  {
    element: (
      <SellerSessionProvider>
        <Outlet />
      </SellerSessionProvider>
    ),
    children: [
      { path: SELLER_ROUTES.SIGN_IN, element: <SignInPage /> },
      { path: SELLER_ROUTES.VERIFY, element: <VerifyLinkPage /> },
      {
        element: <RequireSeller />,
        children: [
          {
            element: <SellerShell />,
            children: [
              { path: SELLER_ROUTES.HOME, element: <SellerHomePage /> },
              { path: SELLER_ROUTES.LISTINGS, element: <ListingsPage /> },
              { path: SELLER_ROUTES.NEW_LISTING, element: <NewListingPage /> },
              { path: SELLER_ROUTES.LISTING, element: <ListingPage /> },
              { path: SELLER_ROUTES.CREDITS, element: <CreditsPage /> },
              { path: SELLER_ROUTES.PROFILE, element: <ProfilePage /> },
              { path: SELLER_ROUTES.BILLING, element: <Navigate to={`${SELLER_ROUTES.CREDITS}?topup=1`} replace /> },
            ],
          },
        ],
      },
      { path: '*', element: <SellerNotFoundPage /> },
    ],
  },
]);
