import { useEffect } from 'react';
import {
  LegalPageLayout,
  Clause,
} from '@components/layout/marketing/LegalPageLayout';
import { BRAND } from '@utils/constants';

export function AMLPage() {
  useEffect(() => {
    document.title = 'Remvo | AML Policy';
  }, []);

  return (
    <LegalPageLayout
      title="Anti-Money Laundering Policy"
      date="18 September 2026"
      dateTime="2026-09-18"
      version="v1.2"
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
        <p>1.2. We are a small company. Our controls are deliberately simple, automatic where possible, and proportionate to the scale of our operations. We describe below only the controls we actually operate, and we review this policy whenever that changes.</p>
        <p>1.3. Both directors of {BRAND.LEGAL_NAME} have access to transaction data and are responsible for recognising and escalating suspicious activity. No other personnel have access to customer or transaction records.</p>
      </Clause>

      <Clause id="service-model" heading="2. Service model and risk profile">
        <p>2.1. {BRAND.NAME} sells to customers who reach our checkout from a partner platform. The customer purchases from us, pays us, and receives value applied to their account on that platform.</p>
        <p>2.2. We collect the customer&apos;s name, email address, and phone number at checkout, and we retain them against the transaction. We do not hold customer accounts, and we do not hold customer funds beyond the transaction and settlement window.</p>
        <p>2.3. All payments are made by bank transfer from Nigerian bank accounts. This provides inherent traceability: bank accounts in Nigeria require BVN verification and are subject to CBN monitoring. We do not accept cards, cash, or payment from outside the Nigerian banking system.</p>
        <p>2.4. Transaction limits (₦10,000 minimum, ₦1,000,000 maximum per session) are enforced at the checkout level and cannot be bypassed by the customer.</p>
        <p>2.5. We operate in one corridor with a small number of partner platforms. Our volumes are low enough that every transaction can be, and is, individually visible to a director.</p>
      </Clause>

      <Clause id="kyc" heading="3. Customer due diligence">
        <p>3.1. We collect and retain the name, email address, and phone number of every customer who purchases from us. These are entered or confirmed by the customer on our own checkout page before payment.</p>
        <p>3.2. Our payment provider reports to us the name and bank of the account from which each payment was sent. We retain this against the transaction.</p>
        <p>3.3. We do not perform documentary identity verification and we do not represent that we do. Our diligence rests on three layers: the details the customer gives us directly, the BVN-verified bank account the payment is sent from, and the verification the partner platform has performed on its own users.</p>
        <p>3.4. Partner platforms are contractually required to verify the identity of their users before those users can reach our checkout, and to provide evidence of that verification for a named user on our request. We review each platform&apos;s verification procedures before onboarding and at least annually thereafter.</p>
        <p>3.5. We may decline or reverse any transaction where we are not satisfied as to the identity of the customer or the source of the payment.</p>
      </Clause>

      <Clause id="monitoring" heading="4. Transaction monitoring">
        <p>4.1. Every transaction is logged with the customer&apos;s details, the sending account name and bank, timestamps, amount, rate, payment reference, and platform identifier. Records are retained as set out in clause 7.</p>
        <p>4.2. Sender name check: we compare the name the customer gives at checkout against the name on the bank account the payment was sent from. A material mismatch indicates payment by a third party and is flagged for review before settlement.</p>
        <p>4.3. We also flag for review: repeated transactions at or near the maximum amount, multiple transactions from the same customer within a short period, multiple customers paying from the same bank account, and unusual changes in volume from a single platform.</p>
        <p>4.4. Flagged transactions are reviewed by the compliance officer before the related settlement is released. Where a review cannot be completed, the settlement is held rather than released.</p>
        <p>4.5. We may pause, delay, or refund any transaction that is flagged during review, pending the outcome.</p>
      </Clause>

      <Clause id="reporting" heading="5. Suspicious activity reporting">
        <p>5.1. Where a transaction or pattern of transactions gives rise to a reasonable suspicion of money laundering or terrorist financing, we report it to the appropriate authority, including the Nigerian Financial Intelligence Unit (NFIU) where applicable, and cooperate fully with any resulting enquiry. We also notify our payment provider where their rails were used.</p>
        <p>5.2. We do not notify the customer, the platform, or any third party that a report has been filed, in compliance with the tipping-off prohibition under the Money Laundering (Prevention and Prohibition) Act 2022.</p>
        <p>5.3. Records of all reports and supporting documentation are retained for a minimum of five (5) years from the date of filing.</p>
      </Clause>

      <Clause id="sanctions" heading="6. Sanctions">
        <p>6.1. We do not knowingly process transactions involving persons, entities, or jurisdictions subject to sanctions imposed by the United Nations, the United States (OFAC), the European Union, or the Federal Government of Nigeria.</p>
        <p>6.2. Partner platforms are screened against applicable sanctions lists before onboarding and are contractually required to screen their own users.</p>
        <p>6.3. Because we retain the customer&apos;s name and the sending account name for every transaction, we are able to screen any customer against sanctions lists on request from a regulator, our payment provider, or on our own initiative during a review.</p>
        <p>6.4. All payments originate from Nigerian bank accounts, which are themselves subject to sanctions screening by the sending bank.</p>
      </Clause>

      <Clause id="records" heading="7. Record keeping">
        <p>7.1. Transaction and customer records, including name, email address, phone number, and sending account details, are retained for a minimum of six (6) years from the date of the transaction, in accordance with the Money Laundering (Prevention and Prohibition) Act 2022.</p>
        <p>7.2. Platform onboarding and due diligence records are retained for the duration of the relationship plus five (5) years after termination.</p>
        <p>7.3. Records are stored in encrypted form and access is restricted to the directors of {BRAND.LEGAL_NAME}.</p>
        <p>7.4. We provide customer and transaction records to our payment provider, a regulator, or a law enforcement agency on lawful request.</p>
      </Clause>

      <Clause id="roles" heading="8. Compliance officer">
        <p>8.1. {BRAND.LEGAL_NAME} designates one of its directors as compliance officer, responsible for reviewing flagged transactions, deciding whether a report is required, filing reports, and maintaining AML records. The identity of the designated director is provided to regulators, payment providers, and partner platforms on request.</p>
        <p>8.2. The compliance officer has the authority to hold a settlement, decline a transaction, or suspend a platform&apos;s access where necessary to prevent financial crime, and exercises that authority independently of commercial considerations.</p>
        <p>8.3. Compliance enquiries may be directed to {BRAND.EMAIL} marked for the attention of the compliance officer.</p>
      </Clause>

      <Clause id="platform-obligations" heading="9. Platform obligations">
        <p>9.1. Each partner platform is required, under the Platform Services Agreement, to maintain its own AML and identity verification programme adequate for the jurisdiction in which it operates.</p>
        <p>9.2. Platforms must provide evidence of identity verification for a named user on our request, within the period set out in that Agreement.</p>
        <p>9.3. Platforms must notify us of any regulatory action, investigation, or material change to their compliance programme that may affect their use of the {BRAND.NAME} service.</p>
        <p>9.4. We reserve the right to suspend or terminate service to any platform that fails to maintain adequate controls or to cooperate with a compliance enquiry.</p>
      </Clause>

      <Clause id="review" heading="10. Policy review">
        <p>10.1. This policy is reviewed at least annually, and sooner if there is a material change in the regulatory environment, our service model, or the risk profile of our operations.</p>
        <p>10.2. Updates are published at this URL with a version number and date. Partner platforms are notified of material changes.</p>
      </Clause>
    </LegalPageLayout>
  );
}
