import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useCountdown } from '@hooks/useCountdown';
import { IconDot } from '@components/ui/icons/IconDot';
import { pulse, easeOut } from '@utils/motion';
import styles from '@styles/ui/checkout/payment-status-bar.module.css';

/* ──────────────────────────────────────────────────────────────────
 * PaymentStatusBar
 *
 * Inline status + countdown:  [● Waiting for your transfer  ·  29:42]
 *
 * Dot behaviour by status:
 *   pending    -> 10px, pulsing (scale 1 -> 1.08 -> 1, infinite)
 *   processing -> 12px (scale 1.2), held, no pulse
 *   completed  -> 12px (scale 1.2), held, no pulse
 *
 * The scale-up during processing is the "the system noticed"
 * confirmation gesture. 600ms ease-out, holds at destination.
 *
 * Countdown hidden during processing/completed. Screen holds breath.
 *
 * @param {{
 *   status: 'pending' | 'processing' | 'completed',
 *   expiresAt: string | null,
 *   onExpire?: () => void,
 * }} props
 * ────────────────────────────────────────────────────────────────── */

const STATUS_LABELS = {
  pending: 'Waiting for your transfer',
  processing: 'Payment received, confirming',
  completed: 'Payment confirmed',
};

/* Shown while the server still reports 'pending' but the window has
 * closed. The PSP account is already dead, so "waiting for your
 * transfer" is untrue and invites someone to send money into a void.
 * Deliberately not "expired": the server has not said so yet, and a
 * transfer that landed just before the deadline may still confirm. */
const WINDOW_CLOSED_LABEL = 'Transfer window closed';

function getThreshold(totalSeconds) {
  if (totalSeconds <= 0) return 'expired';
  if (totalSeconds < 60) return 'urgent';
  if (totalSeconds <= 5 * 60) return 'default';
  return 'calm';
}

export function PaymentStatusBar({ status = 'pending', expiresAt, onExpire }) {
  const prefersReducedMotion = useReducedMotion();
  const showCountdown = status === 'pending' && Boolean(expiresAt);
  const isSettled = status === 'processing' || status === 'completed';

  const { minutes, seconds, expired } = useCountdown(
    showCountdown ? expiresAt : null
  );

  const totalSeconds = minutes * 60 + seconds;
  const threshold = getThreshold(totalSeconds);
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const dateTime = `PT${minutes}M${seconds}S`;

  /* ── onExpire with wall-clock recheck ── */
  const expireFiredRef = useRef(false);

  useEffect(() => {
    expireFiredRef.current = false;
  }, [expiresAt]);

  useEffect(() => {
    if (!expired || expireFiredRef.current) return;
    if (!expiresAt) return;
    if (new Date(expiresAt).getTime() > Date.now()) return;
    if (typeof onExpire !== 'function') return;
    expireFiredRef.current = true;
    onExpire();
  }, [expired, expiresAt, onExpire]);

  /* ── Throttled SR announcement ── */
  const [announcement, setAnnouncement] = useState('');
  const lastBucketRef = useRef(null);

  useEffect(() => {
    if (!showCountdown || totalSeconds <= 0) return;
    const bucket = Math.floor(totalSeconds / 30);
    if (lastBucketRef.current !== bucket) {
      lastBucketRef.current = bucket;
      const m = minutes;
      const s = seconds;
      const minutePart = m > 0 ? `${m} ${m === 1 ? 'minute' : 'minutes'}` : '';
      const secondPart = `${s} ${s === 1 ? 'second' : 'seconds'}`;
      const joined = [minutePart, secondPart].filter(Boolean).join(' ');
      setAnnouncement(`${joined} remaining`);
    }
  }, [showCountdown, totalSeconds, minutes, seconds]);

  const windowClosed = status === 'pending' && expired;
  const label = windowClosed
    ? WINDOW_CLOSED_LABEL
    : (STATUS_LABELS[status] ?? STATUS_LABELS.pending);

  const indicatorClassName = `${styles.indicator} ${
    windowClosed ? styles.closed : styles[status]
  }`;
  const countdownClassName = `${styles.countdown} ${styles[threshold]}`;

  /* ── Dot motion config ──
   * Pending: pulsing at natural size (10px icon)
   * Processing/completed: scale up to 1.2 (10 -> 12px visual),
   *   600ms ease-out, hold. The "system noticed" gesture. */
  /* The pulse means "we are still watching for your money". Once the
   * window has closed that is no longer true, so it holds still. */
  const dotAnimate = isSettled
    ? { scale: 1.2 }
    : (prefersReducedMotion || windowClosed ? {} : pulse);
  const dotTransition = isSettled
    ? { duration: 0.6, ease: easeOut }
    : undefined;

  return (
    <div className={styles.bar} role="status" aria-live="polite">
      <span className={indicatorClassName}>
        <motion.span
          className={styles.dot}
          animate={dotAnimate}
          transition={dotTransition}
        >
          <IconDot size={10} />
        </motion.span>
        <span className={styles.statusLabel}>{label}</span>
      </span>

      {showCountdown && (
        <>
          <span className={styles.separator} aria-hidden="true">
            ·
          </span>
          <time
            className={countdownClassName}
            dateTime={dateTime}
            aria-label={`${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ${seconds} ${seconds === 1 ? 'second' : 'seconds'} remaining`}
          >
            {mm}:{ss}
          </time>
        </>
      )}

      <span className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </div>
  );
}
