import { useEffect } from 'react';
import { Link } from 'react-router';
import { LegalPageLayout, Clause } from '@components/layout/marketing/LegalPageLayout';
import { BRAND, ROUTES, PRICING, LEGAL_UPDATED } from '@utils/constants';

export function CreditsPage() {
  useEffect(() => {
    document.title = 'Remvo | Credit terms';
  }, []);

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
        <p>1.1. A credit is a prepaid unit for running jobs on {BRAND.NAME}. One credit costs {PRICING.CREDIT_PENCE}p before VAT.</p>
        <p>1.2. You buy credits in top-ups of {PRICING.PACKS.map((p) => `£${p.pounds}`).join(', ').replace(/, ([^,]*)$/, ' or $1')}, giving {PRICING.PACKS.map((p) => p.credits).join(', ').replace(/, ([^,]*)$/, ' or $1')} credits.</p>
        <p>1.3. Credits have no cash value. They cannot be withdrawn, exchanged for money, or moved to another account.</p>
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
        <p>4.2. Every new top-up extends your whole balance, including older credits, to {months} months from the day of that top-up.</p>
        <p>4.3. We email you 30 days and 7 days before any credits expire, with how many and the date.</p>
      </Clause>

      <Clause id="refunds" heading="5. Refunds">
        <p>5.1. Refunds of credits are set out in the <Link to={ROUTES.REFUNDS}>refund policy</Link>.</p>
      </Clause>
    </LegalPageLayout>
  );
}
