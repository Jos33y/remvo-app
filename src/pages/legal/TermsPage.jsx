import { useEffect } from 'react';
import { Link } from 'react-router';
import { LegalPageLayout, Clause } from '@components/layout/marketing/LegalPageLayout';
import { money } from '@lib/market';
import { BRAND, ROUTES, PRICING, LEGAL_UPDATED } from '@utils/constants';

const TOC = [
  { id: 'who', label: 'Who we are' },
  { id: 'service', label: 'The service' },
  { id: 'account', label: 'Your account' },
  { id: 'credits', label: 'Credits and payment' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'yours', label: 'Your responsibilities' },
  { id: 'ownership', label: 'Your content' },
  { id: 'others', label: 'Other services' },
  { id: 'changes', label: 'Changes to the service' },
  { id: 'liability', label: 'Liability' },
  { id: 'closing', label: 'Closing an account' },
  { id: 'terms', label: 'Changes to these terms' },
  { id: 'law', label: 'Law' },
  { id: 'contact', label: 'Contact' },
];

export function TermsPage() {
  useEffect(() => {
    document.title = 'Remvo | Terms of Service';
  }, []);

  return (
    <LegalPageLayout
      title="Terms of Service"
      date={LEGAL_UPDATED.label}
      dateTime={LEGAL_UPDATED.iso}
      version={LEGAL_UPDATED.version}
      tocItems={TOC}
      preamble={
        <>
          These terms cover your use of {BRAND.NAME}, software that prepares
          eBay listings. They are an agreement between you and{' '}
          {BRAND.LEGAL_NAME}. By creating an account or running a job you
          agree to them. If you do not agree, do not use the service.
        </>
      }
    >
      <Clause id="who" heading="1. Who we are">
        <p>1.1. {BRAND.NAME} is operated by {BRAND.LEGAL_NAME}, a company registered in Nigeria under RC {BRAND.RC_NUMBER}, at {BRAND.ADDRESS} (&quot;we&quot;, &quot;us&quot;).</p>
        <p>1.2. &quot;You&quot; means the person or business that holds a {BRAND.NAME} account.</p>
      </Clause>

      <Clause id="service" heading="2. The service">
        <p>2.1. You give {BRAND.NAME} a product, by its barcode or a link to its product page. {BRAND.NAME} returns a prepared eBay listing for it: a title, a description, an eBay category, item specifics, a parcel size and weight, and a suggested price.</p>
        <p>2.2. {BRAND.NAME} prepares the listing only. It does not post, change or end anything on your eBay account, does not connect to your eBay account, and never asks for your eBay password.</p>
        <p>2.3. A prepared listing is a draft for you to check. It is built from the product page and from what eBay shows publicly, and either can be incomplete or wrong.</p>
        <p>2.4. {BRAND.NAME} is not made, endorsed or approved by eBay or Amazon. eBay is a trademark of eBay Inc. Amazon is a trademark of Amazon.com, Inc. or its affiliates.</p>
      </Clause>

      <Clause id="account" heading="3. Your account">
        <p>3.1. You must be at least 18 to hold an account.</p>
        <p>3.2. You sign in with a link sent to your email address. Keep that inbox secure: anyone who can open it can sign in as you.</p>
        <p>3.3. One account is for one person or one business. Tell us straight away at {BRAND.EMAIL} if you think someone else has used your account.</p>
      </Clause>

      <Clause id="credits" heading="4. Credits and payment">
        <p>4.1. Jobs are paid for with credits. You buy credits in top-ups shown on the <Link to={ROUTES.PRICING}>pricing page</Link>. One credit is {money(PRICING.CREDIT.USD, 'USD')} in US dollars, {money(PRICING.CREDIT.EUR, 'EUR')} in euros or {money(PRICING.CREDIT.GBP, 'GBP')} in pounds.</p>
        <p>4.2. Purchases are processed by Polar Software, Inc. (&quot;Polar&quot;), which acts as merchant of record and reseller. Polar takes the payment, issues the receipt, and charges and accounts for any VAT or sales tax. Polar&apos;s buyer terms apply to the payment itself.</p>
        <p>4.3. Credits are a prepaid right to use {BRAND.NAME}. They are not money, have no cash value, cannot be withdrawn, and cannot be transferred to another account.</p>
        <p>4.4. How long credits last, and the order they are used in, is set out in the <Link to={ROUTES.CREDITS}>credit terms</Link>, which form part of these terms.</p>
        <p>4.5. Refunds are set out in the <Link to={ROUTES.REFUNDS}>refund policy</Link>, which forms part of these terms.</p>
        <p>4.6. A new account starts with free welcome credits, as the <Link to={ROUTES.CREDITS}>credit terms</Link> describe. They have no cash value.</p>
      </Clause>

      <Clause id="jobs" heading="5. Jobs">
        <p>5.1. A job reserves its credits when it starts. They are taken when the job delivers a listing. If the job fails, they are returned to your balance automatically.</p>
        <p>5.2. If a barcode matches more than one product, we show you the matches and you choose one before any credits are reserved.</p>
        <p>5.3. We may decline a job for an input that is not a product, or for a product listed in clause 6.3.</p>
      </Clause>

      <Clause id="yours" heading="6. Your responsibilities">
        <p>6.1. You check every listing before you publish it, and you are responsible for what you publish, including its accuracy, its price, and any claims it makes.</p>
        <p>6.2. You follow eBay&apos;s rules and the law where you sell.</p>
        <p>6.3. You only use {BRAND.NAME} for products you have the right to sell, and not for counterfeit goods, items eBay prohibits, or anything illegal where you sell it.</p>
        <p>6.4. You do not resell access to {BRAND.NAME}, run jobs through automated means we have not provided, try to get around the credit system, or interfere with the service or other people&apos;s use of it.</p>
      </Clause>

      <Clause id="ownership" heading="7. Your content">
        <p>7.1. The products you give us and the listings we prepare for you are yours to use as you like. We claim no ownership of them.</p>
        <p>7.2. You allow us to process them to run your jobs and to keep the service working, as described in the <Link to={ROUTES.PRIVACY}>privacy policy</Link>. We do not sell them, and we do not use one seller&apos;s listings or corrections in another seller&apos;s jobs.</p>
      </Clause>

      <Clause id="others" heading="8. Other services">
        <p>8.1. {BRAND.NAME} reads public product pages and eBay&apos;s public listing information to prepare your listing. We are not responsible for those services, their accuracy, or their availability.</p>
        <p>8.2. A listing may not reach the price we suggest, may not sell, and may be changed or removed by eBay. Those outcomes are not within our control.</p>
      </Clause>

      <Clause id="changes" heading="9. Changes to the service">
        <p>9.1. We may change, add or remove features. If we stop offering the service altogether, we refund the unused credits you paid for.</p>
        <p>9.2. We may change how many credits a job uses. We email you at least {PRICING.NOTICE_DAYS} days before the change takes effect. The change applies to jobs run after that date.</p>
      </Clause>

      <Clause id="liability" heading="10. Liability">
        <p>10.1. We provide {BRAND.NAME} with reasonable skill and care. Beyond that, the service and the listings it prepares are provided as they are.</p>
        <p>10.2. We are not liable for lost sales, lost profit, eBay fees, or decisions eBay makes about your listings or your account.</p>
        <p>10.3. Our total liability to you is limited to the amount you paid us in the 12 months before the claim.</p>
        <p>10.4. Nothing in these terms limits liability that the law does not allow to be limited, or takes away rights you have as a consumer under the law where you live.</p>
      </Clause>

      <Clause id="closing" heading="11. Closing an account">
        <p>11.1. You can close your account at any time from your account settings or by writing to {BRAND.EMAIL}. Credits still within the refund window are refunded as the <Link to={ROUTES.REFUNDS}>refund policy</Link> describes.</p>
        <p>11.2. We may suspend or close an account that breaks clause 6. We tell you why, unless the law prevents us. If we close your account for any other reason, we refund the unused credits you paid for.</p>
      </Clause>

      <Clause id="terms" heading="12. Changes to these terms">
        <p>12.1. We may update these terms. We email you at least 30 days before a change that affects you takes effect, and the date at the top of this page shows when they last changed.</p>
      </Clause>

      <Clause id="law" heading="13. Law">
        <p>13.1. These terms are governed by the laws of the Federal Republic of Nigeria.</p>
        <p>13.2. If you are a consumer in the United Kingdom or the European Union, you also keep the protection of the mandatory law where you live, and you may bring a claim in the courts there.</p>
      </Clause>

      <Clause id="contact" heading="14. Contact">
        <p>14.1. Questions about these terms: {BRAND.EMAIL}. Legal and company enquiries: {BRAND.LEGAL_EMAIL}.</p>
      </Clause>
    </LegalPageLayout>
  );
}
