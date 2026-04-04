import { useEffect } from 'react';
import {
  LegalPageLayout,
  Clause,
} from '@components/layout/LegalPageLayout';
import { BRAND } from '@utils/constants';

export function PrivacyPage() {
  useEffect(() => {
    document.title = 'Remvo | Privacy Policy';
  }, []);

  return (
    <LegalPageLayout
      title="Privacy Policy"
      date="3 April 2026"
      dateTime="2026-04-03"
      version="v1.0"
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
        <p>1.1. {BRAND.LEGAL_NAME}, a company registered in Nigeria, is the data controller for information processed through the {BRAND.NAME} checkout service.</p>
        <p>1.2. For data protection enquiries, contact us at {BRAND.EMAIL}.</p>
      </Clause>

      <Clause id="what-we-collect" heading="2. Data we collect">
        <p>2.1. {BRAND.NAME} operates as a B2B service. We do not collect personal data directly from end users. The data we process is provided by the partner platform during checkout session initialization.</p>
        <p>2.2. Data received from partner platforms per transaction: platform identifier, user identifier (a reference code, not a name), optional email address (if provided by the platform), transaction amount, and callback URL.</p>
        <p>2.3. Data generated during the transaction: payment reference, conversion rate applied, transaction status, timestamps, payment provider reference, and settlement reference.</p>
        <p>2.4. Data from our payment provider (Monnify): payment confirmation status, bank transfer reference, and settlement reference. We do not receive your bank account number, name, or BVN from the payment provider.</p>
        <p>2.5. Technical data collected automatically: IP address (for fraud detection only, not stored long-term), browser type, device type, and page interaction timestamps.</p>
      </Clause>

      <Clause id="legal-basis" heading="3. Legal basis for processing">
        <p>3.1. Contract performance: processing is necessary to complete the transaction you initiate at checkout (NDPA Section 25(1)(b)).</p>
        <p>3.2. Legal obligation: we retain transaction records to comply with financial record-keeping requirements under Nigerian law (NDPA Section 25(1)(c)).</p>
        <p>3.3. Legitimate interest: fraud detection and service security (NDPA Section 25(1)(f)).</p>
      </Clause>

      <Clause id="how-we-use" heading="4. How we use your data">
        <p>4.1. To process your checkout transaction and confirm payment.</p>
        <p>4.2. To send a webhook notification to the partner platform confirming your payment, so the platform can credit your account.</p>
        <p>4.3. To settle USDT to the partner platform on your behalf.</p>
        <p>4.4. To process refunds if a transaction cannot be completed.</p>
        <p>4.5. To detect and prevent fraud or abuse of the service.</p>
        <p>4.6. To comply with tax, audit, and regulatory requirements.</p>
        <p>4.7. We do not use your data for marketing, advertising, profiling, or automated decision-making.</p>
      </Clause>

      <Clause id="sharing" heading="5. Data sharing">
        <p>5.1. Partner platforms: we share transaction confirmations (amount, reference, status) with the platform through which you made the purchase. This is necessary to credit your account.</p>
        <p>5.2. Payment providers: our payment provider (currently Monnify) processes the bank transfer. Their processing is subject to their own privacy policy.</p>
        <p>5.3. Regulatory authorities: we may disclose transaction data if required by law, court order, or regulatory authority.</p>
        <p>5.4. We do not sell, rent, or share your data with third parties for marketing or advertising purposes.</p>
        <p>5.5. We do not transfer data outside Nigeria except where required by the settlement process. Any such transfer complies with NDPR cross-border transfer requirements.</p>
      </Clause>

      <Clause id="retention" heading="6. Data retention">
        <p>6.1. Transaction records: six (6) years from the date of the transaction, as required by Nigerian financial record-keeping regulations.</p>
        <p>6.2. Technical logs (IP addresses, interaction data): ninety (90) days, then permanently deleted.</p>
        <p>6.3. Failed or expired checkout sessions: thirty (30) days, then permanently deleted.</p>
        <p>6.4. After the retention period, data is permanently deleted from our systems and backups.</p>
      </Clause>

      <Clause id="security" heading="7. Data security">
        <p>7.1. All data in transit is encrypted using TLS 1.2 or higher.</p>
        <p>7.2. All data at rest is encrypted using AES-256 encryption.</p>
        <p>7.3. Access to transaction data is restricted to authorised personnel on a need-to-know basis.</p>
        <p>7.4. API keys and secrets are stored in a self-hosted secrets manager (Infisical), not in environment variables or code repositories.</p>
        <p>7.5. We conduct periodic security reviews of our infrastructure and access controls.</p>
      </Clause>

      <Clause id="your-rights" heading="8. Your rights">
        <p>8.1. Under the NDPA 2023, you have the right to: access the personal data we hold about you, request correction of inaccurate data, request deletion of your data (subject to our legal retention obligations), object to processing based on legitimate interest, and data portability.</p>
        <p>8.2. Because {BRAND.NAME} processes minimal data and does not hold user accounts, most data requests should be directed to the partner platform where your account exists.</p>
        <p>8.3. To exercise any data right directly with {BRAND.NAME}, email {BRAND.EMAIL} with your request and the transaction reference number. We respond within fourteen (14) days.</p>
        <p>8.4. You have the right to lodge a complaint with the Nigeria Data Protection Commission (NDPC) if you believe your data rights have been violated.</p>
      </Clause>

      <Clause id="cookies" heading="9. Cookies and tracking">
        <p>9.1. The {BRAND.NAME} checkout page does not use cookies for tracking, advertising, or analytics.</p>
        <p>9.2. We may use a single session cookie to maintain your checkout session state. This cookie is deleted when you close the browser or the session expires.</p>
        <p>9.3. We do not use third-party analytics, tracking pixels, or social media plugins on the checkout page.</p>
      </Clause>

      <Clause id="children" heading="10. Children">
        <p>10.1. The {BRAND.NAME} service is not directed at persons under 18 years of age. We do not knowingly process data of minors.</p>
        <p>10.2. If we become aware that data of a minor has been processed, we will delete it promptly and notify the partner platform.</p>
      </Clause>

      <Clause id="changes" heading="11. Changes to this policy">
        <p>11.1. We may update this Privacy Policy at any time by publishing a new version at this URL.</p>
        <p>11.2. Material changes will be communicated to partner platforms, who may notify their users as appropriate.</p>
        <p>11.3. The &quot;Last updated&quot; date at the top of this page indicates when this policy was last revised.</p>
      </Clause>
    </LegalPageLayout>
  );
}
