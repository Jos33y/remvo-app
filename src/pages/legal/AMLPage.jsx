import { useEffect } from 'react';
import {
  LegalPageLayout,
  Clause,
} from '@components/layout/LegalPageLayout';
import { BRAND } from '@utils/constants';

export function AMLPage() {
  useEffect(() => {
    document.title = 'Remvo | AML Policy';
  }, []);

  return (
    <LegalPageLayout
      title="Anti-Money Laundering Policy"
      date="3 April 2026"
      dateTime="2026-04-03"
      version="v1.0"
      preamble={
        <>
          This Anti-Money Laundering (AML) Policy sets out the measures
          {' '}{BRAND.LEGAL_NAME} operating as {BRAND.NAME} takes to prevent
          money laundering, terrorist financing, and other financial crimes
          through the {BRAND.NAME} service. This policy is informed by the
          Money Laundering (Prevention and Prohibition) Act 2022, the
          Terrorism (Prevention and Prohibition) Act 2022, and applicable
          Central Bank of Nigeria (CBN) directives.
        </>
      }
    >
      <Clause id="commitment" heading="1. Commitment">
        <p>1.1. {BRAND.NAME} is committed to operating in compliance with all applicable anti-money laundering and counter-terrorism financing laws in Nigeria.</p>
        <p>1.2. We maintain systems, controls, and procedures proportionate to the nature and scale of our operations to detect, prevent, and report suspicious activity.</p>
        <p>1.3. All personnel with access to transaction data are trained on AML obligations and the recognition of suspicious activity.</p>
      </Clause>

      <Clause id="service-model" heading="2. Service model and risk profile">
        <p>2.1. {BRAND.NAME} operates as a B2B conversion routing service. End users access the {BRAND.NAME} checkout through partner platforms that have completed their own KYC and user verification processes.</p>
        <p>2.2. {BRAND.NAME} does not hold user accounts, store user funds beyond the transaction window, or establish direct relationships with end users.</p>
        <p>2.3. All deposits are made via bank transfer from Nigerian bank accounts. This provides inherent traceability, as bank accounts in Nigeria require BVN verification and are subject to CBN monitoring.</p>
        <p>2.4. Transaction limits (₦10,000 minimum, ₦1,000,000 maximum per transaction) are enforced at the checkout level and cannot be bypassed by the end user.</p>
      </Clause>

      <Clause id="kyc" heading="3. Know Your Customer">
        <p>3.1. End-user KYC is the responsibility of the partner platform. {BRAND.NAME} requires each partner platform to confirm, as a condition of integration, that it performs identity verification on its users in compliance with applicable law.</p>
        <p>3.2. {BRAND.NAME} performs due diligence on each partner platform before onboarding, including verification of the platform&apos;s legal registration, principal officers, and KYC procedures.</p>
        <p>3.3. Platform due diligence is reviewed annually or when a material change in the platform&apos;s operations is identified.</p>
        <p>3.4. {BRAND.NAME} reserves the right to request evidence of a platform&apos;s KYC procedures and to suspend service if the platform cannot demonstrate adequate user verification.</p>
      </Clause>

      <Clause id="monitoring" heading="4. Transaction monitoring">
        <p>4.1. All transactions processed through {BRAND.NAME} are logged with timestamps, amounts, payment references, and platform identifiers.</p>
        <p>4.2. The following patterns are flagged for review: multiple transactions from the same user identifier within a short period, transactions at or near the maximum deposit limit repeated in sequence, unusual spikes in transaction volume from a single platform, and transactions occurring at unusual hours relative to normal platform activity.</p>
        <p>4.3. Flagged transactions are reviewed by the designated compliance officer within twenty-four (24) hours.</p>
        <p>4.4. {BRAND.NAME} may pause, delay, or reverse transactions that are flagged during review, pending the outcome of the investigation.</p>
      </Clause>

      <Clause id="reporting" heading="5. Suspicious activity reporting">
        <p>5.1. Where a transaction or pattern of transactions gives rise to a reasonable suspicion of money laundering or terrorist financing, {BRAND.NAME} files a Suspicious Transaction Report (STR) with the Nigerian Financial Intelligence Unit (NFIU) in accordance with applicable law.</p>
        <p>5.2. {BRAND.NAME} does not notify the user, the platform, or any third party that a report has been filed, in compliance with the tipping-off prohibition under the Money Laundering (Prevention and Prohibition) Act 2022.</p>
        <p>5.3. Records of all STRs and supporting documentation are retained for a minimum of five (5) years from the date of filing.</p>
      </Clause>

      <Clause id="sanctions" heading="6. Sanctions screening">
        <p>6.1. Partner platforms are screened against applicable sanctions lists during onboarding and at regular intervals thereafter.</p>
        <p>6.2. {BRAND.NAME} does not process transactions involving persons, entities, or jurisdictions subject to sanctions imposed by the United Nations, the United States (OFAC), the European Union, or the Federal Government of Nigeria.</p>
        <p>6.3. Partner platforms are contractually required to screen their own users against applicable sanctions lists. {BRAND.NAME} relies on this screening as part of its layered compliance approach.</p>
      </Clause>

      <Clause id="records" heading="7. Record keeping">
        <p>7.1. Transaction records are retained for a minimum of six (6) years from the date of the transaction, in accordance with the Money Laundering (Prevention and Prohibition) Act 2022.</p>
        <p>7.2. Platform onboarding and due diligence records are retained for the duration of the relationship plus five (5) years after termination.</p>
        <p>7.3. Records are stored in encrypted form and access is restricted to authorised personnel.</p>
      </Clause>

      <Clause id="roles" heading="8. Compliance officer">
        <p>8.1. {BRAND.LEGAL_NAME} designates a compliance officer responsible for overseeing the implementation of this AML policy, reviewing flagged transactions, filing STRs where necessary, and maintaining AML records.</p>
        <p>8.2. The compliance officer reports directly to the company&apos;s directors and has the authority to suspend transactions or platform access when necessary to prevent financial crime.</p>
      </Clause>

      <Clause id="platform-obligations" heading="9. Platform obligations">
        <p>9.1. Each partner platform is required, under the Platform Services Agreement, to maintain its own AML/KYC programme adequate for the jurisdiction in which it operates.</p>
        <p>9.2. Platforms must notify {BRAND.NAME} of any regulatory action, investigation, or material change to their compliance programme that may affect their use of the {BRAND.NAME} service.</p>
        <p>9.3. {BRAND.NAME} reserves the right to terminate service to any platform that fails to maintain adequate AML controls or cooperate with compliance investigations.</p>
      </Clause>

      <Clause id="review" heading="10. Policy review">
        <p>10.1. This AML Policy is reviewed at least annually, or sooner if there is a material change in the regulatory environment, our service model, or the risk profile of our operations.</p>
        <p>10.2. Updates are published at this URL. Partner platforms are notified of material changes.</p>
      </Clause>
    </LegalPageLayout>
  );
}
