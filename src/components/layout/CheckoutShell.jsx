import { ScrollToTop } from './ScrollToTop';
import { CheckoutHeader } from './CheckoutHeader';
import { CheckoutFooter } from './CheckoutFooter';
import { FacetedSurface } from '@components/ui/FacetedSurface';
import { VaultWatermark } from '@components/ui/VaultWatermark';
import styles from '@styles/layout/checkout-shell.module.css';

/* PHASE 5 — adds `canvas` prop. Backwards compatible: defaults to
 * 'warm'. Pages opt into 'obsidian' (premium void) or 'edge'
 * (recovery surface — warm with quieter facet + watermark, not
 * dead beige paper). Material is present on every canvas; only
 * the loudness changes.
 */
export function CheckoutShell({
  children,
  platformName,
  hideFooter = false,
  wide = false,
  canvas = 'warm',
}) {
  const innerClass = wide ? `${styles.inner} ${styles.innerWide}` : styles.inner;

  // FacetedSurface variant: obsidian gets the dark facet, warm and
  // edge both get the warm facet (edge is just quieter via CSS).
  const facetVariant = canvas === 'obsidian' ? 'obsidian' : 'warm';

  return (
    <div className={styles.shell} data-canvas={canvas}>
      <ScrollToTop />
      <a href="#checkout-main" className={styles.skipLink}>Skip to content</a>

      {/* Material on every canvas. Edge gets the same primitives as
          warm, scaled down via the per-canvas opacity overrides in
          faceted-surface.module.css and vault-watermark.module.css. */}
      <FacetedSurface variant={facetVariant} />
      <VaultWatermark />

      <CheckoutHeader platformName={platformName} />
      <main id="checkout-main" className={styles.main}>
        <div className={innerClass}>{children}</div>
      </main>
      {!hideFooter && <CheckoutFooter />}
    </div>
  );
}
