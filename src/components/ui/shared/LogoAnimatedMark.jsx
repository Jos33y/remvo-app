import { motion } from 'motion/react';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { easeOut } from '@utils/motion';
import styles from '@styles/ui/shared/logo.module.css';

/* The vault mark drawn plane by plane, for <Logo animated />. Its own
 * file, loaded only when asked for, so motion (about 70 KB gzipped)
 * never reaches the marketing site or any page with a still logo.
 * Each plane is a motion.polygon, drawn in sequence from base to top.
 * Final opacities match the static hierarchy (1 / 0.55 / 0.25) so the
 * resting state is identical. */
export default function LogoAnimatedMark({ markFill }) {
  const reduced = useReducedMotion();
  return (
    <svg
      className={styles.mark}
      viewBox="0 0 40 40"
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
}
