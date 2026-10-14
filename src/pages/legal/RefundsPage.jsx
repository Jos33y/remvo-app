import { LegalPageLayout, Clause } from '@components/layout/marketing/LegalPageLayout';
import { BRAND, PRICING, LEGAL_UPDATED } from '@utils/constants';

/* Refund policy. Plain and complete on purpose: Polar's buyer terms
 * apply "the applicable refund policy", which is this page, and a
 * policy full of conditions is the most common reason a merchant of
 * record turns an application down. */
export function RefundsPage() {

  const days = PRICING.REFUND_DAYS;

  return (
    <LegalPageLayout
      title="Refund Policy"
      date={LEGAL_UPDATED.label}
      dateTime={LEGAL_UPDATED.iso}
      version={LEGAL_UPDATED.version}
      preamble={<>Three rules, and a note on free credits. That is the whole policy.</>}
    >
      <Clause id="failed" heading="1. A job that fails">
        <p>If a job cannot produce a listing, its credits go back to your balance automatically. You do not need to ask.</p>
      </Clause>

      <Clause id="unused" heading="2. Credits you have not used">
        <p>Ask within {days} days of a top-up and we refund every credit from that top-up you have not used, in full.</p>
      </Clause>

      <Clause id="listing" heading="3. A listing you are not happy with">
        <p>Tell us within {days} days of the job and we return the credits it used to your balance.</p>
      </Clause>

      <Clause id="welcome" heading="4. Welcome credits">
        <p>The {PRICING.WELCOME.credits} credits a new account starts with are free, so there is nothing to refund. A listing that fails gives them back to your balance, as it does any credits.</p>
      </Clause>

      <Clause id="how" heading="How to ask">
        <p>Write to {BRAND.EMAIL} from the email address on your account, or reply to your receipt. For a listing, include the job reference shown on it.</p>
        <p>Money is refunded to the card you paid with, through Polar, our merchant of record. Your bank usually shows it within 5 to 10 working days.</p>
      </Clause>
    </LegalPageLayout>
  );
}
