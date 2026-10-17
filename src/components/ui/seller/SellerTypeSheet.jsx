import { Sheet } from '@components/ui/seller/Sheet';
import s from '@styles/pages/seller/app.module.css';
import P from '@styles/pages/seller/profit.module.css';

/* ──────────────────────────────────────────────────────────────────
 * How the seller's eBay account is set up (profit1)
 *
 * eBay.co.uk, .de, .fr, .it and .es charge private and business
 * sellers differently, so profit is worked out on the one the seller
 * says. Used for nothing else. Opened from Profile and from the profit
 * card's "Change".
 * ────────────────────────────────────────────────────────────────── */

export const SELLER_TYPES = Object.freeze([
  { id: 'private', name: 'Private', sub: 'No selling fees on eBay.co.uk, .de, .fr and .it. The buyer pays a protection fee on .co.uk, .fr and .it.' },
  { id: 'business', name: 'Business', sub: "eBay's business seller fees, by category." },
]);

export const sellerTypeName = (settings) => {
  if (settings?.sellerType === 'business') return settings.vatRegistered ? 'Business, VAT registered' : 'Business';
  if (settings?.sellerType === 'private') return 'Private';
  return 'Not set';
};

export function SellerTypeSheet({ open, onClose, settings, onChoose }) {
  const type = settings?.sellerType ?? null;
  const vat = Boolean(settings?.vatRegistered);
  return (
    <Sheet open={open} onClose={onClose} title="Your eBay account">
      <div className={s.packs} role="radiogroup" aria-label="Your eBay account">
        {SELLER_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={type === t.id}
            className={s.pack}
            // Business stays open: the VAT question comes next.
            onClick={() => onChoose({ sellerType: t.id }, t.id === 'business' ? 'Business seller fees' : 'Private seller fees', t.id === 'business')}
            data-autofocus={type === t.id || (!type && t.id === 'private') ? '' : undefined}
          >
            <span className={s.packMain}>
              <span className={s.packCredits}>{t.name}</span>
              <span className={s.packSub}>{t.sub}</span>
            </span>
            <span className={s.radio} aria-hidden="true" />
          </button>
        ))}
      </div>

      {type === 'business' && (
        <div className={P.switchRow}>
          <span className={P.switchText}>
            <span id="vat-label" className={P.switchLabel}>Registered for VAT</span>
            <span className={s.packSub}>Profit is then worked out without VAT, and the VAT on eBay&apos;s fees is reclaimed.</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={vat}
            aria-labelledby="vat-label"
            className={P.switch}
            onClick={() => onChoose({ vatRegistered: !vat }, vat ? 'Not VAT registered' : 'VAT registered', true)}
          >
            <span className={P.switchKnob} aria-hidden="true" />
          </button>
        </div>
      )}

      <p className={`${s.small} ${s.after}`}>Used only to work out profit. Your eBay account settings say which yours is. eBay.com and eBay.ca charge every seller the same.</p>
    </Sheet>
  );
}
