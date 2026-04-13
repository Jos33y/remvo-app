import { useSession } from '@context/SessionContext';
import { SelectPage } from './SelectPage';
import { ConfirmPage } from './ConfirmPage';
import { CompletePage } from './CompletePage';
import { ExpiredPage } from './ExpiredPage';
import { AlreadyPaidPage } from './AlreadyPaidPage';
import { InvalidPage } from './InvalidPage';

/* ──────────────────────────────────────────────────────────────────
 * SessionResolver
 *
 * Mounts at /:token (index) and /:token/complete. Reads session
 * state from context and renders the correct page.
 *
 * Routing logic:
 *   invalid                              -> InvalidPage
 *   expired                              -> ExpiredPage
 *   completed + !completed_in_session    -> AlreadyPaidPage
 *   completed + completed_in_session     -> CompletePage
 *   processing                           -> ConfirmPage
 *   pending + select mode + amount == 0  -> SelectPage
 *   pending + anything else              -> ConfirmPage
 *
 * Why amount-gated: checkout_mode records the session ORIGIN (how
 * the platform initialised it) and never flips. SelectPage vs
 * ConfirmPage is decided by whether an amount has been chosen yet.
 * This preserves the "came from SelectPage" signal that ConfirmPage
 * needs to show the "Change amount" link.
 * ────────────────────────────────────────────────────────────────── */

export function SessionResolver() {
  const { session } = useSession();

  if (!session) return null;

  switch (session.status) {
    case 'invalid':
      return <InvalidPage />;

    case 'expired':
      return <ExpiredPage />;

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
