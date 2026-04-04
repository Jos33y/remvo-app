import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';

/* ── Fonts (self-hosted via fontsource, no external CDN) ── */
import '@fontsource-variable/geist';
import '@fontsource/ibm-plex-mono/400.css';

/* ── Base styles (order matters: reset → tokens → global) ── */
import './styles/base/reset.css';
import './styles/base/tokens.css';
import './styles/base/global.css';

/* ── Dismiss loader after React mount + fonts ready ── */
function dismissLoader() {
  const loader = document.getElementById('app-loader');
  if (!loader) return;

  loader.classList.add('hidden');
  loader.addEventListener('transitionend', () => loader.remove(), { once: true });

  /* Fallback: if reduced motion is on, transition won't fire */
  setTimeout(() => {
    if (document.getElementById('app-loader')) loader.remove();
  }, 400);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

/* Wait for fonts to finish loading, then dismiss */
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(dismissLoader);
} else {
  /* Fallback for browsers without Font Loading API */
  window.addEventListener('load', dismissLoader);
}
