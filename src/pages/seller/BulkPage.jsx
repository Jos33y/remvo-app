import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { SegmentedChoice, TopUpSheet } from '@components/ui/seller/parts';
import { IconAlert } from '@components/ui/seller/icons';
import { useSellerData } from '@context/SellerData';
import { MARKETPLACE } from '@lib/market';
import { CONDITIONS, CONDITION } from '@lib/sellerData';
import { SELLER_ROUTES, batchPath } from '@utils/constants';
import s from '@styles/pages/seller/app.module.css';
import b from '@styles/pages/seller/bulk.module.css';

/* ──────────────────────────────────────────────────────────────────
 * Bulk listing, /listings/bulk
 *
 * For a seller with a stack to list: paste a column of barcodes or
 * Amazon links, or upload the CSV their spreadsheet saves. Check reads
 * every line for free and says plainly which will run, which repeat
 * an earlier line, and which need a look, and what it will cost.
 * Start takes the credits and opens the batch, which runs on its own;
 * the seller can leave and is emailed when it is done.
 *
 * Nothing is spent until Start. Changing the text or the condition
 * after a check clears it, so what starts is always what was checked.
 * ────────────────────────────────────────────────────────────────── */

const MAX_FILE = 2 * 1024 * 1024;
const PROBLEMS_SHOWN = 12;

export function BulkPage() {
  const navigate = useNavigate();
  const { settings, summary, listingCredits: EACH, checkBatch, startBatch } = useSellerData();
  const site = MARKETPLACE[settings?.marketplace ?? 'US'];
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState(null);
  const [condition, setCondition] = useState('new');
  const [checked, setChecked] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const [topUp, setTopUp] = useState(false);
  const fileRef = useRef(null);
  const boxId = useId();
  const hintId = useId();
  const errId = useId();

  useEffect(() => { document.title = 'Remvo | Bulk listing'; }, []);

  const changed = (fn) => (v) => { fn(v); setChecked(null); setError(''); };

  async function readFile(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX_FILE) { setError('That file is over 2 MB. Save just the barcode column as a CSV and try again.'); return; }
    if (/\.(xlsx?|numbers|ods)$/i.test(f.name)) { setError('That is a spreadsheet file. In your spreadsheet, choose File, then Save as or Download, then CSV, and upload that.'); return; }
    const body = await f.text();
    setText(body);
    setFileName(f.name);
    setChecked(null);
    setError('');
  }

  async function check(e) {
    e?.preventDefault();
    if (!text.trim()) { setError('Paste barcodes or Amazon links, one a line, or upload a CSV.'); return; }
    setBusy('check');
    setError('');
    try {
      setChecked(await checkBatch({ text, condition }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function start(limit = null) {
    setBusy('start');
    setError('');
    try {
      const batch = await startBatch({ text, condition, ...(limit ? { limit } : {}) });
      navigate(batchPath(batch.id), { replace: true });
    } catch (err) {
      // Not enough credits, or a batch already running: the API's words say which.
      setBusy(null);
      setError(err.message);
    }
  }

  const balance = checked?.balance ?? summary?.balance ?? 0;
  const canStart = checked ? Math.min(checked.ready, Math.floor(balance / EACH)) : 0;
  const short = checked && checked.ready > 0 && balance < checked.credits;

  return (
    <>
      <PageHeader title="Bulk listing" back={SELLER_ROUTES.LISTINGS} backLabel="Listings">
        <p className={s.jobMeta}>
          <span>For {site.site}, in {site.lang}.</span>
          <Link to={SELLER_ROUTES.PROFILE} className={s.inlineLink}>Change</Link>
        </p>
      </PageHeader>

      <div className={s.content}>
        <form className={s.section} onSubmit={check} noValidate>
          <div className={s.card}>
            <label htmlFor={boxId} className={s.label}>Barcodes or Amazon links, one a line</label>
            <textarea
              id={boxId}
              className={`${s.input} ${s.textarea} ${b.paste}`}
              value={text}
              onChange={(e) => { changed(setText)(e.target.value); setFileName(null); }}
              placeholder={'050036384407\n075020106933\nhttps://www.amazon.com/dp/B09GJVTRNZ'}
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              aria-describedby={`${hintId}${error ? ` ${errId}` : ''}`}
              aria-invalid={error && !checked ? 'true' : undefined}
            />
            <div className={b.tools}>
              <button type="button" className={`${s.button} ${s.secondary}`} onClick={() => fileRef.current?.click()}>
                Upload a CSV
              </button>
              <input ref={fileRef} className={b.file} type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" onChange={readFile} tabIndex={-1} aria-hidden="true" />
              {fileName && <span className={b.fileName}>{fileName}</span>}
            </div>
            <p id={hintId} className={s.hint}>
              Up to 500 at a time. From a spreadsheet, copy the barcode column and paste it, or save the sheet as a CSV and upload it.
              A column named Condition is used when there is one.
            </p>

            <div className={s.after}>
              <SegmentedChoice
                label="Condition"
                options={CONDITIONS.map((c) => ({ id: c.id, label: c.label }))}
                value={condition}
                onChange={changed(setCondition)}
              />
              <p className={s.hint}>{CONDITION[condition].hint}. For every line without its own.</p>
            </div>

            {error && <p id={errId} className={s.fieldError} role="alert"><IconAlert size={16} />{error}</p>}

            {!checked && (
              <div className={s.cardActions}>
                <button type="submit" className={`${s.button} ${s.primary} ${s.block}`} disabled={busy === 'check'}>
                  {busy === 'check' ? 'Checking every line' : 'Check, free'}
                </button>
              </div>
            )}
          </div>
        </form>

        {checked && (
          <Verdict
            checked={checked}
            each={EACH}
            balance={balance}
            short={short}
            canStart={canStart}
            busy={busy}
            onStart={start}
            onTopUp={() => setTopUp(true)}
          />
        )}
      </div>

      <TopUpSheet open={topUp} onClose={() => { setTopUp(false); setChecked(null); }} />
    </>
  );
}

function Verdict({ checked, each, balance, short, canStart, busy, onStart, onTopUp }) {
  const problems = checked.problems ?? [];
  const n = checked.ready;
  return (
    <section className={s.section} aria-labelledby="verdict" aria-live="polite">
      <h2 id="verdict" className="sr-only">What will run</h2>
      <div className={b.tally}>
        <div className={b.tallyCell}>
          <span className={`${b.tallyNumber} ${b.tallyGood}`}>{n}</span>
          <span className={b.tallyLabel}>ready to make</span>
        </div>
        <div className={b.tallyCell}>
          <span className={b.tallyNumber}>{checked.duplicates}</span>
          <span className={b.tallyLabel}>repeat an earlier line, left out</span>
        </div>
        <div className={b.tallyCell}>
          <span className={`${b.tallyNumber} ${problems.length ? b.tallyWarn : ''}`}>{problems.length}</span>
          <span className={b.tallyLabel}>{problems.length === 1 ? 'needs a look' : 'need a look'}</span>
        </div>
      </div>

      {checked.tooMany && (
        <p className={`${s.notice} ${s.section}`}>Only the first {checked.maxRows} lines are read. Start these, then the rest as a second batch.</p>
      )}
      {checked.fixed?.length > 0 && (
        <p className={s.groupNote}>
          {checked.fixed.length === 1 ? 'One barcode had' : `${checked.fixed.length} barcodes had`} lost the 0 a spreadsheet drops from the front; it is put back.
        </p>
      )}

      {problems.length > 0 && (
        <div className={s.section}>
          <div className={s.groupHead}><h3 className={s.groupTitle}>Need a look</h3></div>
          <ul className={`${s.group} ${b.problems}`}>
            {problems.slice(0, PROBLEMS_SHOWN).map((p) => (
              <li key={p.line} className={b.problem}>
                <span className={b.problemLine}>Line {p.line}</span>
                <span className={b.problemRaw}>{p.raw || 'Empty'}</span>
                <span className={b.problemWhy}>{p.reason}</span>
              </li>
            ))}
          </ul>
          <p className={s.groupNote}>
            {problems.length > PROBLEMS_SHOWN ? `And ${problems.length - PROBLEMS_SHOWN} more. ` : ''}
            These are left out. Fix them in the box above and check again, or start without them.
          </p>
        </div>
      )}

      {n > 0 ? (
        <div className={s.section}>
          <div className={b.cost}>
            <span>{n} {n === 1 ? 'listing' : 'listings'}, {each} credits each</span>
            <span className={b.costFigure}>{n * each} credits</span>
          </div>
          <p className={s.groupNote}>
            You have {balance} credits. A line that does not work gives its credits back. Where a barcode finds more than one
            product, the product on its own is taken over bundles, and the line is marked for you to check.
          </p>
          <div className={`${b.buttons} ${s.section}`}>
            {!short ? (
              <button type="button" className={`${s.button} ${s.primary} ${s.block}`} disabled={busy === 'start'} onClick={() => onStart()}>
                {busy === 'start' ? 'Starting' : `Start ${n} ${n === 1 ? 'listing' : 'listings'}, ${n * each} credits`}
              </button>
            ) : (
              <>
                <button type="button" className={`${s.button} ${s.primary} ${s.block}`} onClick={onTopUp}>Top up to make all {n}</button>
                {canStart > 0 && (
                  <button type="button" className={`${s.button} ${s.secondary} ${s.block}`} disabled={busy === 'start'} onClick={() => onStart(canStart)}>
                    {busy === 'start' ? 'Starting' : `Start the first ${canStart}, ${canStart * each} credits`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <p className={`${s.notice} ${s.section}`}>None of these lines can be made yet. Fix them above and check again.</p>
      )}
    </section>
  );
}
