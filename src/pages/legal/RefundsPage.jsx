import { useEffect } from 'react';
import {
  LegalPageLayout,
  Clause,
} from '@components/layout/marketing/LegalPageLayout';
import { BRAND } from '@utils/constants';

export function RefundsPage() {
  useEffect(() => {
    document.title = 'Remvo | Refund Policy';
  }, []);

  return (
    <LegalPageLayout
      title="Refund Policy"
      date="18 September 2026"
      dateTime="2026-09-18"
      version="v1.3"
      preamble={
        <>
          This Refund Policy describes when and how refunds are processed for
          purchases made through the {BRAND.NAME} checkout service operated
          by {BRAND.LEGAL_NAME}. It forms part of our Terms of Service.
        </>
      }
    >
      <Clause id="when" heading="1. When refunds apply">
        <p>1.1. A refund is initiated when we have received your payment but your card cannot be applied to your account on the partner platform. This may happen because of a system error on our side, because the partner platform cannot accept the value, or because of an interruption to our service that we cannot resolve within a reasonable time.</p>
        <p>1.2. A refund is also initiated where we hold a transaction under clause 3.4 of our Terms of Service (payment sent from an account that is not in your name) and the enquiry is not resolved.</p>
        <p>1.3. Refunds are not issued for completed purchases where the value has been applied to your account on the partner platform. Questions about a credited balance should be directed to that platform, because they hold your account.</p>
        <p>1.4. Expired checkout sessions where no payment was received do not result in a refund, because no funds were collected.</p>
        <p>1.5. We may refuse a refund where we reasonably believe the transaction was fraudulent or in breach of our Terms of Service. In that case we will tell you why.</p>
      </Clause>

      <Clause id="process" heading="2. Refund process">
        <p>2.1. When a refund is triggered, we return the funds to the bank account from which your payment was made.</p>
        <p>2.2. Refunds are processed within five (5) business days of the triggering event. In most cases they complete within two (2) to three (3) business days.</p>
        <p>2.3. We contact you at the email address or phone number you gave at checkout to confirm that a refund has been initiated, and again when it has been sent.</p>
        <p>2.4. You will see the refund as a credit to your bank account. The reference includes your original transaction reference.</p>
        <p>2.5. The partner platform is notified of the refund. If value was already applied to your account there, the platform may reverse it.</p>
      </Clause>

      <Clause id="amount" heading="3. Refund amount">
        <p>3.1. Refunds are processed in Naira to the original payment source.</p>
        <p>3.2. The refund amount is the full Naira amount you paid, less any payment processing fees charged by our payment provider that we cannot recover. The exact fee for your transaction is recorded against your transaction reference and we will tell you the figure on request.</p>
        <p>3.3. Refunds are issued in Naira only. The rate at the time of refund may differ from the rate at the time of your purchase. This does not change the Naira amount refunded.</p>
      </Clause>

      <Clause id="destination" heading="4. Refund destination">
        <p>4.1. Refunds are returned to the same bank account from which the original payment was made. We cannot send a refund to a different account.</p>
        <p>4.2. If that account has been closed, the bank returns the funds to us. In that case, email {BRAND.EMAIL} with your transaction reference and your new bank details. Before we send the refund we will verify your identity against the details you gave at checkout and the name on the original sending account. The new account must be in the same name. We process verified refunds of this kind within ten (10) business days.</p>
        <p>4.3. We will not send a refund to an account in a different name from the one that paid.</p>
      </Clause>

      <Clause id="platform-initiated" heading="5. Platform-initiated refunds">
        <p>5.1. A partner platform may ask us to refund a purchase on behalf of one of its users, for example where the user has raised a dispute with the platform.</p>
        <p>5.2. Platform-initiated requests should be submitted within forty-eight (48) hours of the original transaction. Requests submitted later are considered on their merits and may not be approved, particularly where the value has already been used.</p>
        <p>5.3. Approved platform-initiated refunds are processed within five (5) business days and follow clauses 2, 3, and 4 of this policy.</p>
        <p>5.4. A platform cannot request a refund of a completed purchase for a reason relating to our settlement arrangements with that platform. Those arrangements are between us and the platform and do not affect a purchase you have already completed.</p>
      </Clause>

      <Clause id="not-covered" heading="6. What is not covered">
        <p>6.1. Bank charges you incur in making the original transfer are not refundable by {BRAND.NAME}.</p>
        <p>6.2. Rate differences between the time of purchase and the time of refund are not compensated.</p>
        <p>6.3. Losses arising from your use of the value on the partner platform, for example trading losses, are not our responsibility.</p>
      </Clause>

      <Clause id="disputes" heading="7. If something goes wrong">
        <p>7.1. If you have not received a refund within seven (7) business days of the expected date, email {BRAND.EMAIL} with your transaction reference.</p>
        <p>7.2. For disputes about the amount credited to your account on a partner platform, contact that platform directly. They hold your account and control your balance.</p>
        <p>7.3. We respond to refund enquiries within two (2) business days.</p>
      </Clause>

      <Clause id="contact" heading="8. Contact">
        <p>8.1. For refund enquiries, email {BRAND.EMAIL} with the subject line &quot;Refund&quot; and your transaction reference number.</p>
        <p>8.2. We hold your transaction record and can deal with you directly. You do not need to go through the partner platform.</p>
      </Clause>
    </LegalPageLayout>
  );
}
