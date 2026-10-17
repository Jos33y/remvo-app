import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { NotHere } from '@components/ui/seller/NotHere';
import { useToast } from '@components/ui/seller/Toast';
import { StatusPill } from '@components/ui/seller/parts';
import { IconChevronRight, IconDownload } from '@components/ui/seller/icons';
import { Breakable } from '@components/ui/seller/Breakable';
import { Thumb } from '@pages/seller/SellerHomePage';
import { useSellerData } from '@context/SellerData';
import { sellerApi } from '@lib/sellerApi';
import { MARKETPLACE } from '@lib/market';
import { CONDITION, stepsFor } from '@lib/sellerData';
import { inputLabel, listingPrice, when } from '@lib/sellerFormat';
import { count } from '@lib/plural';
import { SELLER_ROUTES, listingPath } from '@utils/constants';
import s from '@styles/pages/seller/app.module.css';
import W from '@styles/pages/seller/world.module.css';

/* ──────────────────────────────────────────────────────────────────
 * One product on several eBay sites, /sites/:id (world1)
 *
 * While the listings are made, each site's progress. Then, once two
 * sites have a price, where it brings in most: each site's price less
 * that site's eBay fees, on the seller's own account settings, put into
 * the seller's currency at the European Central Bank's rate, best
 * first, as bars a seller reads at a glance. What the item costs the
 * seller for each site, and postage from where they post, are not
 * known here, and the page says so rather than guess (world2: the
 * order is of what each site brings in, not yet of profit).
 *
 * Each site's listing is an ordinary listing, a tap away, and all of
 * them come down as one CSV with a row a site.
 * ────────────────────────────────────────────────────────────────── */

const POLL_MS = 3000;
const MINUS = '−';

function longDay(iso) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
}

function SiteCode({ id, on = true }) {
  return <span className={`${W.code} ${on ? '' : W.codeOff}`} aria-hidden="true">{id}</span>;
}

export function WorldPage() {
  const { id } = useParams();
  const toast = useToast();
  const { refreshAll } = useSellerData();
  const [world, setWorld] = useState(null);
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { document.title = 'Remvo | eBay sites'; }, []);

  // Read now, then every few seconds while any site is being made.
  useEffect(() => {
    let live = true;
    let timer = null;
    let wasBusy = false;
    const read = async () => {
      try {
        const { world: next } = await sellerApi.world(id);
        if (!live) return;
        setWorld(next);
        const busy = next.jobs.some((j) => j.status === 'queued' || j.status === 'running');
        if (wasBusy && !busy) refreshAll?.();
        wasBusy = busy;
        if (busy) timer = setTimeout(read, POLL_MS);
      } catch (err) {
        if (!live) return;
        if (err.status === 404) setMissing(true);
        else timer = setTimeout(read, POLL_MS * 2);
      }
    };
    read();
    return () => { live = false; clearTimeout(timer); };
  }, [id, refreshAll]);

  async function save() {
    setSaving(true);
    try {
      const blob = await sellerApi.worldFile(world.id);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `remvo-${world.ref}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (err) {
      toast(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!world) {
    return (
      <>
        <PageHeader title="eBay sites" back={SELLER_ROUTES.LISTINGS} backLabel="Listings" large={false} />
        <div className={s.content}>
          {missing
            ? <NotHere title="These listings are not here" text="They may have been deleted, or passed their 90 days." />
            : <div className={s.empty} aria-busy="true"><p className={s.emptyText}>Opening the listings…</p></div>}
        </div>
      </>
    );
  }

  const jobs = world.jobs;
  const ready = jobs.filter((j) => j.status === 'ready').length;
  const failed = jobs.filter((j) => j.status === 'failed').length;
  const busy = jobs.some((j) => j.status === 'queued' || j.status === 'running');
  const lead = jobs.find((j) => j.product || j.image) ?? null;
  const c = world.compare;
  const title = busy ? `Listing on ${count(jobs.length, 'eBay site')}` : `Ready on ${count(ready, 'eBay site')}`;

  return (
    <>
      <PageHeader title={title} back={SELLER_ROUTES.LISTINGS} backLabel="Listings">
        <p className={s.jobMeta}>
          <span className={s.mono}>{world.ref}</span>
          <span className={s.mono}>{inputLabel(world.input)}</span>
          <span>{CONDITION[world.condition]?.label}</span>
          <span>{when(world.createdAt)}</span>
        </p>
      </PageHeader>

      <div className={s.content}>
        {lead?.product && (
          <div className={`${s.card} ${W.product}`}>
            <Thumb src={lead.image} />
            <p className={W.productTitle}><Breakable text={lead.product} /></p>
          </div>
        )}

        <div className={W.cols}>
          <section className={s.section} aria-labelledby="compare-heading">
            <div className={s.groupHead}><h2 id="compare-heading" className={s.groupTitle}>Where it brings in most</h2></div>
            <Compare world={world} busy={busy} />
          </section>

          <section className={s.section} aria-labelledby="sites-heading">
            <div className={s.groupHead}>
              <h2 id="sites-heading" className={s.groupTitle}>Each site</h2>
              <span className={W.headNote}>{world.credits} credits{failed ? `, ${count(failed, 'site')} given back` : ''}</span>
            </div>
            <div className={s.group} aria-live="polite">
              {jobs.map((j) => <SiteRow key={j.id} job={j} best={c?.best === j.id} />)}
            </div>
            <div className={s.section}>
              <button type="button" className={`${s.button} ${s.secondary} ${s.block}`} disabled={!ready || saving} onClick={save}>
                <IconDownload size={20} /> {saving ? 'Preparing…' : 'Download every site as CSV'}
              </button>
              <p className={s.groupNote}>One row a site, with every field and the item specifics as columns{busy ? '. It has the sites ready so far.' : '.'}</p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/* Each site's progress, then its listing a tap away. */
function SiteRow({ job, best }) {
  const site = MARKETPLACE[job.marketplace] ?? MARKETPLACE.US;
  const finished = job.status === 'ready' || job.status === 'failed';
  const body = (
    <>
      <SiteCode id={job.marketplace} on={job.status !== 'failed'} />
      <span className={s.rowMain}>
        <span className={`${s.rowTitle} ${s.rowTitleClamp}`} lang={site.langCode === 'en' ? undefined : site.langCode}>
          {job.title ?? site.site}
        </span>
        <span className={s.rowSub}>
          <StatusPill status={job.status} />
          {/* The site's name is the title until there is one: said once (world2). */}
          {job.title && <span>{site.site}</span>}
          {job.price?.value != null && <span className={s.mono}>{listingPrice(job.price.value, job.price.currency)}</span>}
          {job.status === 'ready' && job.price?.value == null && <span>No price to go by</span>}
          {job.status === 'running' && <span>{stepsFor(job.marketplace)[Math.max(0, job.step - 1)] ?? 'Starting'}</span>}
          {job.status === 'queued' && <span>Waiting its turn</span>}
          {best && <span className={W.bestTag}>Brings in most</span>}
        </span>
        {job.failure && <span className={s.rowSub}>{job.failure}</span>}
      </span>
      {finished && job.status === 'ready' && <span className={s.chevron}><IconChevronRight /></span>}
    </>
  );
  return job.status === 'ready'
    ? <Link to={listingPath(job.id)} className={s.row}>{body}</Link>
    : <div className={s.row}>{body}</div>;
}

/* Best first, as bars against the best: what each site's price leaves after its fees, in the seller's currency. */
function Compare({ world, busy }) {
  const c = world.compare;
  const priced = (c?.rows ?? []).filter((r) => r.proceeds != null);
  if (!c || priced.length < 2) {
    return (
      <div className={`${s.card} ${W.wait}`}>
        <p className={W.waitText}>
          {busy
            ? 'Each site is compared as soon as two of them have a price.'
            : 'Fewer than two sites have a price to go by, so there is nothing to compare. Open a listing to set its price.'}
        </p>
      </div>
    );
  }
  const top = Math.max(...priced.map((r) => (c.comparable ? r.inMine : r.proceeds) ?? 0), 0.01);
  return (
    <>
      <ol className={`${s.card} ${W.bars}`} aria-label="eBay sites, most first">
        {c.rows.map((r, i) => {
          const site = MARKETPLACE[r.marketplace] ?? MARKETPLACE.US;
          const value = c.comparable ? r.inMine : r.proceeds;
          const isBest = c.best === r.jobId;
          return (
            <li key={r.jobId} className={`${W.bar} ${isBest ? W.barBest : ''}`}>
              <div className={W.barHead}>
                <span className={W.rank} aria-hidden="true">{i + 1}</span>
                <SiteCode id={r.marketplace} />
                <span className={W.barSite}>{site.site}</span>
                <span className={W.barValue}>
                  {value == null ? 'No price' : `${c.comparable && r.currency !== c.currency ? '≈ ' : ''}${listingPrice(value, c.comparable ? c.currency : r.currency)}`}
                </span>
              </div>
              {value != null && (
                <span className={W.track} aria-hidden="true"><span className={W.fill} style={{ '--w': `${Math.max(2, (value / top) * 100)}%` }} /></span>
              )}
              {r.proceeds != null && (
                <p className={W.barSub}>
                  {listingPrice(r.price, r.currency)}
                  {r.saleVat ? ` less ${Math.round(r.saleVat * 100)}% VAT` : ''} {MINUS} {listingPrice(r.fees, r.currency)} eBay fees = {listingPrice(r.proceeds, r.currency)}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <p className={s.groupNote}>
        What each site&apos;s price leaves after that site&apos;s eBay fees, on your account settings
        {c.comparable && c.rates ? `, in ${c.currency} at the European Central Bank's rate of ${longDay(c.rates.date)}` : ', each in its own currency (no exchange rate to compare them just now)'}.
        {' '}On another country&apos;s site that is business rates, and on a UK or EU site the buyer&apos;s VAT comes out of the price.
        {' '}Not counted: what the item costs you for each site, and postage and international fees, which depend on where you post from. Add your costs on each listing to see the profit there.
      </p>
    </>
  );
}
