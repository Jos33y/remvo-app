import { StrictMode, Suspense } from 'react';
import { renderToString } from 'react-dom/server';
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router';
import { marketingRoutes } from './marketingRoutes';
import { LoaderDismisser } from './LoaderDismisser';
import { BRAND, PRICING, ROUTES } from '@utils/constants';
import { OG_IMAGE, SITE_ORIGIN } from '@lib/seo';

export { PAGES, NOT_FOUND, SITE_ORIGIN, OG_IMAGE, canonical } from '@lib/seo';

/* ──────────────────────────────────────────────────────────────────
 * Server render of a marketing page, for the build only
 * (prerender/run.mjs). Never runs in production: the output is static
 * HTML.
 *
 * The tree is the browser's tree on remvo.app, element for element:
 * StrictMode > Suspense > LoaderDismisser + the router (App.jsx and
 * MarketingApp.jsx), so the browser can hydrate it rather than draw it
 * again.
 * ────────────────────────────────────────────────────────────────── */

const handler = createStaticHandler(marketingRoutes);

/**
 * @param {string} path  e.g. "/pricing"
 * @returns {Promise<{ html: string, status: number }>}
 */
export async function render(path) {
  const context = await handler.query(new Request(`https://remvo.app${path}`));
  if (context instanceof Response) throw new Error(`${path} redirected; nothing to pre-render`);
  const router = createStaticRouter(handler.dataRoutes, context);
  const html = renderToString(
    <StrictMode>
      <Suspense fallback={null}>
        <LoaderDismisser />
        <StaticRouterProvider router={router} context={context} hydrate={false} />
      </Suspense>
    </StrictMode>
  );
  return { html, status: context.statusCode };
}

/**
 * Structured data for a page, as schema.org JSON-LD, or null. Only what
 * is true: who we are, and what the credits cost. No ratings, no reviews.
 */
export function structuredData(path) {
  if (path === ROUTES.HOME) {
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: BRAND.NAME,
        legalName: BRAND.LEGAL_NAME,
        url: `${SITE_ORIGIN}/`,
        logo: `${SITE_ORIGIN}/favicon/logo512.png`,
        email: BRAND.EMAIL,
        address: { '@type': 'PostalAddress', addressLocality: 'Lagos', addressCountry: 'NG' },
      },
      { '@context': 'https://schema.org', '@type': 'WebSite', name: BRAND.NAME, url: `${SITE_ORIGIN}/` },
    ];
  }
  if (path === ROUTES.PRICING) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Remvo listing credits',
      description: `Prepaid credits for Remvo, software that prepares eBay listings from a barcode. A listing uses ${PRICING.JOBS.LISTING.credits} credits.`,
      image: OG_IMAGE,
      brand: { '@type': 'Brand', name: BRAND.NAME },
      offers: PRICING.PACKS.map((p) => ({
        '@type': 'Offer',
        name: `${p.credits} credits`,
        price: p.price.USD.toFixed(2),
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `${SITE_ORIGIN}${ROUTES.PRICING}`,
      })),
    };
  }
  return null;
}
