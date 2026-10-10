import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { sellerRouter } from './sellerRouter';

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

  return <RouterProvider router={sellerRouter} />;
}
