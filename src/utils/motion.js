/* Central motion config. Phase 5 adds durFocusPull + durSignature. */

export const easeOut = [0.16, 1, 0.3, 1];
export const easeSnap = [0.4, 0, 0.2, 1];
export const easeSmooth = [0.4, 0, 0.6, 1];

export const durFast = 0.15;
export const durNormal = 0.3;
export const durSlow = 0.5;
export const durPulse = 1.5;
export const durFocusPull = 0.7;   // PHASE 5 — screen-to-screen focus pull
export const durSignature = 1.4;   // PHASE 5 — per-screen signature moment

export const staggerParent = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export const reveal = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: durSlow, ease: easeOut } },
};

export const crossFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25, ease: easeOut },
};

export const pulse = {
  scale: [1, 1.08, 1],
  transition: { duration: durPulse, repeat: Infinity, ease: easeSmooth },
};
