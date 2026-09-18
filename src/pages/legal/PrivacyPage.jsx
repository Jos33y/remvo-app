import { useEffect } from 'react';
import {
  LegalPageLayout,
  Clause,
} from '@components/layout/marketing/LegalPageLayout';
import { BRAND } from '@utils/constants';

export function PrivacyPage() {
  useEffect(() => {
    document.title = 'Remvo | Privacy Policy';
  }, []);

  return (
    <LegalPageLayout
      title="Privacy Policy"
      date="18 September 2026"
      dateTime="2026-09-18"
      version="v1.3"
      preamble={
        <>
          This Privacy Policy explains how {BRAND.LEGAL_NAME} operating as
          {' '}{BRAND.NAME} (&quot;we&quot;, &quot;us&quot;) collects, uses,
          stores, and protects data in connection with the {BRAND.NAME}{' '}
          checkout service. This policy complies with the Nigeria Data
          Protection Regulation (NDPR) 2019 and the Nigeria Data Protection
          Act (NDPA) 2023.
        </>
      }
    >
      <Clause id="controller" heading="1. Data controller">
        <p>1.1. {BRAND.LEGAL_NAME}, a company registered in Nigeria (RC {BRAND.RC_NUMBER}), is the data controller for information processed through the {BRAND.NAME} checkout service.</p>
        <p>1.2. Where a partner platform sends us your details to prefill our checkout, that platform is a separate data controller for its own processing. We are the controller for the details you confirm or enter on our checkout page and for everything we do with them afterwards.</p>
        <p>1.3. For data protection enquiries, contact us at {BRAND.EMAIL}.</p>
      </Clause>

      <Clause id="what-we-collect" heading="2. Data we collect">
        <p>2.1. We collect your name, email address, and phone number at checkout. Where you reach our checkout from a partner platform, these fields may be prefilled from details you have already given that platform. You can correct them before you pay, and the details you confirm are the ones we hold.</p>
        <p>2.2. We collect these details because you are purchasing from us. We need them to identify you as the purchaser, to contact you about your transaction, to return your money to the right person if a refund is required, and to meet our record-keeping obligations to our payment provider and under Nigerian law.</p>
        <p>2.3. Data received from a partner platform when your checkout session is created: platform identifier, the platform&apos;s own reference for you, and the prefill values described in 2.1.</p>
        <p>2.4. Data generated during the transaction: the item purchased, payment reference, rate applied, amount, transaction status, timestamps, payment provider reference, and credit reference.</p>
        <p>2.5. Data from our payment provider (Paystack): payment confirmation status, the bank transfer reference, and the name and bank of the account your payment was sent from. We do not receive your bank password, card details, or BVN.</p>
        <p>2.6. Technical data collected automatically: IP address (for fraud detection), browser type, device type, and page interaction timestamps.</p>
        <p>2.7. We do not ask for and do not want your bank password, card details, PIN, or one-time passcodes. No one at {BRAND.NAME} will ever request them.</p>
      </Clause>

      <Clause id="legal-basis" heading="3. Legal basis for processing">
        <p>3.1. Contract performance: processing is necessary to complete the purchase you make at checkout and to provide support, refunds, and confirmation relating to it (NDPA Section 25(1)(b)).</p>
        <p>3.2. Legal obligation: we retain transaction and customer records to comply with financial record-keeping, tax, and anti-money laundering requirements under Nigerian law, and to meet our obligations under our merchant agreement with our payment provider (NDPA Section 25(1)(c)).</p>
        <p>3.3. Legitimate interest: fraud detection and service security (NDPA Section 25(1)(f)).</p>
      </Clause>

      <Clause id="how-we-use" heading="4. How we use your data">
        <p>4.1. To identify you as the purchaser and to process and confirm your payment.</p>
        <p>4.2. To contact you about your transaction, including payment confirmation and any problem affecting it.</p>
        <p>4.3. To notify the partner platform that your payment is confirmed, so the platform can apply the value you purchased to your account with them.</p>
        <p>4.4. To process refunds to the correct person where a transaction cannot be completed.</p>
        <p>4.5. To detect and prevent fraud or abuse of the service. This includes comparing the name you give us at checkout against the name on the bank account your payment was sent from, so that we can identify payments made by someone other than the purchaser.</p>
        <p>4.6. To comply with tax, audit, anti-money laundering, and other regulatory requirements.</p>
        <p>4.7. We do not use your data for marketing, advertising, profiling, or automated decision-making. We will not email you about anything other than your own transactions.</p>
      </Clause>

      <Clause id="sharing" heading="5. Data sharing">
        <p>5.1. Payment provider: our payment provider (currently Paystack) processes your bank transfer. We provide them with your name, email address, and phone number so that your payment can be recorded against you and so that we can meet our obligations under our merchant agreement. Their processing is subject to their own privacy policy.</p>
        <p>5.2. Partner platforms: we share transaction confirmations (amount, reference, status, and the platform&apos;s own reference for you) with the platform through which you made your purchase. This is necessary for that platform to apply the value to your account.</p>
        <p>5.3. Regulatory authorities: we may disclose transaction and customer data if required by law, court order, or regulatory authority, including the filing of reports we are obliged to make.</p>
        <p>5.4. Service providers: hosting, database, and communications providers that process data on our behalf under contract, on our instructions only.</p>
        <p>5.5. We do not sell, rent, or share your data with third parties for marketing or advertising purposes.</p>
        <p>5.6. Your personal data is stored in Nigeria. Where any transfer outside Nigeria is necessary, it complies with the cross-border transfer requirements of the NDPA.</p>
      </Clause>

      <Clause id="retention" heading="6. Data retention">
        <p>6.1. Transaction and customer records, including your name, email address, phone number, and the sending account details described in clause 2.5: six (6) years from the date of the transaction, as required by Nigerian financial record-keeping and anti-money laundering regulations.</p>
        <p>6.2. Technical logs (IP addresses, interaction data): ninety (90) days, then permanently deleted.</p>
        <p>6.3. Checkout sessions that expire without payment: thirty (30) days, then permanently deleted, including any details prefilled or entered during that session.</p>
        <p>6.4. After the retention period, data is permanently deleted from our systems and backups.</p>
      </Clause>

      <Clause id="security" heading="7. Data security">
        <p>7.1. All data in transit is encrypted using TLS 1.2 or higher.</p>
        <p>7.2. All data at rest is encrypted using AES-256 encryption.</p>
        <p>7.3. Access to transaction and customer data is restricted to authorised personnel on a need-to-know basis.</p>
        <p>7.4. API keys and secrets are stored in a self-hosted secrets manager, not in environment variables or code repositories.</p>
        <p>7.5. We conduct periodic security reviews of our infrastructure and access controls.</p>
      </Clause>

      <Clause id="your-rights" heading="8. Your rights">
        <p>8.1. Under the NDPA 2023, you have the right to: access the personal data we hold about you, request correction of inaccurate data, request deletion of your data (subject to our legal retention obligations), object to processing based on legitimate interest, and data portability.</p>
        <p>8.2. To exercise any of these rights, email {BRAND.EMAIL} with your request and your transaction reference number. We respond within fourteen (14) days.</p>
        <p>8.3. Your account and balance with a partner platform are held by that platform, not by us. Requests about your account, your balance, or the identity checks that platform performed should be directed to them.</p>
        <p>8.4. We cannot delete transaction records we are legally required to retain under clause 6.1, even at your request. We can tell you what we hold and correct anything inaccurate.</p>
        <p>8.5. You have the right to lodge a complaint with the Nigeria Data Protection Commission (NDPC) if you believe your data rights have been violated.</p>
      </Clause>

      <Clause id="cookies" heading="9. Cookies and tracking">
        <p>9.1. The {BRAND.NAME} checkout page does not use cookies for tracking, advertising, or analytics.</p>
        <p>9.2. We may use a single session cookie to maintain your checkout session state. This cookie is deleted when you close the browser or the session expires.</p>
        <p>9.3. We do not use third-party analytics, tracking pixels, or social media plugins on the checkout page.</p>
      </Clause>

      <Clause id="children" heading="10. Children">
        <p>10.1. The {BRAND.NAME} service is not directed at persons under 18 years of age and we do not knowingly sell to or process the data of minors.</p>
        <p>10.2. If we become aware that data of a minor has been processed, we will delete it promptly and notify the partner platform.</p>
      </Clause>

      <Clause id="changes" heading="11. Changes to this policy">
        <p>11.1. We may update this Privacy Policy at any time by publishing a new version at this URL.</p>
        <p>11.2. Material changes are communicated to partner platforms, and where the change materially affects how we handle your data we will say so on the checkout page.</p>
        <p>11.3. The &quot;Last updated&quot; date at the top of this page indicates when this policy was last revised.</p>
      </Clause>
    </LegalPageLayout>
  );
}
