import { Link } from 'react-router';
import { Button } from '@components/ui/shared/Button';
import { CurrencySwitch } from '@components/ui/marketing/CurrencySwitch';
import { useMarket } from '@hooks/useMarket';
import { CURRENCIES, money } from '@lib/market';
import { PRICING, APP_LINKS, ROUTES, listingsFor } from '@utils/constants';
import styles from '@styles/ui/marketing/pack-grid.module.css';

/* PackGrid
 *
 * The three top-ups, read from PRICING, used on the home page and the
 * pricing page so the two can never disagree. Prices follow the
 * visitor's currency, with the switch above them.
 *
 * A credit costs the same in every pack; the two bigger packs add
 * bonus credits, said on the card as a plain number. The $20 pack
 * carries the accent because the payment fee on the smallest is
 * nearly double; the card says what it buys, not that it is popular.
 */
export function PackGrid({ headingLevel = 3 }) {
  const H = `h${headingLevel}`;
  const { currency } = useMarket();
  const listing = PRICING.JOBS.LISTING;
  const symbol = CURRENCIES.find((c) => c.id === currency).symbol;
  const min = PRICING.CUSTOM.min[currency];
  const max = PRICING.CUSTOM.max[currency];

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <CurrencySwitch />
      </div>

      <p className={styles.welcome}>
        <strong>Your first listing is on us.</strong> Every new account starts with {PRICING.WELCOME.credits} free credits.
      </p>

      <ul className={styles.grid} role="list">
        {PRICING.PACKS.map((p) => {
          const price = p.price[currency];
          return (
            // data-chat-clear: on a phone the chat button steps aside while any part of a pack is under it.
            <li key={p.credits} className={`${styles.pack} ${p.featured ? styles.featured : ''}`} data-chat-clear="">
              <H className={styles.price}>
                <span className={styles.currency}>{symbol}</span>{price}
                <span className="sr-only"> top-up</span>
              </H>
              <p className={styles.credits}>
                {(p.credits + p.bonus).toLocaleString('en-GB')} credits
                {p.bonus > 0 && <span className={styles.bonus}>{p.credits.toLocaleString('en-GB')} + {p.bonus} bonus</span>}
              </p>
              <p className={styles.covers}>
                About {listingsFor(p.credits + p.bonus)} listings
                <span className={styles.coversNote}> at {listing.credits} credits each</span>
              </p>
              <Button
                href={APP_LINKS.TOP_UP}
                variant={p.featured ? 'primary' : 'secondary'}
                size="default"
                className={styles.buy}
              >
                Top up {money(price, currency)}
              </Button>
            </li>
          );
        })}
      </ul>

      <p className={styles.other}>
        Need a different amount? Top up anything from {money(min, currency)} to {money(max, currency, { whole: true })} in the app,
        at the same {money(PRICING.CREDIT[currency], currency)} a credit.
      </p>

      <p className={styles.terms}>
        Any VAT or sales tax is worked out at checkout for where you are, and shown before you pay.
        Credits last {PRICING.EXPIRY_MONTHS} months, and every top-up extends all the credits
        you have bought. <Link to={ROUTES.CREDITS} className={styles.link}>Credit terms</Link>
      </p>
    </div>
  );
}
