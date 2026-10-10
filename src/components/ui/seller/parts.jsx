import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { Sheet } from '@components/ui/seller/Sheet';
import { useToast } from '@components/ui/seller/Toast';
import { IconAlert, IconBarcode, IconCheck, IconCopy, IconLink, IconPlus } from '@components/ui/seller/icons';
import { useSellerData } from '@context/SellerData';
import { useClipboard } from '@hooks/useClipboard';
import { readInput } from '@lib/sellerData';
import { longDate, penceAsPounds } from '@lib/sellerFormat';
import { PRICING, SELLER_ROUTES, listingsFor } from '@utils/constants';
import s from '@styles/pages/seller/app.module.css';

/* The pieces more than one screen uses. Each is small and reads its
 * data from useSellerData(), so a screen is a list of these. */

const LISTING = PRICING.JOBS.LISTING.credits;

// ══════════════════════════════════════════════════════════════════
//  Status of a listing
// ══════════════════════════════════════════════════════════════════

export function StatusPill({ status }) {
  if (status === 'ready') return <span className={`${s.pill} ${s.pillReady}`}>Ready</span>;
  if (status === 'failed') return <span className={`${s.pill} ${s.pillFailed}`}>Failed, credits back</span>;
  return <span className={`${s.pill} ${s.pillRunning}`}>Working</span>;
}

// ══════════════════════════════════════════════════════════════════
//  Balance card
// ══════════════════════════════════════════════════════════════════

export function BalanceCard({ onTopUp, compact = false }) {
  const { summary } = useSellerData();
  if (!summary) return null;
  const { balance, pence, listingsLeft, expiresAt } = summary;

  return (
    <section className={s.balance} aria-label="Balance">
      <p className={s.balanceLabel}>Balance</p>
      <p className={s.balanceFigure}>
        <span className={s.balanceNumber}>{balance}</span>
        <span className={s.balanceUnit}>{balance === 1 ? 'credit' : 'credits'}</span>
      </p>
      <p className={s.balanceMeta}>
        Worth {penceAsPounds(pence)}. Enough for <strong>{listingsLeft} {listingsLeft === 1 ? 'listing' : 'listings'}</strong>.
        {expiresAt && !compact && <><br />Lasts until {longDate(expiresAt)}.</>}
      </p>
      {onTopUp && (
        <div className={s.balanceActions}>
          <button type="button" className={`${s.button} ${s.primary} ${s.onCard}`} onClick={onTopUp}>
            <IconPlus size={18} /> Top up
          </button>
        </div>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Top-up sheet
// ══════════════════════════════════════════════════════════════════

export function TopUpSheet({ open, onClose }) {
  const { topUp, preview } = useSellerData();
  const toast = useToast();
  const [chosen, setChosen] = useState(PRICING.PACKS.find((p) => p.featured)?.pounds ?? PRICING.PACKS[0].pounds);
  const [busy, setBusy] = useState(false);
  const pack = PRICING.PACKS.find((p) => p.pounds === chosen);

  async function pay() {
    setBusy(true);
    try {
      // The real one: POST /v1/my/topups, then window.location to Polar's
      // checkout. The credits arrive by webhook when Polar confirms.
      await topUp(chosen);
      toast(`${pack.credits} credits added`);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={busy ? () => {} : onClose}
      title="Top up"
      footer={
        <>
          <button type="button" className={`${s.button} ${s.primary} ${s.block}`} onClick={pay} disabled={busy}>
            {busy ? 'Opening checkout' : `Continue to pay £${chosen}`}
          </button>
          <p className={`${s.small} ${s.centred}`}>
            {preview ? 'Preview: no payment is taken and the credits are pretend.' : 'Payment by Polar, our merchant of record. VAT is added at checkout where it applies.'}
          </p>
        </>
      }
    >
      <div className={s.packs} role="radiogroup" aria-label="Choose a top-up">
        {PRICING.PACKS.map((p) => (
          <button
            key={p.pounds}
            type="button"
            role="radio"
            aria-checked={chosen === p.pounds}
            className={s.pack}
            onClick={() => setChosen(p.pounds)}
            data-autofocus={chosen === p.pounds ? '' : undefined}
          >
            <span className={s.packPrice}>£{p.pounds}</span>
            <span className={s.packMain}>
              <span className={s.packCredits}>{p.credits} credits</span>
              <br />
              <span className={s.packSub}>About {listingsFor(p.credits)} listings</span>
            </span>
            <span className={s.radio} aria-hidden="true" />
          </button>
        ))}
      </div>
      <p className={`${s.small} ${s.after}`}>
        Credits last {PRICING.EXPIRY_MONTHS} months, and every top-up extends your whole balance. Unused credits are refunded in full if you ask within {PRICING.REFUND_DAYS} days.
      </p>
    </Sheet>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Make a listing: the one input
// ══════════════════════════════════════════════════════════════════

export function MakeListingForm({ autoFocus = false }) {
  const navigate = useNavigate();
  const { summary } = useSellerData();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const id = useId();
  const errId = useId();
  const looksLikeLink = /^(https?:|www\.|amazon\.)/i.test(value.trim());

  function submit(e) {
    e.preventDefault();
    const read = readInput(value);
    if (read.error) { setError(read.error); return; }
    navigate(SELLER_ROUTES.NEW_LISTING, { state: { raw: value } });
  }

  const short = summary && summary.balance < LISTING;

  return (
    <form className={s.card} onSubmit={submit} noValidate>
      <label htmlFor={id} className={s.label}>Make a listing</label>
      <div className={s.inputWrap}>
        <span className={s.inputIcon}>{looksLikeLink ? <IconLink size={20} /> : <IconBarcode size={20} />}</span>
        <input
          id={id}
          className={s.input}
          type="text"
          inputMode={looksLikeLink ? 'url' : 'text'}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          placeholder="Barcode or Amazon UK link"
          value={value}
          onChange={(e) => { setValue(e.target.value); if (error) setError(''); }}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errId : undefined}
          autoFocus={autoFocus}
        />
      </div>
      {error && <p id={errId} className={s.fieldError} role="alert"><IconAlert size={16} />{error}</p>}
      <div className={s.cardActions}>
        <button type="submit" className={`${s.button} ${s.primary} ${s.block}`}>
          Make listing, {LISTING} credits
        </button>
      </div>
      {short && <p className={s.hint}>Your balance is under {LISTING} credits. You can still check the product first; top up before it runs.</p>}
    </form>
  );
}

// ══════════════════════════════════════════════════════════════════
//  A field of a finished listing, with its own copy button
// ══════════════════════════════════════════════════════════════════

export function CopyField({ label, value, copyText, mono = false, count = null, clamp = false, children }) {
  const { copy, copied } = useClipboard({ resetMs: 1600 });
  const toast = useToast();
  const [open, setOpen] = useState(!clamp);

  async function onCopy() {
    if (await copy(copyText ?? value)) toast(`${label} copied`);
  }

  return (
    <div className={s.field}>
      <div className={s.fieldMain}>
        <p className={s.fieldLabel}>
          <span>{label}</span>
          {count !== null && <span className={s.fieldCount}>{count}</span>}
        </p>
        {children ?? (
          <p className={`${s.fieldValue} ${mono ? s.fieldValueMono : ''} ${open ? '' : s.fieldClamp}`}>{value}</p>
        )}
        {clamp && !open && (
          <button type="button" className={s.fieldMore} onClick={() => setOpen(true)}>Show all</button>
        )}
      </div>
      <button type="button" className={`${s.copy} ${copied ? s.copied : ''}`} onClick={onCopy} aria-label={`Copy ${label.toLowerCase()}`}>
        {copied ? <IconCheck size={20} /> : <IconCopy size={20} />}
      </button>
    </div>
  );
}

