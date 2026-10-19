import { StrictMode, Suspense } from 'react';
import { renderToString } from 'react-dom/server';
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router';
import { marketingRoutes } from './marketingRoutes';
import { LoaderDismisser } from './LoaderDismisser';
import { BRAND, PRICING, ROUTES } from '@utils/constants';
import { OG_IMAGE, SITE_ORIGIN } from '@lib/seo';
import { FAQ } from '@pages/tools/FeeCalculatorPage';
import { GUIDES, guideBySlug, guidePath } from '@lib/guides';
import { HELP, helpBySlug, helpPath, isoDuration } from '@lib/help';

export { PAGES, NOT_FOUND, SITE_ORIGIN, OG_IMAGE, canonical } from '@lib/seo';
export { GUIDES } from '@lib/guides';
export { HELP } from '@lib/help';

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
        sameAs: BRAND.SOCIAL.map((s) => s.url),
      },
      { '@context': 'https://schema.org', '@type': 'WebSite', name: BRAND.NAME, url: `${SITE_ORIGIN}/` },
    ];
  }
  if (path === ROUTES.PRICING) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Remvo listing credits',
      description: `Prepaid credits for Remvo, software that prepares eBay listings from a product link or a barcode. A listing uses ${PRICING.JOBS.LISTING.credits} credits.`,
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
  // guides1: the list of guides, and each guide as an article with its place under Guides.
  if (path === ROUTES.GUIDES) {
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Guides for eBay sellers',
      url: `${SITE_ORIGIN}${ROUTES.GUIDES}`,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: GUIDES.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_ORIGIN}${guidePath(g.slug)}`, name: g.title })),
      },
    };
  }
  const guide = path.startsWith(`${ROUTES.GUIDES}/`) ? guideBySlug(path.slice(ROUTES.GUIDES.length + 1)) : null;
  if (guide) {
    const url = `${SITE_ORIGIN}${guidePath(guide.slug)}`;
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: guide.title,
        description: guide.description,
        abstract: guide.short,
        url,
        mainEntityOfPage: url,
        image: OG_IMAGE,
        datePublished: guide.published,
        dateModified: guide.checked,
        inLanguage: 'en-GB',
        author: { '@type': 'Person', name: 'Joseph', jobTitle: 'Founder', worksFor: { '@type': 'Organization', name: BRAND.NAME, url: `${SITE_ORIGIN}/` } },
        publisher: { '@type': 'Organization', name: BRAND.NAME, url: `${SITE_ORIGIN}/`, logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/favicon/logo512.png` } },
        citation: guide.sources.map((s) => s.url),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Guides', item: `${SITE_ORIGIN}${ROUTES.GUIDES}` },
          { '@type': 'ListItem', position: 2, name: guide.title, item: url },
        ],
      },
    ];
  }
  // help1: the help pages, and each as a how-to article with its video once it is up.
  if (path === ROUTES.HELP) {
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Remvo help',
      url: `${SITE_ORIGIN}${ROUTES.HELP}`,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: HELP.map((h, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_ORIGIN}${helpPath(h.slug)}`, name: h.title })),
      },
    };
  }
  const help = path.startsWith(`${ROUTES.HELP}/`) ? helpBySlug(path.slice(ROUTES.HELP.length + 1)) : null;
  if (help) {
    const url = `${SITE_ORIGIN}${helpPath(help.slug)}`;
    const poster = `${SITE_ORIGIN}${help.poster}`;
    const org = { '@type': 'Organization', name: BRAND.NAME, url: `${SITE_ORIGIN}/`, logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/favicon/logo512.png` } };
    const video = help.video && {
      '@type': 'VideoObject',
      name: help.title,
      description: help.description,
      thumbnailUrl: [poster],
      uploadDate: help.uploaded,
      duration: isoDuration(help.seconds),
      embedUrl: `https://www.youtube-nocookie.com/embed/${help.video}`,
      contentUrl: `https://www.youtube.com/watch?v=${help.video}`,
      publisher: org,
      inLanguage: 'en-GB',
    };
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: help.title,
        description: help.description,
        abstract: help.short,
        url,
        mainEntityOfPage: url,
        image: poster,
        dateModified: help.checked,
        inLanguage: 'en-GB',
        about: { '@type': 'SoftwareApplication', name: BRAND.NAME, applicationCategory: 'BusinessApplication', operatingSystem: 'Web', url: `${SITE_ORIGIN}/` },
        publisher: org,
        ...(video ? { video } : {}),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Help', item: `${SITE_ORIGIN}${ROUTES.HELP}` },
          { '@type': 'ListItem', position: 2, name: help.title, item: url },
        ],
      },
    ];
  }
  // tools1: a free web tool, and its questions, as the page shows them.
  if (path === ROUTES.FEES_US || path === ROUTES.FEES_UK) {
    const uk = path === ROUTES.FEES_UK;
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: uk ? 'eBay UK fee calculator' : 'eBay fee calculator',
        url: `${SITE_ORIGIN}${path}`,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: uk ? 'GBP' : 'USD' },
        publisher: { '@type': 'Organization', name: BRAND.NAME, url: `${SITE_ORIGIN}/` },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ[uk ? 'UK' : 'US'].map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      },
    ];
  }
  return null;
}
