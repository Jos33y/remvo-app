import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App, hostApp } from './app/App';

/* ── Fonts (self-hosted via fontsource, no external CDN) ── */
import '@fontsource-variable/geist';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/600.css';

/* ── Base styles (order matters: reset -> tokens -> global) ── */
import './styles/base/reset.css';
import './styles/base/tokens.css';
import './styles/base/global.css';

/* ──────────────────────────────────────────────────────────────────
 * Loader dismissal — coordinated between fonts.ready AND App mount.
 *
 * Before code splitting, dismissing on fonts.ready alone was safe
 * because the entire app rendered synchronously after main.jsx ran.
 *
 * After code splitting, the router chunk arrives over the network
 * AFTER main.jsx executes. If we dismissed on fonts.ready alone,
 * the user would see: loader fades -> blank screen -> chunk arrives
 * -> real UI flashes in. That gap is ugly.
 *
 * Now the loader stays visible until BOTH:
 *   1. Web fonts are ready (avoids font-flash on first paint)
 *   2. The lazy router chunk has mounted (avoids blank-screen flash)
 *
 * App.jsx pings window.__remvoSignalAppMounted from a useEffect
 * inside the Suspense subtree, which only fires after the chunk
 * resolves AND renders.
 * ────────────────────────────────────────────────────────────────── */

let fontsReady = false;
let appMounted = false;
let dismissed  = false;

function maybeDismissLoader() {
  if (!fontsReady || !appMounted || dismissed) return;
  dismissed = true;

  const loader = document.getElementById('app-loader');
  if (!loader) return;

  loader.classList.add('hidden');
  loader.addEventListener('transitionend', () => loader.remove(), { once: true });

  /* Fallback: if reduced motion is on, transitionend never fires */
  setTimeout(() => {
    if (document.getElementById('app-loader')) loader.remove();
  }, 400);
}

window.__remvoSignalAppMounted = () => {
  appMounted = true;
  maybeDismissLoader();
};

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    fontsReady = true;
    maybeDismissLoader();
  });
} else {
  /* Fallback for browsers without the Font Loading API */
  window.addEventListener('load', () => {
    fontsReady = true;
    maybeDismissLoader();
  });
}

/* A marketing page arrives pre-rendered (prerender/run.mjs): React
 * takes over the HTML that is already there instead of drawing it
 * again. Everything else (my.remvo.app, admin, the dev server) starts
 * from an empty root, as before. */
const rootEl = document.getElementById('root');
const tree = (
  <StrictMode>
    <App />
  </StrictMode>
);
if (rootEl.hasChildNodes() && hostApp() === 'marketing') {
  hydrateRoot(rootEl, tree, {
    // Logged so a page that drifts from its pre-render is noticed; React has already recovered.
    onRecoverableError: (err) => console.warn('remvo: hydration', err?.message ?? err),
  });
} else {
  // Any other app starts clean, even if a server handed it a marketing
  // page (a host the Caddyfile does not route to app.html).
  rootEl.replaceChildren();
  createRoot(rootEl).render(tree);
}
