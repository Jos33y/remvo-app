import { useRef } from 'react';
import { useMarket } from '@hooks/useMarket';
import { CURRENCIES } from '@lib/market';
import styles from '@styles/ui/marketing/currency-switch.module.css';

/* CurrencySwitch
 *
 * US dollars, euros, pounds. A radio group drawn as a segmented
 * control: arrow keys move the choice, as a radio group should, and
 * the choice is shared with every price on the page and remembered.
 */
export function CurrencySwitch({ label = 'Prices in' }) {
  const { currency, setCurrency } = useMarket();
  const refs = useRef([]);

  function onKeyDown(e, i) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (i + step + CURRENCIES.length) % CURRENCIES.length;
    setCurrency(CURRENCIES[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div className={styles.wrap}>
      <span className={styles.label} id="currency-switch-label">{label}</span>
      <div className={styles.group} role="radiogroup" aria-labelledby="currency-switch-label">
        {CURRENCIES.map((c, i) => {
          const on = c.id === currency;
          return (
            <button
              key={c.id}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              className={`${styles.option} ${on ? styles.on : ''}`}
              onClick={() => setCurrency(c.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              <span aria-hidden="true">{c.symbol} </span>{c.id}
              <span className="sr-only">, {c.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
