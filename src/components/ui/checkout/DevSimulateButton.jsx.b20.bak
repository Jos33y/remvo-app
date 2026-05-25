import { useSession } from '@context/SessionContext';
/* PHASE_7F_S5_CHECKOUT_API */
import { IS_CHECKOUT_API } from '@lib/checkoutMode';
import styles from '@styles/ui/checkout/dev-simulate-button.module.css';

/* ──────────────────────────────────────────────────────────────────
 * DevSimulateButton
 *
 * Dev-only "Simulate payment" button. Three independent visibility
 * guards make it impossible to ship to a real user:
 *
 *   1. import.meta.env.DEV | Vite tree-shakes the entire branch from
 *      production builds. The string "Simulate payment" never appears
 *      in dist/*.js after a `vite build`.
 *
 *   2. Hostname check | even if DEV is somehow true on a production
 *      deploy, the hostname check refuses to render on remvo.app or
 *      pay.remvo.app.
 *
 *   3. IS_CHECKOUT_API (PHASE_7F_S5) | when the checkout tree runs
 *      against the real backend, simulating a payment is meaningless:
 *      confirmation comes from a Monnify webhook, not a button. The
 *      provider's mockConfirmPayment is a no-op in API mode, so the
 *      button would render but do nothing | confusing. Hide it.
 *
 * Belt and braces. Any guard alone is sufficient.
 *
 * Visual: a fixed pill in the bottom-right with a dashed border and
 * backdrop blur. The dashed border + monospace label communicates
 * "this is a dev tool" at a glance. Sits above the safe-area inset
 * on iOS so it never overlaps the home indicator.
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

  /* Guard 3: in checkout API mode the button has nothing to do |
     real confirmation is webhook-driven. */
  if (IS_CHECKOUT_API) return null;

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
