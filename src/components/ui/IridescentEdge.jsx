import styles from '@styles/ui/iridescent-edge.module.css';

/* Renders a hairline iridescent gold border on the parent surface
 * via an absolutely positioned ::after pseudo-element on this div.
 * Wrap content with <IridescentEdge radius="lg">...</IridescentEdge>
 * or use as an absolute overlay with `overlay` prop.
 *
 * Static. Never animated. The eye reads "alive" from the asymmetric
 * warm-cool gradient, not from movement.
 */
export function IridescentEdge({ radius = 'lg', strength = 'soft', className = '' }) {
  const cls = [
    styles.edge,
    styles[`radius-${radius}`],
    styles[`strength-${strength}`],
    className,
  ].filter(Boolean).join(' ');
  return <div className={cls} aria-hidden="true" />;
}
