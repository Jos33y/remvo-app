import { motion } from 'motion/react';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { easeOut } from '@utils/motion';
import styles from '@styles/ui/logo.module.css';

/**
 * Remvo logomark + wordmark.
 *
 * @param {object} props
 * @param {'gold'|'white'} [props.variant='gold']
 *   Mark colour. Always explicit. The vault mark is the brand
 *   signature and never inherits from canvas.
 * @param {'auto'|'gold'|'white'|'dark'} [props.tone='auto']
 *   Wordmark colour. 'auto' inherits currentColor from the parent.
 * @param {'small'|'default'|'large'|'xlarge'} [props.size='default']
 * @param {boolean} [props.showWordmark=true]
 * @param {string|null} [props.href='/']
 * @param {boolean} [props.animated=false]
 *   When true, the three vault planes draw in sequence on mount
 *   (bottom → middle → top, 200ms each), then a left-to-right
 *   gold light sweeps the wordmark (800ms). Total 1.4s. Used by
 *   LandingPage as the screen's signature moment. Reduced motion
 *   mounts at final state. Other call sites pass this prop nowhere
 *   so the static path is fully backwards compatible.
 */
export function Logo({
  variant = 'gold',
  tone = 'auto',
  size = 'default',
  showWordmark = true,
  href = '/',
  animated = false,
}) {
  const reduced = useReducedMotion();
  const markFill = variant === 'gold' ? '#C9A84C' : '#FFFFFF';
  const className = [
    styles.logo,
    styles[size],
    tone !== 'auto' && styles[`tone-${tone}`],
    animated && styles.animated,
  ].filter(Boolean).join(' ');

  // Static path: identical to pre-Phase-5 Logo. Hardcoded plane opacities.
  const StaticMark = (
    <svg
      className={styles.mark}
      viewBox="0 0 40 48"
      fill={markFill}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <polygon points="20,6 32,13 20,20 8,13" opacity="1" />
      <polygon points="20,12 32,19 20,26 8,19" opacity="0.55" />
      <polygon points="20,18 32,25 20,32 8,25" opacity="0.25" />
    </svg>
  );

  // Animated path: each plane is its own motion.polygon, drawn in
  // sequence from base to top. Final opacities match the static
  // hierarchy (1 / 0.55 / 0.25) so the resting state is identical.
  const AnimatedMark = (
    <svg
      className={styles.mark}
      viewBox="0 0 40 48"
      fill={markFill}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <motion.polygon
        points="20,18 32,25 20,32 8,25"
        initial={reduced ? { opacity: 0.25 } : { opacity: 0 }}
        animate={{ opacity: 0.25 }}
        transition={{ duration: reduced ? 0 : 0.2, delay: reduced ? 0 : 0, ease: easeOut }}
      />
      <motion.polygon
        points="20,12 32,19 20,26 8,19"
        initial={reduced ? { opacity: 0.55 } : { opacity: 0 }}
        animate={{ opacity: 0.55 }}
        transition={{ duration: reduced ? 0 : 0.2, delay: reduced ? 0 : 0.2, ease: easeOut }}
      />
      <motion.polygon
        points="20,6 32,13 20,20 8,13"
        initial={reduced ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.2, delay: reduced ? 0 : 0.4, ease: easeOut }}
      />
    </svg>
  );

  const Mark = animated ? AnimatedMark : StaticMark;

  // Wordmark: when animated, wrap in a span carrying the gold sweep
  // class so the CSS keyframe runs. Reduced motion skips the sweep
  // via the @media (prefers-reduced-motion) override in the stylesheet.
  const wordmark = showWordmark && (
    <span className={`${styles.wordmark} ${animated ? styles.wordmarkSweep : ''}`}>
      REMVO
    </span>
  );

  const content = (<>{Mark}{wordmark}</>);

  if (href === null) {
    return (
      <span className={className} role="img" aria-label="Remvo">
        {content}
      </span>
    );
  }

  return (
    <a href={href} className={className} aria-label="Remvo home">
      {content}
    </a>
  );
}
