import { useEffect, useId, useState } from 'react';
import { Sheet } from '@components/ui/seller/Sheet';
import { IconAlert, IconEye, IconEyeOff } from '@components/ui/seller/icons';
import { useSellerSession } from '@context/SellerSession';
import { sellerApi } from '@lib/sellerApi';
import s from '@styles/pages/seller/app.module.css';

/* ──────────────────────────────────────────────────────────────────
 * Account sheets: a password, a name.
 *
 *   PasswordSheet  set a first password (an account without one),
 *                  or change it (needs the current one).
 *                  Every other device is signed out.
 *   NameSheet      what Remvo calls the seller. Optional; blank clears.
 *
 * Both update the signed-in account in place on success.
 * ────────────────────────────────────────────────────────────────── */

const MIN = 10;

function Reveal({ id, value, onChange, autoComplete, label, describedBy, invalid, autoFocus }) {
  const [shown, setShown] = useState(false);
  return (
    <div className={s.formField}>
      <label htmlFor={id} className={s.label}>{label}</label>
      <div className={s.inputWrap}>
        <input
          id={id}
          className={`${s.input} ${s.inputPlain} ${s.inputReveal}`}
          type={shown ? 'text' : 'password'}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          value={value}
          onChange={onChange}
          aria-describedby={describedBy}
          aria-invalid={invalid ? 'true' : undefined}
          data-autofocus={autoFocus ? '' : undefined}
        />
        <button type="button" className={s.revealButton} onClick={() => setShown((v) => !v)} aria-label="Show password" aria-pressed={shown} aria-controls={id}>
          {shown ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
    </div>
  );
}

export function PasswordSheet({ open, onClose, onSaved }) {
  const { account, signedIn } = useSellerSession();
  const has = Boolean(account?.hasPassword);
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ids = { current: useId(), pw: useId(), hint: useId(), err: useId() };

  useEffect(() => { if (open) { setCurrent(''); setPassword(''); setError(''); } }, [open]);

  async function save(e) {
    e.preventDefault();
    if (busy) return;
    if (has && !current) { setError('Enter your current password.'); return; }
    if ([...password].length < MIN) { setError(`Use at least ${MIN} characters. A short sentence works well.`); return; }
    setBusy(true); setError('');
    try {
      const { account: updated } = await sellerApi.setPassword(has ? { current, password } : { password });
      signedIn(updated);
      onSaved?.(has ? 'Password changed' : 'Password saved');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const n = [...password].length;
  const hint = !n ? `At least ${MIN} characters. A short sentence works well.` : n < MIN ? `${MIN - n} more to go.` : 'Long enough.';

  return (
    <Sheet open={open} onClose={onClose} title={has ? 'Change password' : 'Set a password'}>
      <form onSubmit={save} noValidate>
        {!has && <p className={`${s.small} ${s.sheetLead}`}>Your browser can save it and sign you in next time, on any device.</p>}
        <input type="email" name="email" autoComplete="username" value={account?.email ?? ''} readOnly hidden />
        {has && (
          <Reveal id={ids.current} label="Current password" value={current} autoComplete="current-password" autoFocus
            onChange={(e) => { setCurrent(e.target.value); setError(''); }} />
        )}
        <div className={has ? s.after : undefined}>
          <Reveal id={ids.pw} label={has ? 'New password' : 'Password'} value={password} autoComplete="new-password" autoFocus={!has}
            describedBy={[ids.hint, error ? ids.err : null].filter(Boolean).join(' ')} invalid={Boolean(error)}
            onChange={(e) => { setPassword(e.target.value); setError(''); }} />
        </div>
        <p id={ids.hint} className={s.small} aria-live="polite">{hint}</p>
        {error && <p id={ids.err} className={s.fieldError} role="alert"><IconAlert size={16} />{error}</p>}
        <button type="submit" className={`${s.button} ${s.primary} ${s.block} ${s.after}`} disabled={busy}>
          {busy ? 'Saving…' : 'Save password'}
        </button>
        <p className={`${s.small} ${s.after}`}>Every other device you are signed in on is signed out.</p>
      </form>
    </Sheet>
  );
}

export function NameSheet({ open, onClose, onSaved }) {
  const { account, signedIn } = useSellerSession();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const id = useId();
  const errId = useId();

  useEffect(() => { if (open) { setName(account?.name ?? ''); setError(''); } }, [open, account?.name]);

  async function save(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const { account: updated } = await sellerApi.setName(name);
      signedIn(updated);
      onSaved?.(updated.name ? `We will call you ${updated.name}` : 'Name cleared');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="What should we call you?">
      <form onSubmit={save} noValidate>
        <div className={s.formField}>
          <label htmlFor={id} className={s.label}>Name</label>
          <input
            id={id}
            className={`${s.input} ${s.inputPlain}`}
            type="text"
            autoComplete="given-name"
            maxLength={40}
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            aria-describedby={error ? errId : undefined}
            aria-invalid={error ? 'true' : undefined}
            data-autofocus=""
          />
        </div>
        <p className={s.small}>Your first name, or whatever you would like us to call you. Leave it blank for none.</p>
        {error && <p id={errId} className={s.fieldError} role="alert"><IconAlert size={16} />{error}</p>}
        <button type="submit" className={`${s.button} ${s.primary} ${s.block} ${s.after}`} disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </form>
    </Sheet>
  );
}
