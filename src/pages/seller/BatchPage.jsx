import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { StatusPill } from '@components/ui/seller/parts';
import { IconChevronRight, IconDownload } from '@components/ui/seller/icons';
import { useToast } from '@components/ui/seller/Toast';
import { useSellerSession } from '@context/SellerSession';
import { useSellerData } from '@context/SellerData';
import { MARKETPLACE } from '@lib/market';
import { CONDITION } from '@lib/sellerData';
import { inputLabel, listingPrice, when } from '@lib/sellerFormat';
import { SELLER_ROUTES, listingPath } from '@utils/constants';
import s from '@styles/pages/seller/app.module.css';
import b from '@styles/pages/seller/bulk.module.css';

/* ──────────────────────────────────────────────────────────────────
 * A batch, /batches/:id
 *
 * While it runs: how far it has got, in numbers and a bar, and about
 * how long is left. The seller can leave; they are emailed when it is
 * done. The eBay file can be taken at any point with what is ready.
 *
 * Then: the eBay drafts file (Seller Hub, Reports, Uploads), the full
 * CSV, and every line, with the ones to check first: a barcode that
 * found several products, a required item specific left empty, or a
 * line that did not work and why.
 * ────────────────────────────────────────────────────────────────── */

const POLL_MS = 3000;
// One listing at a time per account, about 20 seconds each.
const SECONDS_EACH = 20;

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'check', label: 'To check' },
  { key: 'failed', label: 'Failed' },
];
const needsCheck = (l) => l.status === 'ready' && (l.picked || l.missing?.length);

function left(n) {
  const mins = Math.ceil((n * SECONDS_EACH) / 60);
  if (n === 0) return 'Finishing';
  if (mins <= 1) return 'About a minute left';
  if (mins < 60) return `About ${mins} minutes left`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `About ${h} ${h === 1 ? 'hour' : 'hours'}${m ? ` ${m} minutes` : ''} left`;
}

export function BatchPage() {
  const { id } = useParams();
  const toast = useToast();
  const { account } = useSellerSession();
  const { fetchBatch, batchFile, refreshAll } = useSellerData();
  const [batch, setBatch] = useState(null);
  const [missing, setMissing] = useState(false);
  const [filter, setFilter] = useState('all');
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

  const shown = useMemo(() => {
    const lines = batch?.lines ?? [];
    if (filter === 'check') return lines.filter(needsCheck);
    if (filter === 'failed') return lines.filter((l) => l.status === 'failed');
    return lines;
  }, [batch, filter]);

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
            ) : <p className={s.emptyText}>Opening the batch</p>}
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
  const pct = (n) => `${batch.total ? (n / batch.total) * 100 : 0}%`;
  const title = running
    ? `Making ${batch.total} ${batch.total === 1 ? 'listing' : 'listings'}`
    : `${c.ready} ${c.ready === 1 ? 'listing' : 'listings'} ready`;

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
        <div className={s.section}>
          <div className={b.progress} aria-live="polite">
            <div className={b.progressHead}>
              <span className={b.progressFigure}>
                {done} <span className={b.progressOf}>of {batch.total}</span>
              </span>
              <span className={b.progressLeft}>{running ? left(waiting) : `Finished ${when(batch.finishedAt)}`}</span>
            </div>
            <div className={b.bar} role="progressbar" aria-label="Listings made" aria-valuemin={0} aria-valuemax={batch.total} aria-valuenow={done}>
              <span className={b.barReady} style={{ width: pct(c.ready) }} />
              <span className={b.barFailed} style={{ width: pct(c.failed) }} />
            </div>
            <p className={b.legend}>
              <span><span className={`${b.dot} ${b.dotReady}`} />{c.ready} ready</span>
              {c.failed > 0 && <span><span className={`${b.dot} ${b.dotFailed}`} />{c.failed} did not work, credits back</span>}
              {waiting > 0 && <span><span className={`${b.dot} ${b.dotWaiting}`} />{waiting} waiting</span>}
            </p>
          </div>
          {running && (
            <p className={s.groupNote}>
              You can leave this screen. We will email {account?.email ?? 'you'} when it is done. A listing you make on its own goes ahead of the batch.
            </p>
          )}
        </div>

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
                <IconDownload size={20} /> {saving === 'ebay' ? 'Preparing' : `Download for ${site.site}`}
              </button>
              <button type="button" className={`${s.button} ${s.secondary} ${s.block}`} disabled={!batch.lines?.length || saving === 'csv'} onClick={() => save('csv')}>
                <IconDownload size={20} /> {saving === 'csv' ? 'Preparing' : 'Download everything as CSV'}
              </button>
            </div>
          </div>
          <p className={s.groupNote}>The CSV has every field, the item specifics as columns, and why any line did not work.</p>
        </section>

        <section className={s.section} aria-labelledby="lines">
          <div className={s.groupHead}><h2 id="lines" className={s.groupTitle}>Lines</h2></div>
          <div className={s.segmented} role="group" aria-label="Show">
            {FILTERS.map((f) => (
              <button key={f.key} type="button" className={s.segment} aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
                {f.label}{f.key === 'check' && toCheck ? ` (${toCheck})` : ''}{f.key === 'failed' && c.failed ? ` (${c.failed})` : ''}
              </button>
            ))}
          </div>
          <div className={s.section}>
            {shown.length ? (
              <div className={s.group}>
                {shown.map((l) => <Line key={l.id} line={l} />)}
              </div>
            ) : (
              <p className={s.groupNote}>{filter === 'check' ? 'Nothing to check.' : 'Nothing here.'}</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function Line({ line }) {
  const title = line.title ?? line.product ?? inputLabel(line.input);
  const finished = line.status === 'ready' || line.status === 'failed';
  const body = (
    <>
      <span className={s.rowMain}>
        <span className={`${s.rowTitle} ${s.rowTitleClamp}`}>{title}</span>
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
    ? <Link to={listingPath(line.id)} className={s.row}>{body}</Link>
    : <div className={s.row}>{body}</div>;
}
