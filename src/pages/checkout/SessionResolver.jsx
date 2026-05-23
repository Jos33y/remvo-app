import { useSession } from '@context/SessionContext';
/* PHASE_7F_S4_CHECKOUT_EVENTS */
import { useCheckoutViewEvent } from '@hooks/useCheckoutEvent';
import { CHECKOUT_EVENTS } from '@lib/checkoutEventsClient';
import { SelectPage } from './SelectPage';
import { ConfirmPage } from './ConfirmPage';
import { CompletePage } from './CompletePage';
import { ExpiredPage } from './ExpiredPage';
import { AlreadyPaidPage } from './AlreadyPaidPage';
import { InvalidPage } from './InvalidPage';
import { CountryComingSoonPage } from './CountryComingSoonPage';
/* PHASE_7F_S5_CHECKOUT_API */
import { PaymentIssuePage } from './PaymentIssuePage';

/* ──────────────────────────────────────────────────────────────────
 * SessionResolver
 *
 * Mounts at /:token (index) and /:token/complete. Reads session
 * state from context and renders the correct page.
 *
 * Routing logic:
 *   invalid                              -> InvalidPage
 *   expired                              -> ExpiredPage
 *   failed                               -> PaymentIssuePage
 *   country_not_active                   -> CountryComingSoonPage
 *   completed + !completed_in_session    -> AlreadyPaidPage
 *   completed + completed_in_session     -> CompletePage
 *   processing                           -> ConfirmPage
 *   pending + select mode + amount == 0  -> SelectPage
 *   pending + anything else              -> ConfirmPage
 *
 * Status vocabulary note (PHASE_7F_S5):
 *   These are the SessionContext statuses. ApiSessionProvider
 *   translates the backend vocabulary into them (confirmed ->
 *   completed, a 404 -> invalid). 'failed' is the amount-mismatch
 *   terminal state | a transfer arrived but the amount did not
 *   match the locked order. 'processing' only ever occurs under
 *   MockSessionProvider; the real backend goes pending -> confirmed
 *   directly.
 *
 * Why amount-gated: checkout_mode records the session ORIGIN and
 * never flips. SelectPage vs ConfirmPage is decided by whether an
 * amount has been chosen. Under the API provider checkout_mode is
 * always 'preset' (the platform sets the amount at init), so the
 * SelectPage branch is mock-only.
 *
 * country_not_active is terminal for this session: the user's
 * country is coming_soon or paused and no checkout is possible.
 * ────────────────────────────────────────────────────────────────── */

export function SessionResolver() {
  const { session } = useSession();

  /* checkout.open | fires once when the session id is first
   * observed, regardless of which status the resolver routes to.
   * This is the "user reached our checkout with a valid session"
   * signal | step 2 of the funnel. */
  useCheckoutViewEvent(CHECKOUT_EVENTS.CHECKOUT_OPEN, session?.session_id);

  if (!session) return null;

  switch (session.status) {
    case 'invalid':
      return <InvalidPage />;

    case 'expired':
      return <ExpiredPage />;

    case 'failed':
      return <PaymentIssuePage />;

    case 'country_not_active':
      return <CountryComingSoonPage />;

    case 'completed':
      return session.completed_in_session
        ? <CompletePage />
        : <AlreadyPaidPage />;

    case 'processing':
      return <ConfirmPage />;

    case 'pending':
      return (session.checkout_mode === 'select' && session.amount_usd_card === 0)
        ? <SelectPage />
        : <ConfirmPage />;

    default:
      return <InvalidPage />;
  }
}
