import { useEffect } from 'react';

/* Signals main.jsx that the lazy chunk has mounted, so the
 * app-loader element in index.html can fade out. Lives inside the
 * Suspense boundary so its useEffect fires only AFTER the chunk
 * resolves and renders real content. main.jsx coordinates this
 * with the fonts.ready signal so the loader dismisses only when
 * BOTH conditions are met. */
export function LoaderDismisser() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window.__remvoSignalAppMounted === 'function'
    ) {
      window.__remvoSignalAppMounted();
    }
  }, []);
  return null;
}
