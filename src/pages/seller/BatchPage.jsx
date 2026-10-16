import { memo, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { StatusPill } from '@components/ui/seller/parts';
import { IconChevronRight, IconDownload } from '@components/ui/seller/icons';
import { useToast } from '@components/ui/seller/Toast';
import { useSellerData } from '@context/SellerData';
import { Thumb } from '@pages/seller/SellerHomePage';
import { MARKETPLACE } from '@lib/market';
import { CONDITION } from '@lib/sellerData';
import { inputLabel, listingPrice, when } from '@lib/sellerFormat';
import { count, num } from '@lib/plural';
import { SELLER_ROUTES, listingPath } from '@utils/constants';
import { Breakable } from '@components/ui/seller/Breakable';
import s from '@styles/pages/seller/app.module.css';
import b from '@styles/pages/seller/bulk.module.css';

/* ──────────────────────────────────────────────────────────────────
 * A batch, /batches/:id
 *
 * The batch as a sheet of stamps on plum, one stamp per line, in the
 * order pasted: a made listing is a stamp (with its product's photo
 * when the batch is small enough to show one), a line that did not
 * work is an empty dashed stamp in oxide, the one being made glows
 * lapis, and the rest wait as faint outlines. The sheet fills as the
 * batch runs; the figure beside it says how far, and how long is left.
 *
 * Then the eBay file and how to use it, and the lines: 50 at a time,
 * with the ones to check first a tap away. Rows only redraw when their
 * own line changes, so a 500-line batch stays smooth while it polls.
 * ────────────────────────────────────────────────────────────────── */

const POLL_MS = 3000;
// One listing at a time per account, about 20 seconds each.
const SECONDS_EACH = 20;
const PAGE = 50;

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'check', label: 'To check' },
  { key: 'failed', label: 'Failed' },
];
const needsCheck = (l) => l.status === 'ready' && (l.picked || l.missing?.length);

function left(n) {
  const mins = Math.ceil((n * SECONDS_EACH) / 60);
  if (n === 0) return 'Finishing…';
  if (mins <= 1) return 'About a minute left';
  if (mins < 60) return `About ${mins} minutes left`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `About ${count(h, 'hour')}${m ? ` ${count(m, 'minute')}` : ''} left`;
}

/* How big the stamps are: big enough to show the product when there
 * are few, small enough that 500 still fit a phone's sheet. */
const sizeFor = (n) => (n <= 24 ? 'large' : n <= 120 ? 'medium' : 'small');

function stampsOf(batch) {
  if (batch.lines?.length) return batch.lines;
  // No lines sent: draw the sheet from the counts, in the order they run.
  const c = batch.counts;
  const out = [];
  const push = (status, n) => { for (let i = 0; i < n; i += 1) out.push({ id: `${status}${i}`, status }); };
  push('ready', c.ready); push('failed', c.failed); push('running', c.running); push('queued', c.queued);
  return out;
}

/* The sheet only redraws when a stamp changes. */
const Sheet = memo(function Sheet({ stamps, size }) {
  return (
    <div className={`${b.sheet} ${b[`sheet_${size}`]}`} aria-hidden="true">
      {stamps.map((l) => {
        const photo = size !== 'small' && l.status === 'ready' ? l.image : null;
        const flag = l.status === 'ready' && needsCheck(l);
        return (
          <span key={l.id} className={`${b.stamp} ${b[`stamp_${l.status}`] ?? b.stamp_queued} ${flag && size !== 'small' ? b.stampFlag : ''}`}>
            {size !== 'small' && l.status === 'ready' && (
              <span className={b.stampFace}>{photo ? <StampPhoto src={photo} /> : null}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}, (a, z) => a.size === z.size && a.sig === z.sig);

function StampPhoto({ src }) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  return <img src={src} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} />;
}

export function BatchPage() {
  const { id } = useParams();
  const toast = useToast();
  const { fetchBatch, batchFile, refreshAll } = useSellerData();
  const [batch, setBatch] = useState(null);
  const [missing, setMissing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [shownCount, setShownCount] = useState(PAGE);
  const [saving, setSaving] = useState(null);

  useEffect(() => { document.title = 'Remvo | Bulk listing'; }, []);

  // Read now, then every few seconds while it runs; once more when it finishes, for the balance.
  useEffect(() => {
    let live = true;
    let timer = null;
    const read = async () => {
      try {
        const next = await fetchBatch(id);
        if (!live) return;
        setBatch((prev) => {
          if (prev?.status === 'running' && next.status === 'done') refreshAll();
          return next;
        });
        if (next.status === 'running') timer = setTimeout(read, POLL_MS);
      } catch (err) {
        if (!live) return;
        if (err.status === 404) setMissing(true);
        else timer = setTimeout(read, POLL_MS * 2);
      }
    };
    read();
    return () => { live = false; clearTimeout(timer); };
  }, [id, fetchBatch, refreshAll]);

  const filtered = useMemo(() => {
    const lines = batch?.lines ?? [];
    if (filter === 'check') return lines.filter(needsCheck);
    if (filter === 'failed') return lines.filter((l) => l.status === 'failed');
    return lines;
  }, [batch, filter]);

  const stamps = useMemo(() => (batch ? stampsOf(batch) : []), [batch]);
  const sig = useMemo(() => stamps.map((l) => `${l.status[0]}${needsCheck(l) ? '!' : ''}${l.image ? '+' : ''}`).join(''), [stamps]);

  async function save(format) {
    setSaving(format);
    try {
      const blob = await batchFile(batch.id, format);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = format === 'ebay' ? `remvo-${batch.ref}-ebay-drafts-${batch.marketplace}.csv` : `remvo-${batch.ref}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (err) {
      toast(err.message);
    } finally {
      setSaving(null);
    }
  }

  if (!batch) {
    return (
      <>
        <PageHeader title="Bulk listing" back={SELLER_ROUTES.LISTINGS} backLabel="Listings" large={false} />
        <div className={s.content}>
          <div className={s.empty} aria-busy={!missing}>
            {missing ? (
              <>
                <p className={s.emptyTitle}>This batch is not here</p>
                <p className={s.emptyText}>Batches go with their listings after 90 days.</p>
              </>
            ) : <p className={s.emptyText}>Opening the batch…</p>}
          </div>
        </div>
      </>
    );
  }

  const c = batch.counts;
  const done = c.ready + c.failed;
  const waiting = c.queued + c.running;
  const running = batch.status === 'running';
  const site = MARKETPLACE[batch.marketplace] ?? MARKETPLACE.US;
  const toCheck = (batch.lines ?? []).filter(needsCheck).length;
  const size = sizeFor(stamps.length);
  const title = running
    ? `Making ${count(batch.total, 'listing')}`
    : `${count(c.ready, 'listing')} ready`;
  const visible = filtered.slice(0, shownCount);
  const more = filtered.length - visible.length;

  return (
    <>
      <PageHeader title={title} back={SELLER_ROUTES.LISTINGS} backLabel="Listings">
        <p className={s.jobMeta}>
          <span className={s.mono}>{batch.ref}</span>
          <span>{site.site}</span>
          <span>{CONDITION[batch.condition]?.label}</span>
          <span>{when(batch.createdAt)}</span>
        </p>
      </PageHeader>

      <div className={s.content}>
        <section className={`${b.sheetCard} ${s.section}`} aria-label="Progress">
          <div className={b.sheetHead}>
            <p className={b.sheetFigure}>
              <span className={b.serifNum}>{num(done)}</span> <span className={b.sheetOf}>of {num(batch.total)} {running ? 'done' : 'made'}</span>
            </p>
            <p className={b.sheetLeft}>{running ? left(waiting) : `Finished ${when(batch.finishedAt)}`}</p>
          </div>
          <div role="progressbar" aria-label="Listings made" aria-valuemin={0} aria-valuemax={batch.total} aria-valuenow={done} aria-valuetext={`${num(done)} of ${num(batch.total)}`}>
            <Sheet stamps={stamps} size={size} sig={sig} />
          </div>
          <p className={b.legend}>
            <span><span className={`${b.key} ${b.key_ready}`} />{num(c.ready)} ready</span>
            {c.failed > 0 && <span><span className={`${b.key} ${b.key_failed}`} />{num(c.failed)} did not work, credits back</span>}
            {waiting > 0 && <span><span className={`${b.key} ${b.key_queued}`} />{num(waiting)} waiting</span>}
          </p>
          {running && (
            <p className={b.sheetNote}>
              You can leave this screen; we will email you when it is done. A listing you make on its own goes ahead of the batch.
            </p>
          )}
        </section>

        <div className={b.batchCols}>
          <section className={s.section} aria-labelledby="files">
            <div className={s.groupHead}><h2 id="files" className={s.groupTitle}>Put them on eBay</h2></div>
            <div className={s.card}>
              <ol className={b.howTo}>
                <li>Download the eBay file{running && c.ready ? ' (it has the ones ready so far)' : ''}.</li>
                <li>In Seller Hub, open Reports, then Uploads, and upload it. Each listing becomes a draft.</li>
                <li>In your drafts, add your photos, copy the item specifics across from Remvo, and publish. eBay keeps drafts for about 30 days.</li>
              </ol>
              <div className={`${b.buttons} ${s.cardActions}`}>
                <button type="button" className={`${s.button} ${s.primary} ${s.block}`} disabled={!c.ready || saving === 'ebay'} onClick={() => save('ebay')}>
                  <IconDownload size={20} /> {saving === 'ebay' ? 'Preparing…' : `Download for ${site.site}`}
                </button>
                <button type="button" className={`${s.button} ${s.secondary} ${s.block}`} disabled={!batch.lines?.length || saving === 'csv'} onClick={() => save('csv')}>
                  <IconDownload size={20} /> {saving === 'csv' ? 'Preparing…' : 'Download everything as CSV'}
                </button>
              </div>
            </div>
            <p className={s.groupNote}>The CSV has every field, the item specifics as columns, and why any line did not work.</p>
          </section>

          <section className={s.section} aria-labelledby="lines">
            <div className={s.groupHead}><h2 id="lines" className={s.groupTitle}>Lines</h2></div>
            <div className={s.segmented} role="group" aria-label="Show">
              {FILTERS.map((f) => (
                <button key={f.key} type="button" className={s.segment} aria-pressed={filter === f.key} onClick={() => { setFilter(f.key); setShownCount(PAGE); }}>
                  {f.label}{f.key === 'check' && toCheck ? ` (${num(toCheck)})` : ''}{f.key === 'failed' && c.failed ? ` (${num(c.failed)})` : ''}
                </button>
              ))}
            </div>
            <div className={s.section}>
              {visible.length ? (
                <div className={s.group}>
                  {visible.map((l) => <Line key={l.id} line={l} />)}
                </div>
              ) : (
                <p className={s.groupNote}>{filter === 'check' ? 'Nothing to check.' : 'Nothing here.'}</p>
              )}
              {more > 0 && (
                <button type="button" className={`${s.button} ${s.secondary} ${s.block} ${b.more}`} onClick={() => setShownCount((n) => n + PAGE)}>
                  Show {num(Math.min(PAGE, more))} more, {num(more)} left
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/* A row redraws only when its own line changes. */
const Line = memo(function Line({ line }) {
  const title = line.title ?? line.product ?? inputLabel(line.input);
  const finished = line.status === 'ready' || line.status === 'failed';
  const body = (
    <>
      <Thumb src={line.image} />
      <span className={s.rowMain}>
        <span className={`${s.rowTitle} ${s.rowTitleClamp}`}><Breakable text={title} /></span>
        <span className={s.rowSub}>
          <StatusPill status={line.status} />
          <span className={b.lineRef}>{line.ref}</span>
          {line.price?.value != null && <span>{listingPrice(line.price.value, line.price.currency)}</span>}
          {line.picked && <span className={b.check}>Check: 1 of {line.picked.of} products</span>}
          {!line.picked && line.missing?.length > 0 && <span className={b.check}>Check: {line.missing.length} to fill in</span>}
        </span>
        {line.failure && <span className={s.rowSub}>{line.failure}</span>}
      </span>
      {finished && <span className={s.chevron}><IconChevronRight /></span>}
    </>
  );
  return finished
    ? <Link to={listingPath(line.id)} className={`${s.row} ${b.lineRow}`}>{body}</Link>
    : <div className={`${s.row} ${b.lineRow}`}>{body}</div>;
}, (a, z) => {
  const x = a.line; const y = z.line;
  return x.id === y.id && x.status === y.status && x.title === y.title && x.product === y.product && x.image === y.image
    && x.price?.value === y.price?.value && x.failure === y.failure && Boolean(x.picked) === Boolean(y.picked) && (x.missing?.length ?? 0) === (y.missing?.length ?? 0);
});
