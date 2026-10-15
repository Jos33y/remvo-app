import { Suspense, lazy, useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { sellerRouter } from './sellerRouter';

// Development only: the break-the-UI data switch. Not in a build.
const DevDataBar = import.meta.env.DEV ? lazy(() => import('@components/ui/seller/DevDataBar')) : null;

/* Seller chunk entry point, my.remvo.app. Lazy-loaded by App.jsx so
 * none of it ships to remvo.app visitors. The account pages are not
 * for search engines, so the whole host says noindex. */
export default function SellerApp() {
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
