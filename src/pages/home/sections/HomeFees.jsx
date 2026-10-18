import { Button } from '@components/ui/shared/Button';
import { useMarket } from '@hooks/useMarket';
import { FEE_TABLES } from '@lib/feeTables';
import { ROUTES } from '@utils/constants';
import styles from '@styles/pages/marketing/homepage.module.css';

/* calc1: the free fee calculator, from the home page.
 *
 * Right after Remvo's own price, the question every seller asks next:
 * what does eBay take? The rates beside it are read from the same
 * table the calculator uses, with the date they were checked, so the
 * home page can never quote a rate the calculator does not. The button
 * opens the calculator for the visitor's eBay site (UK, or eBay.com). */

const day = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

const RATES = [
  ['eBay.com', FEE_TABLES.US.standard.label, FEE_TABLES.US.standard.text],
  ['eBay.co.uk', `Business, ${FEE_TABLES.UK.standard.label.toLowerCase()}`, FEE_TABLES.UK.standard.text],
  ['eBay.co.uk', 'Private sellers', FEE_TABLES.UK.private?.fees === 'none' ? 'No selling fees' : 'See the calculator'],
];

export function HomeFees() {
  const { marketplace } = useMarket();
  const uk = marketplace === 'UK';

  return (
    <section className={styles.fees} aria-labelledby="fees-heading">
      <div className={styles.inner}>
        <div className={styles.feesPanel}>
          <div>
            <h2 id="fees-heading" className={styles.h2}>What does eBay take from your sale?</h2>
            <p className={styles.feesDesc}>
              Type a price and see eBay’s fees and what you keep, after your item cost and postage. For
              eBay.com and eBay.co.uk, private or business. Free, and no sign-up.
            </p>
            <Button href={uk ? ROUTES.FEES_UK : ROUTES.FEES_US} variant="secondary" size="default">
              Open the fee calculator
            </Button>
          </div>
          <div className={styles.feesSide}>
            <dl className={styles.feesRates}>
              {RATES.map(([site, who, rate]) => (
                <div key={`${site}${who}`} className={styles.feesRate}>
                  <dt><span className={styles.feesSite}>{site}</span> {who}</dt>
                  <dd>{rate}</dd>
                </div>
              ))}
            </dl>
            <p className={styles.feesChecked}>eBay’s final value fees, checked {day(FEE_TABLES.US.checked)}. The calculator adds the per-order fee, categories and VAT.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
