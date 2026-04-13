import styles from '@styles/ui/faceted-surface.module.css';

/* Single angled wedge across the canvas. Top-right to bottom-left
 * diagonal. ~3% opacity. Does not move. Reads as light catching a
 * facet, not as decoration. Mounted once per canvas variant. */
export function FacetedSurface({ variant = 'obsidian' }) {
  return (
    <svg
      className={`${styles.facet} ${styles[variant]}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polygon points="100,0 100,60 0,100 0,40" />
    </svg>
  );
}
