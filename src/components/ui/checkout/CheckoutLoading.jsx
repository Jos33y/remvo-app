import { motion, useReducedMotion } from 'motion/react';

/* ──────────────────────────────────────────────────────────────────
 * CheckoutLoading
 *
 * PHASE_7F_S5_CHECKOUT_API
 *
 * Shown by ApiSessionProvider for the ~200-400ms while the first
 * GET /v1/checkout/session/:id is in flight. Without it the screen
 * is a blank flash before the resolved page mounts.
 *
 * Design rules honoured:
 *   - No spinner (banned). A calm skeleton instead.
 *   - Flat surface, no shadow, hairline only.
 *   - Obsidian canvas | faint white blocks (the shell sets the
 *     dark background; these read as muted placeholders on it).
 *   - prefers-reduced-motion | the opacity breathe is dropped, the
 *     blocks render static.
 *
 * Self-contained inline styles | a transient pre-content state with
 * no token or CSS-module dependency, so it cannot drift if a class
 * is renamed elsewhere.
 * ────────────────────────────────────────────────────────────────── */

const BLOCK = {
  borderRadius: 12,
  background: 'rgba(255, 255, 255, 0.06)',
};

const BREATHE = { opacity: [0.45, 0.85, 0.45] };
const BREATHE_T = { duration: 1.6, ease: 'easeInOut', repeat: Infinity };

export function CheckoutLoading() {
  const reduced = useReducedMotion();
  const animate = reduced ? { opacity: 0.6 } : BREATHE;
  const transition = reduced ? undefined : BREATHE_T;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: '100%',
        maxWidth: 340,
        margin: '0 auto',
        padding: '24px 0',
      }}
      aria-hidden="true"
    >
      {/* Card-shaped placeholder | 17:10, mirrors RemvoCard. */}
      <motion.div
        style={{ ...BLOCK, width: '100%', aspectRatio: '17 / 10' }}
        animate={animate}
        transition={transition}
      />
      {/* Amount + line placeholders. */}
      <motion.div
        style={{ ...BLOCK, width: '60%', height: 28 }}
        animate={animate}
        transition={transition}
      />
      <motion.div
        style={{ ...BLOCK, width: '40%', height: 16 }}
        animate={animate}
        transition={transition}
      />
      <span
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
        }}
        aria-hidden="false"
      >
        Loading your checkout
      </span>
    </div>
  );
}
