import { RouterProvider } from 'react-router';
import { router } from './router';

/* Marketing chunk entry point. Lazy-loaded by App.jsx on the
 * remvo.app hostname. By isolating the marketing router behind a
 * default export, Vite splits it into its own chunk and the entry
 * bundle served to public visitors contains zero partner /
 * settlement / admin code. */
export default function MarketingApp() {
  return <RouterProvider router={router} />;
}
