import { Link } from 'react-router';
import { Reveal } from '@components/ui/marketing/Reveal';
import { Button } from '@components/ui/shared/Button';
import { PackGrid } from '@components/ui/marketing/PackGrid';
import { useMarket } from '@hooks/useMarket';
import { money } from '@lib/market';
import { ROUTES, APP_LINKS, PRICING, listingsFor, creditsCost } from '@utils/constants';
import styles from '@styles/pages/marketing/info-page.module.css';

function Section({ heading, children }) {
  return (
    <Reveal>
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>{heading}</h2>
        <div className={styles.sectionBody}>{children}</div>
      </section>
    </Reveal>
  );
}

export function PricingPage() {
  const { currency } = useMarket();
  const cost = (credits) => money(creditsCost(credits, currency), currency);
  const first = PRICING.PACKS[0];

  const jobs = Object.values(PRICING.JOBS);

  return (
    <>
      <section className={styles.intro} aria-labelledby="pricing-heading">
        <div className={styles.introInner}>
          <Reveal>
            <span className={styles.label}>Pricing</span>
            <h1 id="pricing-heading" className={styles.title}>
              Pay for what you list. Nothing else.
            </h1>
            <p className={styles.lede}>
              Top up credits, spend them on jobs. No subscription, no monthly
              fee, nothing to cancel.
            </p>
          </Reveal>
        </div>
      </section>

      <section className={styles.band} aria-label="Top-ups">
        <div className={styles.bandInner}>
          <Reveal delay={100}>
            <PackGrid headingLevel={2} />
          </Reveal>
        </div>
      </section>

      <div className={styles.body}>
        <div className={styles.bodyInner}>
          <Section heading="What each job uses">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Job</th>
                  <th scope="col" className={styles.num}>Credits</th>
                  <th scope="col" className={styles.num}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.name}>
                    <th scope="row">{j.name}</th>
                    {j.live ? (
                      <>
                        <td className={styles.num}>{j.credits}</td>
                        <td className={styles.num}>{cost(j.credits)}</td>
                      </>
                    ) : (
                      <td className={styles.num} colSpan={2}>
                        <span className={styles.soon}>Coming soon</span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section heading="Currencies">
            <p>
              Pay in US dollars, euros or pounds. We suggest one from where you
              are and you can change it at any time. The credits are the same in
              each: one credit is {money(PRICING.CREDIT.USD, 'USD')}, {money(PRICING.CREDIT.EUR, 'EUR')} or {money(PRICING.CREDIT.GBP, 'GBP')}.
            </p>
            <p className={styles.muted}>
              Outside the eurozone and the UK, prices are in US dollars.
            </p>
          </Section>

          <Section heading="Tax and receipts">
            <p>
              Any VAT or sales tax is worked out at checkout for where you are,
              and shown before you pay.
            </p>
            <p className={styles.muted}>
              Payments are processed by Polar, our merchant of record. Your
              receipt comes from Polar and covers the tax.
            </p>
          </Section>

          <Section heading="How long credits last">
            <p>
              {PRICING.EXPIRY_MONTHS} months from the top-up that bought them.
              Every new top-up extends all the credits you have bought to{' '}
              {PRICING.EXPIRY_MONTHS} months from that day.
            </p>
            <p>
              The {PRICING.WELCOME.credits} welcome credits every new account starts with
              last {PRICING.WELCOME.days} days, and a top-up does not change that.
            </p>
            <p className={styles.muted}>
              We email you 30 days and 7 days before any credits expire.
            </p>
          </Section>

          <Section heading="Refunds">
            <ul className={styles.list}>
              <li>A job that fails returns its credits on its own.</li>
              <li>
                Unused credits are refunded in full if you ask within{' '}
                {PRICING.REFUND_DAYS} days of buying them.
              </li>
              <li>
                Not happy with a listing? Tell us within {PRICING.REFUND_DAYS} days
                and we return the credits for that job.
              </li>
            </ul>
            <p className={`${styles.muted} ${styles.after}`}>
              The full wording is in the <Link to={ROUTES.REFUNDS} className={styles.link}>refund policy</Link>{' '}
              and the <Link to={ROUTES.CREDITS} className={styles.link}>credit terms</Link>.
            </p>
          </Section>
        </div>
      </div>

      <section className={styles.close} aria-label="Get started">
        <div className={styles.closeInner}>
          <p className={styles.closeHeading}>
            Your first listing is on us. After that, {money(first.price[currency], currency)} is {listingsFor(first.credits)} listings.
          </p>
          <Button href={APP_LINKS.SIGN_IN} variant="primary" size="large">
            Make your first listing
          </Button>
        </div>
      </section>
    </>
  );
}
