import { useSession } from '@context/SessionContext';
import styles from '@styles/ui/dev-simulate-button.module.css';

/* ──────────────────────────────────────────────────────────────────
 * DevSimulateButton
 *
 * Dev-only "Simulate payment" button. Two independent visibility
 * guards make it impossible to ship to production:
 *
 *   1. import.meta.env.DEV — Vite tree-shakes the entire branch from
 *      production builds. The string "Simulate payment" never appears
 *      in dist/*.js after a `vite build`.
 *
 *   2. Hostname check — even in the worst case where DEV is somehow
 *      true on a production deployment, the hostname check refuses
 *      to render on remvo.app or pay.remvo.app.
 *
 * Belt and braces. Either guard alone is sufficient; both together
 * mean the button cannot reach a real user.
 *
 * Visual: a fixed pill in the bottom-right with a dashed border and
 * backdrop blur. The dashed border + monospace label communicates
 * "this is a dev tool" at a glance. Sits above the safe-area inset
 * on iOS so it never overlaps the home indicator.
 *
 * No motion library wrapping. Pure CSS transitions. The dev sees
 * this button hundreds of times during testing — it should be as
 * fast and unobtrusive as possible.
 * ────────────────────────────────────────────────────────────────── */

export function DevSimulateButton() {
  const { session, mockConfirmPayment } = useSession();

  /* Guard 1: Vite tree-shakes everything below this line out of
     production builds. The whole component compiles to `null`. */
  if (!import.meta.env.DEV) return null;

  /* Guard 2: even if DEV is somehow true in a production deploy,
     refuse to render on the public hostnames. */
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'remvo.app' || host === 'pay.remvo.app') return null;
  }

  /* mockConfirmPayment is a no-op when session is not pending,
     but disable the button visually so the dev knows. */
  const disabled = !session || session.status !== 'pending';

  return (
    <button
      type="button"
      className={styles.button}
      onClick={mockConfirmPayment}
      disabled={disabled}
      aria-label="Developer tool: simulate payment confirmation webhook"
    >
      DEV · Simulate payment
    </button>
  );
}
