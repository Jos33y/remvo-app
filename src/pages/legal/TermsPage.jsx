import { useEffect } from 'react';
import {
  LegalPageLayout,
  Clause,
} from '@components/layout/marketing/LegalPageLayout';
import { BRAND } from '@utils/constants';

export function TermsPage() {
  useEffect(() => {
    document.title = 'Remvo | Terms of Service';
  }, []);

  return (
    <LegalPageLayout
      title="Terms of Service"
      date="18 September 2026"
      dateTime="2026-09-18"
      version="v1.2"
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
        <p>1.1. {BRAND.NAME} sells digital value cards denominated in US dollars. You buy a card from us and pay for it in Nigerian Naira by bank transfer.</p>
        <p>1.2. You reach our checkout from a partner platform. The card you buy is applied to your account on that platform once your payment is confirmed.</p>
        <p>1.3. {BRAND.NAME} does not operate a consumer-facing application and does not hold user accounts or user balances. We are not a bank, an exchange, or a custodial service.</p>
        <p>1.4. Your purchase is from {BRAND.LEGAL_NAME}. Your account, your balance, and what you do with the value afterwards are matters between you and the partner platform.</p>
      </Clause>

      <Clause id="eligibility" heading="2. Eligibility">
        <p>2.1. You must be at least 18 years of age to buy from {BRAND.NAME}.</p>
        <p>2.2. You must hold a Nigerian bank account in your own name capable of making electronic transfers.</p>
        <p>2.3. You must give us your name, email address, and phone number at checkout, and they must be accurate and current. We use them to identify you as the purchaser, to contact you about your transaction, and to meet our record-keeping obligations. See our Privacy Policy for how we handle them.</p>
        <p>2.4. The partner platform through which you reach our checkout verifies the identity of its users. That verification is in addition to the details you give us, not a substitute for them.</p>
        <p>2.5. You must not use the service if you are subject to any international sanctions regime.</p>
      </Clause>

      <Clause id="transactions" heading="3. Transactions">
        <p>3.1. A transaction begins when you select a card denomination or enter a custom amount on the checkout page. The rate displayed at checkout is locked for the duration of the payment window.</p>
        <p>3.2. Payment is made by bank transfer to the account details displayed on the checkout page. You have thirty (30) minutes to complete the transfer from the moment the checkout session is created.</p>
        <p>3.3. If payment is not received within the payment window, the session expires. No funds are deducted and no value card is issued. You may start a new transaction at the current rate.</p>
        <p>3.4. You must pay from a bank account held in your own name. We compare the name you give at checkout against the name on the account the payment was sent from. Where these do not match, we may hold, decline, or refund the transaction while we make enquiries. We do not accept payment made on your behalf by a third party.</p>
        <p>3.5. Once payment is confirmed by our payment provider, your card is applied to your account on the partner platform. This happens within seconds of payment confirmation.</p>
        <p>3.6. Minimum transaction: ₦10,000. Maximum transaction: ₦1,000,000 per session. These limits may change with notice.</p>
      </Clause>

      <Clause id="rates" heading="4. Rates and pricing">
        <p>4.1. The rate displayed at checkout is the complete cost of the transaction. There are no additional fees, surcharges, or hidden costs charged to you by {BRAND.NAME}.</p>
        <p>4.2. Rates are determined by market conditions and may change between transactions. The rate locked at the start of your checkout session is the rate applied to your transaction.</p>
        <p>4.3. Your bank may charge its own transfer fees. These are outside our control and are your responsibility.</p>
      </Clause>

      <Clause id="refunds" heading="5. Refunds">
        <p>5.1. If payment is received but the transaction cannot be completed for any reason, we initiate a refund to the original bank account within five (5) business days.</p>
        <p>5.2. Refunds are processed in Naira to the same account from which payment was made. Refunds cannot be sent to a different account.</p>
        <p>5.3. The refund amount is the original Naira amount paid, less any irrecoverable payment processing fees. The dollar value of the card is not guaranteed at the time of refund.</p>
        <p>5.4. For anything relating to your purchase, including a refund, contact us at {BRAND.EMAIL} with your transaction reference. We hold your transaction record and can deal with you directly. For questions about your account or your balance, contact the partner platform, because they hold it.</p>
        <p>5.5. Our full Refund Policy is published on this site and forms part of these Terms.</p>
      </Clause>

      <Clause id="prohibited" heading="6. Prohibited use">
        <p>6.1. You must not use the {BRAND.NAME} checkout for money laundering, terrorist financing, fraud, or any other illegal activity.</p>
        <p>6.2. You must not use the service to evade currency controls, sanctions, or any applicable financial regulation.</p>
        <p>6.3. You must not attempt to circumvent transaction limits by splitting payments across multiple sessions or accounts.</p>
        <p>6.4. You must not buy on behalf of another person, or allow another person to pay for your purchase.</p>
        <p>6.5. You must not give false details at checkout.</p>
        <p>6.6. We may refuse, hold, or reverse any transaction we reasonably suspect to be fraudulent, illegal, or in breach of these Terms.</p>
      </Clause>

      <Clause id="liability" heading="7. Liability">
        <p>7.1. {BRAND.NAME} is not liable for losses resulting from incorrect bank transfer details entered by you, delays in your bank processing the transfer, or actions taken by the partner platform after your card is applied.</p>
        <p>7.2. {BRAND.NAME}&apos;s maximum liability for any single transaction is limited to the Naira amount you paid for that transaction.</p>
        <p>7.3. {BRAND.NAME} is not liable for indirect, consequential, or incidental damages including loss of profits, data, or business opportunity.</p>
        <p>7.4. {BRAND.NAME} does not guarantee uninterrupted availability of the checkout service. Scheduled and unscheduled maintenance may temporarily affect availability.</p>
      </Clause>

      <Clause id="data" heading="8. Data and privacy">
        <p>8.1. We collect your name, email address, and phone number at checkout. Where you reach our checkout from a partner platform, these may be prefilled from details you have already given that platform, and you can correct them before you pay.</p>
        <p>8.2. We also hold the details of your transaction and, from our payment provider, the name and bank of the account your payment was sent from.</p>
        <p>8.3. Transaction and customer records are retained for six (6) years to meet regulatory requirements.</p>
        <p>8.4. Our Privacy Policy, published on this site, sets out in full what we collect, why, who we share it with, and your rights.</p>
      </Clause>

      <Clause id="changes" heading="9. Changes to these Terms">
        <p>9.1. We may update these Terms at any time by publishing a new version at this URL.</p>
        <p>9.2. Continued use of the checkout service after changes are published constitutes acceptance of the updated Terms.</p>
        <p>9.3. Material changes affecting user rights or obligations are communicated on the checkout page and through the partner platform where possible.</p>
      </Clause>

      <Clause id="governing-law" heading="10. Governing law">
        <p>10.1. These Terms are governed by the laws of the Federal Republic of Nigeria.</p>
        <p>10.2. Disputes arising from these Terms shall be resolved through binding arbitration in Lagos, Nigeria, under the Arbitration and Mediation Act 2023.</p>
        <p>10.3. If any provision of these Terms is found to be unenforceable, the remaining provisions continue in full force.</p>
      </Clause>
    </LegalPageLayout>
  );
}
