import { useEffect } from 'react';
import {
  LegalPageLayout,
  Clause,
  DefList,
  DefItem,
} from '@components/layout/LegalPageLayout';
import { ROUTES, BRAND } from '@utils/constants';

const TOC_ITEMS = [
  { id: 'definitions', label: 'Definitions' },
  { id: 'service', label: 'Service description' },
  { id: 'integration', label: 'Integration and access' },
  { id: 'webhooks', label: 'Webhook delivery' },
  { id: 'credit-settlement', label: 'User credit and settlement' },
  { id: 'rates', label: 'Rates' },
  { id: 'fees', label: 'Fees' },
  { id: 'deposit-limits', label: 'Deposit limits' },
  { id: 'refunds', label: 'Refund policy' },
  { id: 'liability', label: 'Liability' },
  { id: 'wallets', label: 'Wallets and settlement network' },
  { id: 'confidentiality', label: 'Confidentiality' },
  { id: 'data', label: 'Data handling' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'ip', label: 'Intellectual property' },
  { id: 'availability', label: 'Service availability' },
  { id: 'force-majeure', label: 'Force majeure' },
  { id: 'term', label: 'Term and termination' },
  { id: 'notices', label: 'Notices' },
  { id: 'disputes', label: 'Dispute resolution' },
  { id: 'general', label: 'General provisions' },
];

export function AgreementPage() {
  useEffect(() => {
    document.title = 'Remvo | Platform Services Agreement';
  }, []);

  return (
    <LegalPageLayout
      title="Platform Services Agreement"
      date="3 April 2026"
      dateTime="2026-04-03"
      version="v1.0"
      backTo={ROUTES.PARTNERS}
      backLabel="Back to overview"
      tocItems={TOC_ITEMS}
      preamble={
        <>
          This Platform Services Agreement (&quot;Agreement&quot;) is entered
          into between {BRAND.LEGAL_NAME} operating as {BRAND.NAME} (&quot;Provider&quot;,
          &quot;we&quot;, &quot;us&quot;) and the platform operator identified
          in the accompanying Order Form (&quot;Platform&quot;, &quot;you&quot;,
          &quot;your&quot;). By integrating with the {BRAND.NAME} API, you agree
          to the terms below.
        </>
      }
      footerNote={
        <>
          This agreement is reviewed periodically. The current version is
          always available at this URL. Questions or amendments should be
          directed to <a href={`mailto:${BRAND.EMAIL}`}>{BRAND.EMAIL}</a>.
        </>
      }
    >
      <Clause id="definitions" heading="1. Definitions">
        <DefList>
          <DefItem term="Checkout Session">A single transaction initiated via the Provider API, identified by a unique session token, with a locked conversion rate and a defined expiry period.</DefItem>
          <DefItem term="Settlement">The transfer of USDT from the Provider wallet to the Platform wallet at the schedule defined in the Order Form.</DefItem>
          <DefItem term="Service Fee">The percentage deducted from the USDT amount before settlement, as defined in the Order Form.</DefItem>
          <DefItem term="Conversion Rate">The fiat-to-dollar rate displayed to the end user at checkout, determined by market conditions at the time of session creation.</DefItem>
          <DefItem term="Webhook">An HTTP POST request sent by the Provider to the Platform endpoint to communicate transaction events including deposit confirmations, settlement completions, and refund notifications.</DefItem>
          <DefItem term="Corridor">A supported conversion route from a specific fiat currency to USDT, as defined in the Order Form (e.g. NGN to USDT).</DefItem>
          <DefItem term="Settlement Network">The blockchain network on which USDT settlement is executed, as specified in the Order Form.</DefItem>
          <DefItem term="Order Form">The accompanying document specifying platform-specific terms including corridor, service fee percentage, settlement schedule, settlement network, wallet address, deposit limits, and notification preferences.</DefItem>
        </DefList>
      </Clause>

      <Clause id="service" heading="2. Service description">
        <p>2.1. The Provider operates a conversion routing service that enables the Platform&apos;s users to deposit local fiat currency and receive dollar-denominated credits on the Platform.</p>
        <p>2.2. The Provider handles payment collection via licensed third-party payment providers, currency conversion, and USDT settlement to the Platform&apos;s designated wallet.</p>
        <p>2.3. The Provider is not a wallet, exchange, or custodial service. The Provider does not hold user funds beyond the settlement window.</p>
      </Clause>

      <Clause id="integration" heading="3. Integration and access">
        <p>3.1. The Platform integrates via the Provider API using a server-side checkout initialization model. The Provider issues an API key to the Platform upon onboarding.</p>
        <p>3.2. The Platform implements a webhook endpoint to receive transaction events from the Provider. The endpoint must respond with HTTP 200 within 10 seconds of receiving a request.</p>
        <p>3.3. API keys are confidential. The Platform is responsible for securing its API key and must notify the Provider immediately if a key is compromised.</p>
        <p>3.4. The Provider may regenerate API keys at the Platform&apos;s request or if a security concern is identified. The Provider gives the Platform reasonable notice before deactivating an existing key, except in cases of suspected compromise.</p>
      </Clause>

      <Clause id="webhooks" heading="4. Webhook delivery">
        <p>4.1. The Provider delivers webhooks for the following events: deposit confirmed, settlement completed, settlement delayed, refund initiated, and refund completed.</p>
        <p>4.2. If the Platform&apos;s webhook endpoint does not respond with HTTP 200, the Provider retries delivery up to three (3) times with exponential backoff (1 minute, 5 minutes, 15 minutes).</p>
        <p>4.3. After three failed delivery attempts, the webhook is marked as failed. The Provider logs all failed deliveries and makes them available for review. The Platform may request a manual retry via the Provider.</p>
        <p>4.4. The Platform is responsible for processing webhooks idempotently. Duplicate webhook deliveries may occur and the Platform must handle them without crediting a user twice.</p>
        <p>4.5. Webhook payloads include a signature header for verification. The Platform should validate this signature before processing the event.</p>
      </Clause>

      <Clause id="credit-settlement" heading="5. User credit and settlement">
        <p>5.1. Upon payment confirmation, the Provider sends a webhook to the Platform containing the user identifier and credited amount. The Platform credits the user&apos;s balance immediately upon receiving this webhook.</p>
        <p>5.2. USDT settlement occurs at the schedule defined in the Order Form. Settlement is sent to the wallet address registered with the Provider on the settlement network specified in the Order Form.</p>
        <p>5.3. The Provider sends settlement confirmation via the notification method specified in the Order Form, including the total USDT amount, on-chain transaction hash, and number of transactions in the batch.</p>
        <p>5.4. If settlement is delayed, the Provider notifies the Platform with an expected resolution time. Settlement delays do not affect user credits, which are processed independently via webhook.</p>
        <p>5.5. The Platform may freeze a user&apos;s balance if settlement fails, as a contractual right. This is a protective measure, not a standard operating procedure.</p>
      </Clause>

      <Clause id="rates" heading="6. Rates">
        <p>6.1. The conversion rate is market-based and displayed to the end user at checkout. Rates are determined by real-time market conditions and are locked for the duration of the checkout session.</p>
        <p>6.2. The composition of the conversion rate, including any rate methodology, is proprietary and confidential. Neither party shall disclose rate composition details to third parties or end users.</p>
        <p>6.3. The Provider makes a live rate API available to the Platform for displaying indicative rates on the Platform&apos;s own interface. Indicative rates are not guaranteed and may differ from the rate locked at checkout session creation.</p>
      </Clause>

      <Clause id="fees" heading="7. Fees">
        <p>7.1. The Service Fee percentage is defined in the Order Form and is deducted from the USDT amount before settlement.</p>
        <p>7.2. There is no setup fee, monthly fee, or minimum volume requirement unless otherwise specified in the Order Form.</p>
        <p>7.3. Payment processing fees charged by the underlying payment provider are absorbed by the Provider and are not passed to the Platform.</p>
        <p>7.4. The Provider reserves the right to adjust the Service Fee with thirty (30) days written notice. The Platform may terminate this Agreement if the adjusted fee is not acceptable.</p>
      </Clause>

      <Clause id="deposit-limits" heading="8. Deposit limits">
        <p>8.1. Minimum and maximum deposit amounts per transaction are defined in the Order Form and may vary by corridor.</p>
        <p>8.2. The Provider may adjust deposit limits with reasonable notice to comply with payment provider requirements or regulatory changes.</p>
        <p>8.3. Transactions below the minimum or above the maximum are rejected at checkout. The end user is informed of the applicable limits on the checkout page.</p>
      </Clause>

      <Clause id="refunds" heading="9. Refund policy">
        <p>9.1. If payment is received from an end user but USDT settlement cannot be completed, the Provider initiates a fiat refund to the original payment source within five (5) business days.</p>
        <p>9.2. The Platform is notified of the refund via webhook and should reverse any credit applied to the user&apos;s balance.</p>
        <p>9.3. Refund requests initiated by the Platform for user disputes must be submitted within forty-eight (48) hours of the original transaction.</p>
        <p>9.4. Refunds are processed in the original fiat currency to the original payment source. The Provider does not refund in USDT or to alternative accounts.</p>
      </Clause>

      <Clause id="liability" heading="10. Liability">
        <p>10.1. The Provider&apos;s liability for any single transaction is limited to the fiat amount collected for that transaction.</p>
        <p>10.2. The Provider is not liable for delays or errors in the Platform&apos;s crediting of user balances after webhook delivery.</p>
        <p>10.3. The Platform is not liable for delays in the Provider&apos;s USDT settlement beyond the agreed schedule.</p>
        <p>10.4. Neither party is liable for indirect, incidental, consequential, special, or punitive damages arising from this Agreement, including but not limited to loss of profits, data, or business opportunity.</p>
        <p>10.5. The Provider&apos;s total aggregate liability under this Agreement shall not exceed the total Service Fees paid by the Platform in the twelve (12) months preceding the claim.</p>
      </Clause>

      <Clause id="wallets" heading="11. Wallets and settlement network">
        <p>11.1. The Platform provides a wallet address and preferred settlement network during onboarding. This address is used for all USDT settlements.</p>
        <p>11.2. Supported settlement networks are specified in the Order Form. The Provider may add additional network options over time.</p>
        <p>11.3. If the Platform needs to change its wallet address, it must notify the Provider at least twenty-four (24) hours before the next scheduled settlement.</p>
        <p>11.4. The Provider verifies wallet address changes before executing settlement. Settlement may be delayed during verification to protect against unauthorized changes.</p>
        <p>11.5. The Provider is not responsible for USDT sent to an incorrect wallet address provided by the Platform, or for losses resulting from the Platform providing a wallet address on an unsupported network.</p>
        <p>11.6. Network transaction fees (gas fees) for settlement are borne by the Provider unless otherwise specified in the Order Form.</p>
      </Clause>

      <Clause id="confidentiality" heading="12. Confidentiality">
        <p>12.1. The composition of the conversion rate, including any rate methodology, is confidential information of the Provider. The Platform shall not disclose, reverse-engineer, or communicate rate composition details to any third party or end user.</p>
        <p>12.2. Transaction volumes, settlement amounts, and financial terms of this Agreement are confidential to both parties.</p>
        <p>12.3. API keys, webhook URLs, and wallet addresses are confidential and must be stored securely by the receiving party.</p>
        <p>12.4. Confidentiality obligations survive termination of this Agreement for a period of two (2) years.</p>
      </Clause>

      <Clause id="data" heading="13. Data handling">
        <p>13.1. The Provider stores minimal transaction data: platform identifier, user identifier (as provided by the Platform), amounts, rates, payment references, and transaction status.</p>
        <p>13.2. The Provider does not collect, store, or process personal user data beyond what is included in the checkout session initialization (user identifier and optional email).</p>
        <p>13.3. User identity verification (KYC/AML) is the sole responsibility of the Platform. The Provider relies on the Platform&apos;s verification of its users.</p>
        <p>13.4. The Provider retains transaction records for a minimum of six (6) years for regulatory and audit purposes.</p>
      </Clause>

      <Clause id="compliance" heading="14. Compliance">
        <p>14.1. Each party is responsible for its own regulatory compliance in the jurisdictions in which it operates.</p>
        <p>14.2. The Platform is solely responsible for ensuring that its use of the Provider&apos;s service complies with applicable laws, including but not limited to anti-money laundering, know-your-customer, and sanctions regulations.</p>
        <p>14.3. The Provider may suspend service to the Platform if the Provider reasonably believes the Platform&apos;s use of the service violates applicable law or exposes the Provider to regulatory risk.</p>
        <p>14.4. The Platform shall not use the service to facilitate transactions involving sanctioned persons, entities, or jurisdictions.</p>
      </Clause>

      <Clause id="ip" heading="15. Intellectual property">
        <p>15.1. The Provider retains all rights to the {BRAND.NAME} brand, trademarks, API, documentation, and checkout interface.</p>
        <p>15.2. The Platform is granted a non-exclusive, non-transferable licence to use the {BRAND.NAME} name and logo solely for the purpose of identifying {BRAND.NAME} as a payment method on the Platform&apos;s interface, in accordance with brand guidelines provided by the Provider.</p>
        <p>15.3. The Platform retains all rights to its own brand, platform, and user data. Integration with {BRAND.NAME} does not transfer any intellectual property rights between the parties.</p>
      </Clause>

      <Clause id="availability" heading="16. Service availability">
        <p>16.1. The Provider targets 99.5% uptime for the checkout and API services, measured monthly, excluding scheduled maintenance.</p>
        <p>16.2. The Provider gives the Platform at least twenty-four (24) hours notice before scheduled maintenance that may affect service availability.</p>
        <p>16.3. In the event of unplanned downtime, the Provider notifies the Platform via the notification method in the Order Form and provides status updates until service is restored.</p>
        <p>16.4. Settlement obligations continue to accumulate during downtime. Any deposits received before an outage are settled at the next available settlement window.</p>
      </Clause>

      <Clause id="force-majeure" heading="17. Force majeure">
        <p>17.1. Neither party is liable for failure to perform obligations under this Agreement due to events beyond its reasonable control, including but not limited to: natural disasters, government actions, regulatory changes, sanctions, banking system failures, blockchain network outages, payment provider outages, internet disruptions, or civil unrest.</p>
        <p>17.2. The affected party must notify the other party within forty-eight (48) hours of the force majeure event and take reasonable steps to mitigate its impact.</p>
        <p>17.3. If a force majeure event continues for more than thirty (30) days, either party may terminate this Agreement with immediate effect.</p>
      </Clause>

      <Clause id="term" heading="18. Term and termination">
        <p>18.1. This Agreement is effective from the date the Platform completes API integration and processes its first transaction.</p>
        <p>18.2. Either party may terminate this Agreement with thirty (30) days written notice.</p>
        <p>18.3. Upon termination, the Provider processes all outstanding settlements within five (5) business days.</p>
        <p>18.4. The Provider may suspend service immediately if the Platform violates the confidentiality, compliance, or intellectual property terms of this Agreement, or if fraudulent activity is detected.</p>
        <p>18.5. Clauses that by their nature should survive termination (including confidentiality, liability, data retention, and intellectual property) shall survive termination of this Agreement.</p>
      </Clause>

      <Clause id="notices" heading="19. Notices">
        <p>19.1. Formal notices under this Agreement (termination, material changes, disputes) must be delivered in writing via email to the addresses specified in the Order Form.</p>
        <p>19.2. Operational communications (settlement confirmations, webhook failures, maintenance notices) may be delivered via the notification method specified in the Order Form.</p>
        <p>19.3. A notice is deemed received on the business day it is sent if sent before 17:00 WAT, or on the next business day if sent after 17:00 WAT.</p>
      </Clause>

      <Clause id="disputes" heading="20. Dispute resolution">
        <p>20.1. The parties shall attempt to resolve disputes through good faith negotiation within fourteen (14) days of written notice.</p>
        <p>20.2. If negotiation fails, disputes shall be resolved through binding arbitration in Lagos, Nigeria, under the Arbitration and Mediation Act 2023.</p>
        <p>20.3. The language of arbitration shall be English. Each party bears its own costs unless the arbitrator orders otherwise.</p>
      </Clause>

      <Clause id="general" heading="21. General provisions">
        <p>21.1. This Agreement is governed by the laws of the Federal Republic of Nigeria.</p>
        <p>21.2. Amendments to this Agreement must be in writing and agreed by both parties. The Provider may update these terms by publishing a new version at this URL and notifying the Platform thirty (30) days in advance. Continued use after the notice period constitutes acceptance.</p>
        <p>21.3. Neither party may assign this Agreement without the prior written consent of the other party, except in connection with a merger, acquisition, or sale of substantially all assets.</p>
        <p>21.4. If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.</p>
        <p>21.5. The failure of either party to enforce any right or provision of this Agreement shall not constitute a waiver of that right or provision.</p>
        <p>21.6. This Agreement, together with the Order Form, constitutes the entire agreement between the parties regarding the subject matter herein and supersedes all prior agreements, understandings, and communications.</p>
      </Clause>
    </LegalPageLayout>
  );
}
