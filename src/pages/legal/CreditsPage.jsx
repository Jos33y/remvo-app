import { Link } from 'react-router';
import { LegalPageLayout, Clause } from '@components/layout/marketing/LegalPageLayout';
import { money } from '@lib/market';
import { BRAND, ROUTES, PRICING, LEGAL_UPDATED } from '@utils/constants';

const list = (xs) => xs.join(', ').replace(/, ([^,]*)$/, ' or $1');

export function CreditsPage() {

  const months = PRICING.EXPIRY_MONTHS;
  const jobs = Object.values(PRICING.JOBS).filter((j) => j.live);

  return (
    <LegalPageLayout
      title="Credit terms"
      date={LEGAL_UPDATED.label}
      dateTime={LEGAL_UPDATED.iso}
      version={LEGAL_UPDATED.version}
      preamble={
        <>
          How {BRAND.NAME} credits work. These terms form part of the{' '}
          <Link to={ROUTES.TERMS}>terms of service</Link>.
        </>
      }
    >
      <Clause id="what" heading="1. What a credit is">
        <p>1.1. A credit is a prepaid unit for running jobs on {BRAND.NAME}. One credit costs {money(PRICING.CREDIT.USD, 'USD')} in US dollars, {money(PRICING.CREDIT.EUR, 'EUR')} in euros or {money(PRICING.CREDIT.GBP, 'GBP')} in pounds. Any VAT or sales tax is worked out by Polar at checkout.</p>
        <p>1.2. You buy credits in top-ups of {list(PRICING.PACKS.map((p) => p.credits))} credits, priced at {list(PRICING.PACKS.map((p) => money(p.price.USD, 'USD')))} in US dollars, {list(PRICING.PACKS.map((p) => money(p.price.EUR, 'EUR')))} in euros, or {list(PRICING.PACKS.map((p) => money(p.price.GBP, 'GBP')))} in pounds. You can also top up any whole amount from {money(PRICING.CUSTOM.min.USD, 'USD')} to {money(PRICING.CUSTOM.max.USD, 'USD', { whole: true })} ({money(PRICING.CUSTOM.min.EUR, 'EUR')} to {money(PRICING.CUSTOM.max.EUR, 'EUR', { whole: true })}, or {money(PRICING.CUSTOM.min.GBP, 'GBP')} to {money(PRICING.CUSTOM.max.GBP, 'GBP', { whole: true })}) at the same price per credit.</p>
        <p>1.3. You pay in US dollars, euros or pounds. Outside the eurozone and the United Kingdom, prices are in US dollars.</p>
        <p>1.4. Credits have no cash value. They cannot be withdrawn, exchanged for money, or moved to another account.</p>
        <p>1.5. Every new account starts with {PRICING.WELCOME.credits} welcome credits, enough for one listing. They are free.</p>
        <p>1.6. Welcome credits are given once per account, and once a day per internet connection. An account made from a connection that has already had them that day starts without them.</p>
        <p>1.7. Some top-ups add bonus credits: {PRICING.PACKS.filter((p) => p.bonus).map((p) => `${p.bonus} with the ${p.credits.toLocaleString('en-GB')}-credit top-up`).join(' and ')}. From 20 November to {PRICING.PEAK.lastDay} 2026, top-ups of {PRICING.PEAK.minCredits} credits or more also add {PRICING.PEAK.percent}% of the credits bought. Bonus credits are added with the top-up, last as long as it does, and have no cash value.</p>
        <p>1.8. If a top-up is refunded, its bonus credits are taken back in the same proportion as the money returned.</p>
      </Clause>

      <Clause id="use" heading="2. What a job uses">
        {jobs.map((j, i) => (
          <p key={j.name}>2.{i + 1}. {j.name}: {j.credits} credits.</p>
        ))}
        <p>2.{jobs.length + 1}. Credits are reserved when a job starts, taken when it delivers, and returned automatically if it fails.</p>
        <p>2.{jobs.length + 2}. We may change how many credits a job uses. We email you at least {PRICING.NOTICE_DAYS} days before, and the change applies only to jobs run after that date.</p>
      </Clause>

      <Clause id="order" heading="3. Which credits are used first">
        <p>3.1. The credits closest to expiring are used first.</p>
      </Clause>

      <Clause id="expiry" heading="4. When credits expire">
        <p>4.1. Credits expire {months} months after the top-up that bought them.</p>
        <p>4.2. Every new top-up extends all the credits you have bought, including older ones, to {months} months from the day of that top-up.</p>
        <p>4.3. We email you 30 days and 7 days before any credits you have bought expire, with how many and the date.</p>
        <p>4.4. Welcome credits expire {PRICING.WELCOME.days} days after your account is made. A top-up does not extend them.</p>
      </Clause>

      <Clause id="refunds" heading="5. Refunds">
        <p>5.1. Refunds of credits are set out in the <Link to={ROUTES.REFUNDS}>refund policy</Link>.</p>
        <p>5.2. Welcome credits are free, so there is nothing to refund. A listing that fails gives them back, as it does any credits.</p>
      </Clause>
    </LegalPageLayout>
  );
}
