import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Sheet } from '@components/ui/seller/Sheet';
import { useToast } from '@components/ui/seller/Toast';
import { IconAlert, IconBarcode, IconCheck, IconCopy, IconEdit, IconLink } from '@components/ui/seller/icons';
import { useSellerData } from '@context/SellerData';
import { useClipboard } from '@hooks/useClipboard';
import { CONDITION, CONDITIONS, readInput } from '@lib/sellerData';
import { count, num } from '@lib/plural';
import { CURRENCIES, MARKETPLACE, money } from '@lib/market';
import { PRICING, SELLER_ROUTES, creditsFor, listingsFor } from '@utils/constants';
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
  if (status === 'queued') return <span className={`${s.pill} ${s.pillRunning}`}>Waiting</span>;
  return <span className={`${s.pill} ${s.pillRunning}`}>Working</span>;
}

// ══════════════════════════════════════════════════════════════════
//  A radio group drawn as a segmented control. Arrow keys move the
//  choice, as in any radio group.
// ══════════════════════════════════════════════════════════════════

export function SegmentedChoice({ label, options, value, onChange, labelHidden = false }) {
  const refs = useRef([]);
  const labelId = useId();

  function onKeyDown(e, i) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (i + step + options.length) % options.length;
    onChange(options[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div className={s.segmentedWrap}>
      <p id={labelId} className={labelHidden ? 'sr-only' : s.choiceLabel}>{label}</p>
      <div className={`${s.segmented} ${options.length > 3 ? s.segmentedMany : ''}`} role="radiogroup" aria-labelledby={labelId}>
        {options.map((o, i) => (
          <button
            key={o.id}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            tabIndex={value === o.id ? 0 : -1}
            className={s.segment}
            onClick={() => onChange(o.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Top-up sheet
//
//  The three packs, or any whole amount, in the seller's currency.
//  The currency can be changed here as well as in Profile, because
//  this is where a seller notices it.
// ══════════════════════════════════════════════════════════════════

const OTHER = 'other';

/**
 * The packs on sale, with what each adds. From the API when it has read
 * Polar (so a pack not set up there is never shown), otherwise from
 * PRICING. Prices always from PRICING: the API sells by pack, Polar
 * charges the pack's price.
 */
export function useOffers() {
  const { packs, peak } = useSellerData();
  return useMemo(() => {
    const list = packs ?? PRICING.PACKS.map((p) => ({ credits: p.credits, volumeBonus: p.bonus, peakBonus: 0, total: p.credits + p.bonus }));
    return {
      peak,
      offers: list
        .map((o) => ({ ...o, pack: PRICING.PACKS.find((p) => p.credits === o.credits) }))
        .filter((o) => o.pack),
    };
  }, [packs, peak]);
}

/** What a pack adds on top, as one tag: "+50 bonus" (green), or in the
 * peak "+350 extra" (plum; the peak note says why). One tag, so the
 * tiles never read like a sale rack. */
export function BonusTag({ offer }) {
  const extra = (offer.volumeBonus ?? 0) + (offer.peakBonus ?? 0);
  if (!extra) return null;
  const peak = offer.peakBonus > 0;
  return (
    <span className={s.bonusTag}>
      <span className={peak ? s.bonusPeak : undefined}>+{num(extra)} {peak ? 'extra' : 'bonus'}</span>
    </span>
  );
}

/** What one listing costs in a pack, bonus included: "$0.27". */
export function perListing(price, total, listingCredits, currency) {
  return money(Math.round(((price * listingCredits) / total) * 100) / 100, currency);
}

export function TopUpSheet({ open, onClose, start = null }) {
  const { topUp, settings, updateSettings, topUpsEnabled, summary } = useSellerData();
  const { offers, peak } = useOffers();
  const currency = settings?.currency ?? 'USD';
  const [chosen, setChosen] = useState(start ?? PRICING.PACKS.find((p) => p.featured)?.credits ?? PRICING.PACKS[0].credits);
  useEffect(() => { if (open && start) setChosen(start); }, [open, start]);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const amountId = useId();
  const amountErr = useId();

  const min = PRICING.CUSTOM.min[currency];
  const max = PRICING.CUSTOM.max[currency];
  const pack = PRICING.PACKS.find((p) => p.credits === chosen) ?? PRICING.PACKS[0];
  const whole = /^\d+$/.test(amount.trim()) ? Number(amount.trim()) : null;
  const otherCredits = whole ? creditsFor(whole, currency) : 0;
  const ready = Boolean(summary) && topUpsEnabled;
  const payLabel = chosen === OTHER
    ? (whole ? `Continue to pay ${money(whole, currency, { whole: true })}` : 'Continue')
    : `Continue to pay ${money(pack.price[currency], currency)}`;

  async function pay() {
    let what;
    if (chosen === OTHER) {
      if (whole === null || whole < min || whole > max) {
        setError(`Enter a whole amount from ${money(min, currency)} to ${money(max, currency, { whole: true })}.`);
        return;
      }
      what = { amount: whole };
    } else {
      what = { credits: chosen };
    }
    setBusy(true);
    setFailure('');
    try {
      // Goes to Polar's checkout. The credits arrive by webhook once
      // Polar confirms; the Credits page waits for them on the way back.
      await topUp(what);
    } catch (err) {
      setFailure(err.message);
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
          <button type="button" className={`${s.button} ${s.primary} ${s.block}`} onClick={pay} disabled={busy || !ready}>
            {busy ? 'Opening checkout…' : payLabel}
          </button>
          <p className={`${s.small} ${s.centred}`}>Checkout by Polar. Any tax is added before you pay.</p>
        </>
      }
    >
      {summary && !topUpsEnabled && (
        <p className={`${s.notice} ${s.sheetNotice}`} role="status">Top-ups open soon. Nothing can be bought just yet.</p>
      )}
      {failure && (
        <p className={`${s.notice} ${s.noticeDanger} ${s.sheetNotice}`} role="alert"><IconAlert size={20} /><span>{failure}</span></p>
      )}

      <SegmentedChoice
        label="Pay in"
        options={CURRENCIES.map((c) => ({ id: c.id, label: `${c.symbol} ${c.id}` }))}
        value={currency}
        onChange={(id) => { setError(''); setFailure(''); updateSettings({ currency: id }).catch((err) => setFailure(err.message)); }}
      />

      {peak && (
        <p className={`${s.peakNote} ${s.after}`}>
          <strong>Peak bonus:</strong> {peak.percent}% extra credits on top-ups of {money(PRICING.PACKS.find((p) => p.credits === peak.minCredits)?.price[currency] ?? 20, currency)} or more, until {PRICING.PEAK.lastDay}.
        </p>
      )}
      <div className={`${s.packs} ${s.after}`} role="radiogroup" aria-label="Choose a top-up">
        {offers.map((o) => (
          <button
            key={o.credits}
            type="button"
            role="radio"
            aria-checked={chosen === o.credits}
            className={s.pack}
            onClick={() => { setChosen(o.credits); setError(''); }}
            data-autofocus={chosen === o.credits ? '' : undefined}
          >
            <span className={s.packPrice}>{money(o.pack.price[currency], currency)}</span>
            <span className={s.packMain}>
              <span className={s.packCredits}>{count(o.total, 'credit')}</span>
              <BonusTag offer={o} />
              <span className={s.packSub}>About {count(listingsFor(o.total), 'listing')}</span>
            </span>
            <span className={s.radio} aria-hidden="true" />
          </button>
        ))}
        <button
          type="button"
          role="radio"
          aria-checked={chosen === OTHER}
          className={s.pack}
          onClick={() => setChosen(OTHER)}
          data-autofocus={chosen === OTHER ? '' : undefined}
        >
          <span className={s.packMain}>
            <span className={s.packCredits}>Other amount</span>
            <br />
            <span className={s.packSub}>{money(min, currency)} to {money(max, currency, { whole: true })}, whole amounts</span>
          </span>
          <span className={s.radio} aria-hidden="true" />
        </button>
      </div>

      {chosen === OTHER && (
        <div className={s.after}>
          <label htmlFor={amountId} className={s.label}>Amount</label>
          <div className={s.inputWrap}>
            <span className={`${s.inputIcon} ${s.inputPrefix}`} aria-hidden="true">{CURRENCIES.find((c) => c.id === currency).symbol}</span>
            <input
              id={amountId}
              className={`${s.input} ${s.inputMoney}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              enterKeyHint="done"
              placeholder={String(PRICING.PACKS[1].price[currency])}
              value={amount}
              onChange={(e) => { setAmount(e.target.value.replace(/[^\d]/g, '').slice(0, 5)); setError(''); }}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? amountErr : undefined}
              autoFocus
            />
          </div>
          {error
            ? <p id={amountErr} className={s.fieldError} role="alert"><IconAlert size={16} />{error}</p>
            : <p className={s.hint} aria-live="polite">{whole ? `${count(otherCredits, 'credit')}${peak && otherCredits >= peak.minCredits ? `, plus ${num(Math.floor((otherCredits * peak.percent) / 100))} peak bonus` : ''}, about ${count(listingsFor(otherCredits + (peak && otherCredits >= peak.minCredits ? Math.floor((otherCredits * peak.percent) / 100) : 0)), 'listing')}` : `${money(PRICING.CREDIT[currency], currency)} a credit`}</p>}
        </div>
      )}

      <p className={`${s.small} ${s.after}`}>
        Credits last {PRICING.EXPIRY_MONTHS} months, and every top-up extends all the credits you have bought. Unused credits are refunded in full if you ask within {PRICING.REFUND_DAYS} days.
      </p>
    </Sheet>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Make a listing: the one input, and the product's condition
// ══════════════════════════════════════════════════════════════════

export function MakeListingForm({ autoFocus = false, hero = false }) {
  const navigate = useNavigate();
  const { summary, settings } = useSellerData();
  const [value, setValue] = useState('');
  const [condition, setCondition] = useState('new');
  const [error, setError] = useState('');
  const id = useId();
  const errId = useId();
  const hintId = useId();
  const looksLikeLink = /^(https?:|www\.|amazon\.)/i.test(value.trim());
  const site = MARKETPLACE[settings?.marketplace ?? 'US'];

  function submit(e) {
    e.preventDefault();
    const read = readInput(value);
    if (read.error) { setError(read.error); return; }
    navigate(SELLER_ROUTES.NEW_LISTING, { state: { raw: value, condition } });
  }

  const short = summary && summary.balance < LISTING;

  return (
    <form className={`${s.card} ${hero ? s.cardHero : ''}`} onSubmit={submit} noValidate>
      <label htmlFor={id} className={`${s.label} ${hero ? s.labelHero : ''}`}>Make a listing</label>
      <div className={s.inputWrap}>
        <span className={s.inputIcon}>{looksLikeLink ? <IconLink size={20} /> : <IconBarcode size={20} />}</span>
        <input
          id={id}
          className={`${s.input} ${hero ? s.inputHero : ''}`}
          type="text"
          inputMode={looksLikeLink ? 'url' : 'text'}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          placeholder="Barcode or product link"
          value={value}
          onChange={(e) => { setValue(e.target.value); if (error) setError(''); }}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={`${hintId}${error ? ` ${errId}` : ''}`}
          autoFocus={autoFocus}
        />
      </div>
      {error && <p id={errId} className={s.fieldError} role="alert"><IconAlert size={16} />{error}</p>}
      <p id={hintId} className={s.hint}>
        For {site.site}, in {site.lang}. <Link to={SELLER_ROUTES.PROFILE} className={s.inlineLink}>Change</Link>
      </p>

      <div className={s.after}>
        <SegmentedChoice
          label="Condition"
          options={CONDITIONS.map((c) => ({ id: c.id, label: c.label }))}
          value={condition}
          onChange={setCondition}
        />
        <p className={s.hint}>{CONDITION[condition].hint}.</p>
      </div>

      <div className={s.cardActions}>
        <button type="submit" className={`${s.button} ${s.primary} ${s.block}`}>
          Make listing, {LISTING} credits
        </button>
      </div>
      {short && !hero && <p className={s.hint}>Your balance is under {LISTING} credits. You can still check the product first; top up before it runs.</p>}
    </form>
  );
}

// ══════════════════════════════════════════════════════════════════
//  A field the seller can change before copying
//
//  Reads as a copy field; Edit turns the value into an input in
//  place. Save keeps the seller's version beside Remvo's, so "Put
//  back" restores what Remvo wrote. Esc cancels, Cmd/Ctrl+Enter saves.
// ══════════════════════════════════════════════════════════════════

export function EditableField({ label, value, original, onSave, multiline = false, mono = false, count = null, clamp = false, compact = false, inputMode, validate, lang, children }) {
  const { copy, copied } = useClipboard({ resetMs: 1600 });
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(!clamp);
  const fieldRef = useRef(null);
  const editRef = useRef(null);
  const inputId = useId();
  const errId = useId();
  const edited = String(value ?? '') !== String(original ?? '');

  useEffect(() => {
    if (editing) {
      const el = fieldRef.current;
      el?.focus();
      if (el && 'setSelectionRange' in el) el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);

  function start() { setDraft(String(value ?? '')); setError(''); setEditing(true); }
  function cancel() { setEditing(false); setError(''); requestAnimationFrame(() => editRef.current?.focus()); }

  async function save() {
    const next = multiline ? draft.replace(/\s+$/, '') : draft.trim();
    const problem = validate?.(next);
    if (problem) { setError(problem); return; }
    try {
      await onSave(next === String(original ?? '') ? null : next);
    } catch (err) {
      // The edit was not kept; say why, and leave the draft where it is.
      setError(err?.message || 'That did not save. Try again.');
      return;
    }
    setEditing(false);
    toast(`${label} saved`);
    requestAnimationFrame(() => editRef.current?.focus());
  }

  async function revert() {
    try {
      await onSave(null);
    } catch (err) {
      const message = err?.message || 'That did not save. Try again.';
      if (editing) setError(message); else toast(message);
      return;
    }
    setEditing(false);
    toast(`${label} put back`);
    requestAnimationFrame(() => editRef.current?.focus());
  }

  async function onCopy() {
    if (value == null || value === '') return;
    if (await copy(String(value))) toast(`${label} copied`);
  }

  const Tag = multiline ? 'textarea' : 'input';

  return (
    <div className={s.field}>
      <div className={s.fieldMain}>
        <p className={s.fieldLabel}>
          <span className={s.fieldLabelText}>
            {editing ? <label htmlFor={inputId}>{label}</label> : <span>{label}</span>}
            {compact && edited && !editing && <span className={s.editedMark}>Edited</span>}
          </span>
          {count !== null && <span className={s.fieldCount}>{typeof count === 'function' ? count(editing ? draft : value) : count}</span>}
        </p>

        {editing ? (
          <>
            <Tag
              ref={fieldRef}
              id={inputId}
              className={`${s.input} ${s.inputPlain} ${multiline ? s.textarea : ''} ${mono ? s.inputMono : ''}`}
              value={draft}
              onChange={(e) => { setDraft(e.target.value); if (error) setError(''); }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancel(); }
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !multiline)) { e.preventDefault(); save(); }
              }}
              inputMode={inputMode}
              rows={multiline ? 10 : undefined}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? errId : undefined}
              lang={lang}
              spellCheck={!mono}
            />
            {error && <p id={errId} className={s.fieldError} role="alert"><IconAlert size={16} />{error}</p>}
            <div className={s.editActions}>
              <button type="button" className={`${s.button} ${s.primary} ${s.compact}`} onClick={save}>Save</button>
              <button type="button" className={`${s.button} ${s.secondary} ${s.compact}`} onClick={cancel}>Cancel</button>
              {compact && edited && (
                <button type="button" className={s.fieldTool} onClick={revert}>Put back Remvo&apos;s</button>
              )}
            </div>
          </>
        ) : (
          <>
            {children ?? (
              <p className={`${s.fieldValue} ${mono ? s.fieldValueMono : ''} ${open ? '' : s.fieldClamp}`} lang={lang}>{value}</p>
            )}
            {clamp && !open && (
              <button type="button" className={s.fieldMore} onClick={() => setOpen(true)}>Show all</button>
            )}
            {!compact && <div className={s.fieldTools}>
              <button ref={editRef} type="button" className={s.fieldTool} onClick={start} aria-label={`Edit ${label.toLowerCase()}`}>
                <IconEdit size={16} /> Edit
              </button>
              {edited && (
                <>
                  <span className={s.editedMark}>Edited</span>
                  <button type="button" className={s.fieldTool} onClick={revert} aria-label={`Put back Remvo's ${label.toLowerCase()}`}>
                    Put back
                  </button>
                </>
              )}
            </div>}
          </>
        )}
      </div>
      {!editing && compact && (
        <button ref={editRef} type="button" className={s.copy} onClick={start} aria-label={`Edit ${label.toLowerCase()}`}>
          <IconEdit size={19} />
        </button>
      )}
      {!editing && (
        <button type="button" className={`${s.copy} ${copied ? s.copied : ''}`} onClick={onCopy} aria-label={`Copy ${label.toLowerCase()}`}>
          {copied ? <IconCheck size={20} /> : <IconCopy size={20} />}
        </button>
      )}
    </div>
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

