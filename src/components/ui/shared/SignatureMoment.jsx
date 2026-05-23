import { motion } from 'motion/react';
import { durSignature, easeOut } from '@utils/motion';
import { useReducedMotion } from '@hooks/useReducedMotion';

/* Standardises the one signature moment per screen. Wraps a single
 * element. Final state IS the design — motion is the journey to it.
 * Reduced motion mounts in final state instantly. */
export function SignatureMoment({
  name,
  initial,
  animate,
  duration = durSignature,
  delay = 0,
  children,
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      data-signature={name}
      initial={reduced ? animate : initial}
      animate={animate}
      transition={{ duration: reduced ? 0 : duration, delay: reduced ? 0 : delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}
