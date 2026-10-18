import { useEffect, useId, useState } from 'react';
import { useLocation } from 'react-router';
import { IconCheck } from '@components/ui/seller/icons';
import { sellerApi } from '@lib/sellerApi';
import s from '@styles/pages/seller/app.module.css';
import A from '@styles/ui/seller/ask-next.module.css';

/* ──────────────────────────────────────────────────────────────────
 * AskNext (ask1): "What would you use next?"
 *
 * Under a finished listing and a finished batch, once per seller. Pick
 * any of the jobs sellers pay other tools for, or say something else
 * in their own words; it goes straight to Joseph, and the counts decide
 * what is built next. "Not now" puts it away for 30 days on this
 * device. Once answered it is not asked again.
 * ────────────────────────────────────────────────────────────────── */

export const CHOICES = [
  ['facebook', 'A Facebook Marketplace version of each listing'],
  ['vinted', 'Vinted or Depop versions'],
  ['scan', 'Scan barcodes with my phone camera'],
  ['publish', 'Send listings straight to eBay'],
  ['store', 'A check of my eBay store'],
  ['photos', 'Clean up my own product photos'],
  ['other', 'Something else'],
];

const LATER = 'remvo.askNext.later';
const DAYS_30 = 30 * 86_400_000;
const laterSet = () => { try { return Date.now() - Number(localStorage.getItem(LATER) ?? 0) < DAYS_30; } catch { return false; } };

// Read once per visit: every finished listing would otherwise ask the API again.
let known;

export function AskNext() {
  const { pathname } = useLocation();
  const [state, setState] = useState(() => (laterSet() ? 'hidden' : known === undefined ? 'loading' : known ? 'hidden' : 'ask'));
  const [picks, setPicks] = useState([]);
  const [other, setOther] = useState('');
  const [error, setError] = useState('');
  const ids = { title: useId(), other: useId(), error: useId() };

  useEffect(() => {
    if (state !== 'loading') return undefined;
    let live = true;
    sellerApi.asked()
      .then((r) => { known = Boolean(r?.asked); if (live) setState(known ? 'hidden' : 'ask'); })
      .catch(() => { if (live) setState('hidden'); });
    return () => { live = false; };
  }, [state]);

  if (state === 'hidden' || state === 'loading') return null;

  if (state === 'done') {
    return (
      <section className={`${s.section} ${A.done}`} aria-live="polite">
        <span className={A.doneMark} aria-hidden="true"><IconCheck size={18} /></span>
        <p className={A.doneText}>Thanks. That goes straight to Joseph, and the most asked-for gets built first.</p>
      </section>
    );
  }

  const toggle = (id) => setPicks((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  const wantsOther = picks.includes('other');

  async function send() {
    if (!picks.length || state === 'sending') return;
    if (wantsOther && !other.trim()) { setError('Say what you would use, or untick Something else.'); return; }
    setState('sending');
    setError('');
    try {
      await sellerApi.ask({ picks, ...(wantsOther ? { other: other.trim() } : {}), page: pathname });
      known = true;
      setState('done');
    } catch (err) {
      setError(err.message);
      setState('ask');
    }
  }

  function later() {
    try { localStorage.setItem(LATER, String(Date.now())); } catch { /* private mode: hidden for this visit */ }
    setState('hidden');
  }

  return (
    <section className={`${s.section} ${A.ask}`} aria-labelledby={ids.title}>
      <h2 id={ids.title} className={A.title}>What would you use next?</h2>
      <p className={A.sub}>Pick any. We build what sellers ask for most.</p>
      <div className={A.choices} role="group" aria-labelledby={ids.title}>
        {CHOICES.map(([id, label]) => (
          <button key={id} type="button" className={A.choice} aria-pressed={picks.includes(id)} onClick={() => toggle(id)}>
            {label}
          </button>
        ))}
      </div>
      {wantsOther && (
        <div className={A.otherWrap}>
          <label className="sr-only" htmlFor={ids.other}>What else would you use?</label>
          <input
            id={ids.other}
            className={`${s.input} ${s.inputPlain} ${A.otherInput}`}
            type="text"
            maxLength={200}
            placeholder="What else would you use?"
            value={other}
            onChange={(e) => { setOther(e.target.value); if (error) setError(''); }}
            aria-describedby={error ? ids.error : undefined}
            autoFocus
          />
        </div>
      )}
      {error && <p id={ids.error} className={A.error} role="alert">{error}</p>}
      <div className={A.actions}>
        <button type="button" className={`${s.button} ${s.primary}`} disabled={!picks.length || state === 'sending'} onClick={send}>
          {state === 'sending' ? 'Sending…' : 'Send'}
        </button>
        <button type="button" className={`${s.button} ${s.secondary}`} onClick={later}>Not now</button>
      </div>
    </section>
  );
}
