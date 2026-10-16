import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { SegmentedChoice, TopUpSheet } from '@components/ui/seller/parts';
import { IconAlert } from '@components/ui/seller/icons';
import { useSellerData } from '@context/SellerData';
import { MARKETPLACE } from '@lib/market';
import { count, num, plural } from '@lib/plural';
import { CONDITIONS, CONDITION } from '@lib/sellerData';
import { SELLER_ROUTES, batchPath } from '@utils/constants';
import s from '@styles/pages/seller/app.module.css';
import b from '@styles/pages/seller/bulk.module.css';

/* ──────────────────────────────────────────────────────────────────
 * Bulk listing, /listings/bulk
 *
 * Bulk's own room, in plum: a numbered sheet to paste products on, one
 * a line (barcodes or product links), or a CSV from a spreadsheet. The
 * numbers in the margin count lines the way the check does (blank lines
 * are skipped), so "Line 9" in the verdict is the 9 in the margin, and
 * a tap on it puts the cursor on that line.
 *
 * Check reads every line for free and says plainly which will run,
 * which repeat an earlier line, which need a look, and what it costs.
 * Start takes the credits and opens the batch, which runs on its own.
 *
 * Nothing is spent until Start. Changing the text or the condition
 * after a check clears it, so what starts is always what was checked.
 * On a laptop the sheet is on the left and the verdict on the right.
 * ────────────────────────────────────────────────────────────────── */

const MAX_FILE = 2 * 1024 * 1024;
const MAX_ROWS = 500;
const PROBLEMS_SHOWN = 12;
// The margin stops numbering here: past it the box is far beyond what is read.
const MARGIN_MAX = 2000;

/** For each line of the box, its number as the check counts it (blank lines get none). */
function numberLines(text) {
  const out = [];
  let n = 0;
  for (const l of text.split('\n')) {
    if (out.length >= MARGIN_MAX) break;
    if (l.trim()) { n += 1; out.push(n); } else out.push(null);
  }
  return { numbers: out, filled: text.split('\n').filter((l) => l.trim()).length };
}

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
  const [scroll, setScroll] = useState(0);
  const fileRef = useRef(null);
  const boxRef = useRef(null);
  const boxId = useId();
  const hintId = useId();
  const errId = useId();

  useEffect(() => { document.title = 'Remvo | Bulk listing'; }, []);

  const { numbers, filled } = useMemo(() => numberLines(text), [text]);
  const flagged = useMemo(() => new Set((checked?.problems ?? []).map((p) => p.line)), [checked]);

  const changed = (fn) => (v) => { fn(v); setChecked(null); setError(''); };

  async function readFile(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX_FILE) { setError('That file is over 2 MB. Save just the barcode or link column as a CSV and try again.'); return; }
    if (/\.(xlsx?|numbers|ods)$/i.test(f.name)) { setError('That is a spreadsheet file. In your spreadsheet, choose File, then Save as or Download, then CSV, and upload that.'); return; }
    const body = await f.text();
    setText(body.replace(/\r\n?/g, '\n'));
    setFileName(f.name);
    setChecked(null);
    setError('');
  }

  async function check(e) {
    e?.preventDefault();
    if (!text.trim()) { setError('Paste your products, one a line, or upload a CSV.'); boxRef.current?.focus(); return; }
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

  /* Put the cursor on line n (as the check counts) and bring it into view. */
  function goToLine(n) {
    const box = boxRef.current;
    if (!box) return;
    const rows = text.split('\n');
    let seen = 0;
    let at = 0;
    for (let i = 0; i < rows.length; i += 1) {
      if (rows[i].trim()) seen += 1;
      if (seen === n) {
        box.focus();
        box.setSelectionRange(at, at + rows[i].length);
        const lh = parseFloat(getComputedStyle(box).lineHeight) || 22;
        box.scrollTop = Math.max(0, i * lh - box.clientHeight / 3);
        setScroll(box.scrollTop);
        return;
      }
      at += rows[i].length + 1;
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
        <form className={`${b.room} ${s.section}`} onSubmit={check} noValidate>
          <div className={b.sheetSide}>
            <div className={b.paper}>
              <label htmlFor={boxId} className={b.paperLabel}>Paste your products, one a line</label>
              <p id={hintId} className={b.paperHint}>Barcodes or product links. Up to {MAX_ROWS} at a time.</p>
              <div className={b.lined}>
                <div className={b.margin} aria-hidden="true">
                  <div className={b.marginInner} style={{ transform: `translateY(${-scroll}px)` }}>
                    {(text ? numbers : [1]).map((n, i) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <span key={i} className={n && flagged.has(n) ? b.marginFlag : undefined}>{n ?? ''}</span>
                    ))}
                  </div>
                </div>
                <textarea
                  ref={boxRef}
                  id={boxId}
                  className={b.paste}
                  value={text}
                  wrap="off"
                  onChange={(e) => { changed(setText)(e.target.value); setFileName(null); }}
                  onScroll={(e) => setScroll(e.currentTarget.scrollTop)}
                  placeholder={'050036384407\n075020106933\nhttps://www.amazon.com/dp/B09GJVTRNZ'}
                  spellCheck={false}
                  autoCapitalize="none"
                  autoCorrect="off"
                  aria-describedby={`${hintId}${error ? ` ${errId}` : ''}`}
                  aria-invalid={error && !checked ? 'true' : undefined}
                />
              </div>
              <div className={b.paperFoot}>
                <span className={`${b.lineCount} ${filled > MAX_ROWS ? b.lineCountOver : ''}`} aria-live="polite">
                  {filled === 0 ? 'Nothing pasted yet' : filled > MAX_ROWS ? `${num(filled)} lines. The first ${MAX_ROWS} are read.` : count(filled, 'line')}
                </span>
                <span className={b.fileBits}>
                  {fileName && <span className={b.fileName} title={fileName}>{fileName}</span>}
                  <button type="button" className={b.fileButton} onClick={() => fileRef.current?.click()}>
                    {fileName ? 'Another CSV' : 'Upload a CSV'}
                  </button>
                  <input ref={fileRef} className={b.file} type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" onChange={readFile} tabIndex={-1} aria-hidden="true" />
                </span>
              </div>
            </div>
            <p className={b.spreadsheet}>
              From a spreadsheet: copy the column and paste it, or save the sheet as a CSV and upload it. A column named Condition is used when there is one.
            </p>

            <div className={b.condition}>
              <SegmentedChoice
                label="Condition"
                options={CONDITIONS.map((c) => ({ id: c.id, label: c.label }))}
                value={condition}
                onChange={changed(setCondition)}
              />
              <p className={s.hint}>{CONDITION[condition].hint}. For every line without its own.</p>
            </div>
          </div>

          <div className={b.verdictSide}>
            {error && <p id={errId} className={`${s.fieldError} ${b.error}`} role="alert"><IconAlert size={16} />{error}</p>}
            {checked ? (
              <Verdict
                checked={checked}
                each={EACH}
                balance={balance}
                short={short}
                canStart={canStart}
                busy={busy}
                onStart={start}
                onTopUp={() => setTopUp(true)}
                onLine={goToLine}
              />
            ) : (
              <div className={b.ready}>
                {filled > 0 ? (
                  <p className={b.readyFigure}>
                    <span className={b.serifNum}>{num(Math.min(filled, MAX_ROWS))}</span> {plural(Math.min(filled, MAX_ROWS), 'line')} to check
                  </p>
                ) : (
                  <p className={b.readyTitle}>Check first, free</p>
                )}
                <p className={b.readyText}>
                  The check reads every line, finds repeats and anything that is not a product, and tells you the cost. It is free: nothing is spent until you start.
                </p>
                <button type="submit" className={`${s.button} ${s.primary} ${s.block}`} disabled={busy === 'check'}>
                  {busy === 'check' ? 'Checking every line…' : 'Check, free'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>

      <TopUpSheet open={topUp} onClose={() => { setTopUp(false); setChecked(null); }} />
    </>
  );
}

function Verdict({ checked, each, balance, short, canStart, busy, onStart, onTopUp, onLine }) {
  const problems = checked.problems ?? [];
  const n = checked.ready;
  return (
    <section className={b.verdict} aria-labelledby="verdict" aria-live="polite">
      <h2 id="verdict" className={b.verdictFigure}>
        <span className={b.serifNum}>{num(n)}</span> ready to make
      </h2>
      <ul className={b.facts} role="list">
        <li><span className={b.factNum}>{num(checked.duplicates)}</span> {plural(checked.duplicates, 'repeat')} left out</li>
        <li className={problems.length ? b.factWarn : undefined}><span className={b.factNum}>{num(problems.length)}</span> {plural(problems.length, 'needs a look', 'need a look')}</li>
      </ul>

      {checked.tooMany && (
        <p className={`${s.notice} ${b.gap}`}>Only the first {checked.maxRows} lines are read. Start these, then the rest as a second batch.</p>
      )}
      {(checked.duplicates > 0 || checked.fixed?.length > 0) && (
        <p className={b.note}>
          {checked.duplicates > 0 && `${checked.duplicates === 1 ? 'One line repeats' : `${num(checked.duplicates)} lines repeat`} an earlier line, so nothing is listed twice. `}
          {checked.fixed?.length > 0 && `${checked.fixed.length === 1 ? 'One barcode had' : `${num(checked.fixed.length)} barcodes had`} lost the 0 a spreadsheet drops from the front; it is put back.`}
        </p>
      )}

      {problems.length > 0 && (
        <div className={b.gap}>
          <h3 className={b.problemsTitle}>Need a look</h3>
          <ul className={b.problems} role="list">
            {problems.slice(0, PROBLEMS_SHOWN).map((p) => (
              <li key={p.line}>
                <button type="button" className={b.problem} onClick={() => onLine(p.line)} aria-label={`Line ${p.line}: ${p.reason} Go to the line.`}>
                  <span className={b.problemLine}>{p.line}</span>
                  <span className={b.problemRaw}>{p.raw || 'Empty'}</span>
                  <span className={b.problemWhy}>{p.reason}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className={b.note}>
            {problems.length > PROBLEMS_SHOWN ? `And ${num(problems.length - PROBLEMS_SHOWN)} more. ` : ''}
            These are left out. Tap one to go to its line, fix it and check again, or start without them.
          </p>
        </div>
      )}

      {n > 0 ? (
        <div className={b.gap}>
          <div className={b.cost}>
            <span>{count(n, 'listing')} at {count(each, 'credit')}</span>
            <span className={b.costFigure}>{count(n * each, 'credit')}</span>
          </div>
          <p className={b.note}>
            You have {count(balance, 'credit')}. A line that does not work gives its credits back. Where a barcode finds more than one
            product, the product on its own is taken over bundles, and the line is marked for you to check.
          </p>
          <div className={b.buttons}>
            {!short ? (
              <button type="button" className={`${s.button} ${s.primary} ${s.block}`} disabled={busy === 'start'} onClick={() => onStart()}>
                {busy === 'start' ? 'Starting…' : `Start ${count(n, 'listing')}, ${count(n * each, 'credit')}`}
              </button>
            ) : (
              <>
                <button type="button" className={`${s.button} ${s.primary} ${s.block}`} onClick={onTopUp}>Top up to make all {num(n)}</button>
                {canStart > 0 && (
                  <button type="button" className={`${s.button} ${s.secondary} ${s.block}`} disabled={busy === 'start'} onClick={() => onStart(canStart)}>
                    {busy === 'start' ? 'Starting…' : `Start the first ${num(canStart)}, ${count(canStart * each, 'credit')}`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <p className={`${s.notice} ${b.gap}`}>None of these lines can be made yet. Fix them and check again.</p>
      )}
    </section>
  );
}
