import { Link } from 'react-router';
import { ChatLine } from '@components/ui/marketing/ChatInvite';
import { Button } from '@components/ui/shared/Button';
import { CurrencySwitch } from '@components/ui/marketing/CurrencySwitch';
import { useMarket } from '@hooks/useMarket';
import { money } from '@lib/market';
import { PRICING, APP_LINKS, ROUTES, listingsFor } from '@utils/constants';
import styles from '@styles/ui/marketing/pack-grid.module.css';

/* PackGrid
 *
 * The top-ups, read from PRICING, used on the home page and the
 * pricing page so the two can never disagree. Prices follow the
 * visitor's currency, with the switch above them.
 *
 * Each tile says it the way the app's Credits page does: the price,
 * then what it makes (listings, in bold), the credits, and the price
 * of a listing at the foot. The bonus sits in a row every tile keeps,
 * so the lines line up. The $20 pack's button is the ivory one because
 * the payment fee on the smallest is nearly double; the tile says what
 * it buys, not that it is popular.
 */
export function PackGrid({ headingLevel = 3 }) {
  const H = `h${headingLevel}`;
  const { currency } = useMarket();
  const listing = PRICING.JOBS.LISTING;
  const min = PRICING.CUSTOM.min[currency];
  const max = PRICING.CUSTOM.max[currency];

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <p className={styles.welcome}>
          <strong>Your first listing is on us.</strong> Every new account starts with {PRICING.WELCOME.credits} free credits.
        </p>
        <CurrencySwitch />
      </div>

      <ul className={styles.grid} role="list">
        {PRICING.PACKS.map((p) => {
          const price = p.price[currency];
          const total = p.credits + p.bonus;
          const each = money(Math.round(((price * listing.credits) / total) * 100) / 100, currency);
          return (
            // data-chat-clear: on a phone the chat button steps aside while any part of a pack is under it.
            <li key={p.credits} className={`${styles.pack} ${p.featured ? styles.featured : ''}`} data-chat-clear="">
              <H className={styles.price}>
                {money(price, currency)}
                <span className="sr-only"> top-up</span>
              </H>
              <p className={styles.tag}>
                {p.bonus > 0 ? <span className={styles.bonus}>+{p.bonus} bonus</span> : null}
              </p>
              <p className={styles.listings}>{listingsFor(total)} listings</p>
              <p className={styles.credits}>{total.toLocaleString('en-GB')} credits</p>
              <p className={styles.each}><span className={styles.eachNum}>{each}</span> a listing</p>
              <Button
                href={APP_LINKS.TOP_UP}
                variant={p.featured ? 'ivory' : 'secondary'}
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

      <ChatLine className={styles.talk} hint="Roughly how many do you list a month?" action="Tell us roughly how many you list a month.">
        Not sure which pack fits?
      </ChatLine>

      <p className={styles.terms}>
        Any VAT or sales tax is worked out at checkout for where you are, and shown before you pay.
        Credits last {PRICING.EXPIRY_MONTHS} months, and every top-up extends all the credits
        you have bought. <Link to={ROUTES.CREDITS} className={styles.link}>Credit terms</Link>
      </p>
    </div>
  );
}
