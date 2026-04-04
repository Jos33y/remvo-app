import { useEffect } from 'react';
import {
  LegalPageLayout,
  Clause,
} from '@components/layout/LegalPageLayout';
import { ROUTES, BRAND } from '@utils/constants';

export function TermsPage() {
  useEffect(() => {
    document.title = 'Remvo | Terms of Service';
  }, []);

  return (
    <LegalPageLayout
      title="Terms of Service"
      date="3 April 2026"
      dateTime="2026-04-03"
      version="v1.0"
      preamble={
        <>
          These Terms of Service (&quot;Terms&quot;) govern the use of the
          {' '}{BRAND.NAME} checkout service operated by {BRAND.LEGAL_NAME}
          (&quot;we&quot;, &quot;us&quot;, &quot;the Provider&quot;). By
          completing a transaction through the {BRAND.NAME} checkout, you
          (&quot;user&quot;, &quot;you&quot;) agree to these Terms.
        </>
      }
    >
      <Clause id="service" heading="1. Service overview">
        <p>1.1. {BRAND.NAME} provides a checkout service that allows users to purchase digital value cards denominated in US dollars by paying in Nigerian Naira via bank transfer.</p>
        <p>1.2. The {BRAND.NAME} checkout is accessed through partner platforms. {BRAND.NAME} does not operate a consumer-facing application or hold user accounts.</p>
        <p>1.3. {BRAND.NAME} is a conversion routing service. It is not a bank, exchange, or custodial service. Funds are not held beyond the time required to complete the transaction.</p>
      </Clause>

      <Clause id="eligibility" heading="2. Eligibility">
        <p>2.1. You must be at least 18 years of age to use the {BRAND.NAME} checkout.</p>
        <p>2.2. You must hold a Nigerian bank account capable of making electronic transfers.</p>
        <p>2.3. Your identity verification (KYC) is handled by the platform through which you access {BRAND.NAME}. By completing a transaction, you confirm that the information provided to that platform is accurate and current.</p>
        <p>2.4. You must not use the service if you are a politically exposed person or subject to any international sanctions regime, unless you have disclosed this to the platform operator and received clearance.</p>
      </Clause>

      <Clause id="transactions" heading="3. Transactions">
        <p>3.1. Each transaction begins when you select a card denomination or enter a custom amount on the checkout page. The conversion rate displayed at checkout is locked for the duration of the payment window.</p>
        <p>3.2. Payment is made via bank transfer to the account details displayed on the checkout page. You have thirty (30) minutes to complete the transfer from the moment the checkout session is created.</p>
        <p>3.3. If payment is not received within the payment window, the session expires. No funds are deducted and no value card is issued. You may start a new transaction at the current rate.</p>
        <p>3.4. Once payment is confirmed by our payment provider, the corresponding dollar credit is applied to your account on the partner platform. This credit is processed within seconds of payment confirmation.</p>
        <p>3.5. Minimum deposit: ₦10,000. Maximum deposit: ₦1,000,000 per transaction. These limits may change with notice.</p>
      </Clause>

      <Clause id="rates" heading="4. Rates and pricing">
        <p>4.1. The conversion rate displayed at checkout is the complete cost of the transaction. There are no additional fees, surcharges, or hidden costs charged to you by {BRAND.NAME}.</p>
        <p>4.2. Rates are determined by market conditions and may fluctuate between transactions. The rate locked at the start of your checkout session is the rate applied to your transaction.</p>
        <p>4.3. Your bank may charge its own transfer fees. These are outside the control of {BRAND.NAME} and are your responsibility.</p>
      </Clause>

      <Clause id="refunds" heading="5. Refunds">
        <p>5.1. If payment is received but the transaction cannot be completed for any reason, {BRAND.NAME} initiates a refund to the original bank account within five (5) business days.</p>
        <p>5.2. Refunds are processed in Naira to the same account from which payment was made. Refunds cannot be sent to a different account.</p>
        <p>5.3. The refund amount is the original Naira amount paid, less any irrecoverable payment processing fees. The dollar value of the card is not guaranteed at the time of refund.</p>
        <p>5.4. If you believe a transaction was processed in error, contact the platform through which you made the purchase. The platform will coordinate with {BRAND.NAME} on your behalf.</p>
      </Clause>

      <Clause id="prohibited" heading="6. Prohibited use">
        <p>6.1. You must not use the {BRAND.NAME} checkout for money laundering, terrorist financing, fraud, or any other illegal activity.</p>
        <p>6.2. You must not use the service to evade currency controls, sanctions, or any applicable financial regulation.</p>
        <p>6.3. You must not attempt to circumvent transaction limits by splitting deposits across multiple sessions or accounts.</p>
        <p>6.4. {BRAND.NAME} reserves the right to refuse or reverse any transaction that it reasonably suspects to be fraudulent, illegal, or in violation of these Terms.</p>
      </Clause>

      <Clause id="liability" heading="7. Liability">
        <p>7.1. {BRAND.NAME} is not liable for losses resulting from incorrect bank transfer details entered by you, delays in your bank processing the transfer, or actions taken by the partner platform after credit is applied.</p>
        <p>7.2. {BRAND.NAME}&apos;s maximum liability for any single transaction is limited to the Naira amount you paid for that transaction.</p>
        <p>7.3. {BRAND.NAME} is not liable for indirect, consequential, or incidental damages including loss of profits, data, or business opportunity.</p>
        <p>7.4. {BRAND.NAME} does not guarantee uninterrupted availability of the checkout service. Scheduled and unscheduled maintenance may temporarily affect service availability.</p>
      </Clause>

      <Clause id="data" heading="8. Data and privacy">
        <p>8.1. {BRAND.NAME} processes minimal data to complete your transaction: the amount, payment reference, transaction status, and the user identifier provided by the partner platform.</p>
        <p>8.2. {BRAND.NAME} does not collect your name, address, phone number, or other personal details directly. Your personal data is held by the partner platform under its own privacy policy.</p>
        <p>8.3. Transaction records are retained for six (6) years to meet regulatory requirements. See our Privacy Policy for full details.</p>
      </Clause>

      <Clause id="changes" heading="9. Changes to these Terms">
        <p>9.1. {BRAND.NAME} may update these Terms at any time by publishing a new version at this URL.</p>
        <p>9.2. Continued use of the checkout service after changes are published constitutes acceptance of the updated Terms.</p>
        <p>9.3. Material changes affecting user rights or obligations will be communicated through the partner platform where possible.</p>
      </Clause>

      <Clause id="governing-law" heading="10. Governing law">
        <p>10.1. These Terms are governed by the laws of the Federal Republic of Nigeria.</p>
        <p>10.2. Disputes arising from these Terms shall be resolved through binding arbitration in Lagos, Nigeria, under the Arbitration and Mediation Act 2023.</p>
        <p>10.3. If any provision of these Terms is found to be unenforceable, the remaining provisions continue in full force.</p>
      </Clause>
    </LegalPageLayout>
  );
}
