import { useEffect } from 'react';
import {
  LegalPageLayout,
  Clause,
} from '@components/layout/LegalPageLayout';
import { BRAND } from '@utils/constants';

export function RefundsPage() {
  useEffect(() => {
    document.title = 'Remvo | Refund Policy';
  }, []);

  return (
    <LegalPageLayout
      title="Refund Policy"
      date="3 April 2026"
      dateTime="2026-04-03"
      version="v1.0"
      preamble={
        <>
          This Refund Policy describes when and how refunds are processed for
          transactions made through the {BRAND.NAME} checkout service operated
          by {BRAND.LEGAL_NAME}.
        </>
      }
    >
      <Clause id="when" heading="1. When refunds apply">
        <p>1.1. A refund is initiated when payment is received from you but the transaction cannot be completed on the {BRAND.NAME} side. This may occur due to a system error during processing, the partner platform being unable to accept the credit, or a settlement failure that cannot be resolved within a reasonable timeframe.</p>
        <p>1.2. Refunds are not issued for completed transactions where the dollar credit has been successfully applied to your account on the partner platform. Disputes about credited balances should be directed to the partner platform.</p>
        <p>1.3. Expired checkout sessions where no payment was received do not result in a refund because no funds were collected.</p>
      </Clause>

      <Clause id="process" heading="2. Refund process">
        <p>2.1. When a refund is triggered, {BRAND.NAME} initiates the return of funds to the original bank account from which the payment was made.</p>
        <p>2.2. Refunds are processed within five (5) business days of the triggering event. In most cases, refunds are completed within two (2) to three (3) business days.</p>
        <p>2.3. You will see the refund as a credit to your bank account. The reference will include the original transaction reference for traceability.</p>
        <p>2.4. The partner platform is notified of the refund via webhook. If a credit was applied to your platform account, the platform may reverse it.</p>
      </Clause>

      <Clause id="amount" heading="3. Refund amount">
        <p>3.1. Refunds are processed in the original currency (Naira) to the original payment source.</p>
        <p>3.2. The refund amount is the full Naira amount you paid, less any irrecoverable payment processing fees charged by the payment provider (Monnify). At the time of writing, this fee is ₦500 or less per transaction.</p>
        <p>3.3. Refunds are processed in Naira only and cannot be issued in any other currency or denomination. The conversion rate at the time of refund may differ from the rate at the time of the original transaction. This difference does not affect the Naira refund amount.</p>
      </Clause>

      <Clause id="destination" heading="4. Refund destination">
        <p>4.1. Refunds are returned to the same bank account from which the original payment was made. We cannot send refunds to a different bank account.</p>
        <p>4.2. If the originating bank account has been closed, the refund will be returned by the bank to {BRAND.NAME}. In this case, contact {BRAND.EMAIL} with your transaction reference and updated bank details. We will process the refund manually within ten (10) business days.</p>
      </Clause>

      <Clause id="platform-initiated" heading="5. Platform-initiated refunds">
        <p>5.1. If the partner platform requests a refund on your behalf (for example, due to a dispute), the platform submits the request to {BRAND.NAME} within forty-eight (48) hours of the original transaction.</p>
        <p>5.2. Platform-initiated refund requests submitted after the forty-eight (48) hour window are reviewed on a case-by-case basis and may not be approved.</p>
        <p>5.3. {BRAND.NAME} processes approved platform-initiated refunds within five (5) business days.</p>
      </Clause>

      <Clause id="not-covered" heading="6. What is not covered">
        <p>6.1. Bank charges incurred by you when making the original transfer are not refundable by {BRAND.NAME}.</p>
        <p>6.2. Exchange rate differences between the time of the original transaction and the time of refund are not compensated.</p>
        <p>6.3. Losses arising from your use of the credited funds on the partner platform (for example, trading losses) are not the responsibility of {BRAND.NAME}.</p>
        <p>6.4. Refunds cannot be processed if {BRAND.NAME} reasonably believes the transaction was fraudulent or in violation of the Terms of Service.</p>
      </Clause>

      <Clause id="disputes" heading="7. Disputes">
        <p>7.1. If you have not received a refund within seven (7) business days of the expected timeframe, email {BRAND.EMAIL} with your transaction reference number.</p>
        <p>7.2. For disputes about the amount credited to your partner platform account, contact the platform directly. The platform holds your account and controls your balance.</p>
        <p>7.3. {BRAND.NAME} cooperates with partner platforms to resolve refund disputes promptly.</p>
      </Clause>

      <Clause id="contact" heading="8. Contact">
        <p>8.1. For refund enquiries, email {BRAND.EMAIL} with the subject line &quot;Refund&quot; and include your transaction reference number.</p>
        <p>8.2. Response time for refund enquiries: within two (2) business days.</p>
      </Clause>
    </LegalPageLayout>
  );
}
