import { Suspense, lazy, useEffect, useState } from 'react';
import { RouterProvider } from 'react-router';
import { makeSellerRouter } from './sellerRouter';
import { loadSellerPages, sellerPages } from './loadSellerPages';

const SIGNED_OUT = /^\/(sign-in|sign-up|emails-off)(\/|$)/;

// Development only: the break-the-UI data switch. Not in a build.
const DevDataBar = import.meta.env.DEV ? lazy(() => import('@components/ui/seller/DevDataBar')) : null;

/* Seller chunk entry point, my.remvo.app. Lazy-loaded by App.jsx so
 * none of it ships to remvo.app visitors. The account pages are not
 * for search engines, so the whole host says noindex. */
export default function SellerApp() {
  // tidy1: a signed-in address waits here for its screens, so the first render is the whole screen.
  if (!SIGNED_OUT.test(window.location.pathname) && !sellerPages()) throw loadSellerPages();
  const [sellerRouter] = useState(makeSellerRouter);
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <>
      <RouterProvider router={sellerRouter} />
      {DevDataBar && <Suspense fallback={null}><DevDataBar /></Suspense>}
    </>
  );
}
