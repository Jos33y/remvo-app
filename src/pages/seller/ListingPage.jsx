import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { Sheet } from '@components/ui/seller/Sheet';
import { useToast } from '@components/ui/seller/Toast';
import { CopyField, EditableField, StatusPill } from '@components/ui/seller/parts';
import { IconAlert, IconCheck, IconCopy, IconDownload, IconTrash } from '@components/ui/seller/icons';
import { useSellerData } from '@context/SellerData';
import { useClipboard } from '@hooks/useClipboard';
import { barcodeLabel, listingCsv, productName, stepsFor, withEdits } from '@lib/sellerData';
import { MARKETPLACE } from '@lib/market';
import { hasParcel, inputLabel, listingPrice, longDate, parcel, when } from '@lib/sellerFormat';
import { count, plural } from '@lib/plural';
import { PRICING, SELLER_ROUTES } from '@utils/constants';
import { Breakable } from '@components/ui/seller/Breakable';
import s from '@styles/pages/seller/app.module.css';

/* ──────────────────────────────────────────────────────────────────
 * A listing, /listings/:id
 *
 * The result of a job, one field per row in the order eBay's listing
 * form asks for them, each with its own copy button, so a seller
 * moving between this and eBay copies exactly what the next box needs.
 *
 * Every field the seller is likely to change (title, description, item
 * specific values, price) can be edited here; what they copy and
 * download is their version, and any field can be put back.
 *
 * Copy all and Download put everything in one go. Delete removes it
 * now rather than in 90 days; its credits stay spent, because the work
 * was done.
 *
 * Anything Remvo could not find (a category, a parcel the page does
 * not give, a price with no live listings to go by, a required item
 * specific) is said plainly where it would be, never left blank.
 * ────────────────────────────────────────────────────────────────── */

const DAY = 86_400_000;

function allText(job) {
  const l = withEdits(job);
  const id = l.identifiers ?? {};
  return [
    `Title\n${l.title}`,
    `Condition\n${l.condition}`,
    `Description\n${l.description}`,
    l.category && `Category\n${l.category.path} (${l.category.id})`,
    [id.brand && `Brand: ${id.brand}`, id.mpn && `MPN: ${id.mpn}`, id.gtin && `${barcodeLabel(job.marketplace)}: ${id.gtin}`].filter(Boolean).join('\n'),
    l.specifics.length && `Item specifics\n${l.specifics.map(([k, v]) => `${k}: ${v}`).join('\n')}`,
    hasParcel(l.parcel) && `Parcel\n${parcel(l.parcel)}, ${l.parcel.band}`,
    l.price.value != null && `Price\n${listingPrice(l.price.value, l.price.currency)}`,
  ].filter(Boolean).join('\n\n');
}

const priceProblem = (v) => (/^\d{1,6}([.,]\d{1,2})?$/.test(v) && Number(v.replace(',', '.')) > 0 ? '' : 'Enter a price such as 19.99.');

function download(job) {
  const blob = new Blob([listingCsv(job)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `remvo-${job.ref}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const BRAND = /^(brand|marke|marque|marca)$/i;

export function ListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { job: find, fetchJob, deleteJob, editJob, jobsStatus } = useSellerData();
  const { copy } = useClipboard({ resetMs: 1500 });
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState(false);
  // Set as a delete starts: the listing leaving the store is not a reason to ask the server for it.
  const deleting = useRef(false);
  const job = find(id);

  useEffect(() => { document.title = 'Remvo | Listing'; }, []);

  // Opened straight from a link, or older than the first page: ask for it.
  useEffect(() => {
    if (job || jobsStatus === 'loading' || deleting.current) return;
    let live = true;
    fetchJob(id).catch(() => { if (live) setMissing(true); });
    return () => { live = false; };
  }, [id, Boolean(job), jobsStatus]);

  if (!job) {
    return (
      <>
        <PageHeader title="Listing" back={SELLER_ROUTES.LISTINGS} backLabel="Listings" large={false} />
        <div className={s.content}>
          {missing ? (
            <div className={s.empty}>
              <p className={s.emptyTitle}>This listing is not here</p>
              <p className={s.emptyText}>It may have been deleted, or passed its 90 days.</p>
            </div>
          ) : (
            <div className={s.empty} aria-busy="true">
              <p className={s.emptyText}>Opening the listing…</p>
            </div>
          )}
        </div>
      </>
    );
  }

  const l = withEdits(job);
  const o = job.listing;
  const site = MARKETPLACE[job.marketplace] ?? MARKETPLACE.US;
  const lang = site.langCode === 'en' ? undefined : site.langCode;
  const ids = l?.identifiers ?? {};
  const needs = (l?.missing ?? []).filter((m) => m !== 'category');
  const making = job.status === 'queued' || job.status === 'running';
  const save = (field) => (value) => editJob(job.id, field, value);
  const keptUntil = new Date(Date.parse(job.createdAt) + PRICING.RESULT_DAYS * DAY).toISOString();

  async function remove() {
    setBusy(true);
    deleting.current = true;
    try {
      await deleteJob(job.id);
    } catch (err) {
      deleting.current = false;
      setBusy(false);
      setConfirm(false);
      toast(err.message || 'That did not delete. Try again.');
      return;
    }
    toast('Listing deleted');
    navigate(SELLER_ROUTES.LISTINGS, { replace: true });
  }

  return (
    <>
      <PageHeader title={job.status === 'failed' ? 'Failed listing' : 'Listing'} back={SELLER_ROUTES.LISTINGS} backLabel="Listings" large={false} />
      <div className={s.content}>
        <header className={s.jobHead}>
          <h2 className={`${s.jobTitle} ${productName(job) ? s.jobTitleClamp : ''}`} title={productName(job) ?? undefined}>
            {productName(job) ?? <Breakable text={inputLabel(job.input)} />}
          </h2>
          <p className={s.jobMeta}>
            <StatusPill status={job.status} />
            <span>{when(job.createdAt)}</span>
            <span>{site.site}</span>
            <span className={s.mono}>{job.ref}</span>
            <span>{job.credits ? count(job.credits, 'credit') : 'No credits used'}</span>
          </p>
        </header>

        {making && (
          <div className={s.section}>
            <div className={s.card} aria-live="polite">
              <ol className={s.steps}>
                {stepsFor(job.marketplace).map((label, i) => {
                  const state = i < job.step ? s.stepDone : i === job.step ? s.stepNow : '';
                  return (
                    <li key={label} className={`${s.step} ${state}`}>
                      <span className={s.stepMark}>{i < job.step && <IconCheck size={14} />}</span>
                      {label}
                      {i < job.step && <span className="sr-only">, done</span>}
                    </li>
                  );
                })}
              </ol>
            </div>
            <p className={s.groupNote}>{job.status === 'queued' ? 'Waiting for your previous listing to finish.' : 'Being made now. This page fills in when it is ready.'}</p>
          </div>
        )}

        {job.status === 'failed' && (
          <div className={s.section}>
            <div className={`${s.notice} ${s.noticeDanger}`}>
              <IconAlert size={20} />
              <span>{job.failure} The credits went back to your balance.</span>
            </div>
          </div>
        )}

        {l && (
          <>
            <section className={s.section} aria-label="The listing">
              <div className={s.group}>
                <EditableField
                  label="Title"
                  value={l.title}
                  original={o.title}
                  onSave={save('title')}
                  count={(v) => `${String(v).length}/80`}
                  validate={(v) => (!v ? 'A listing needs a title.' : v.length > 80 ? `eBay takes 80 characters; this is ${v.length}.` : '')}
                  lang={lang}
                >
                  <p className={s.fieldValue} lang={lang}>{l.title}</p>
                  {o.alternative && l.title !== o.alternative && (
                    <button type="button" className={s.altTitle} onClick={() => save('title')(o.alternative).then(() => toast('Other title used'))}>
                      <span className={s.small}>Or use</span>
                      <span lang={lang}>{o.alternative}</span>
                    </button>
                  )}
                </EditableField>
                <CopyField label="Condition" value={l.condition} />
                <EditableField label="Description" value={l.description} original={o.description} onSave={save('description')} multiline clamp lang={lang} />
                {l.category ? (
                  <CopyField label="Category" value={l.category.path} copyText={l.category.id}>
                    <p className={s.fieldValue} lang={lang}>{l.category.path}</p>
                    <p className={`${s.small} ${s.mono}`}>ID {l.category.id}, copied by the button</p>
                  </CopyField>
                ) : (
                  <div className={s.field}>
                    <div className={s.fieldMain}>
                      <p className={s.fieldLabel}><span>Category</span></p>
                      <p className={s.fieldValue}>eBay did not suggest one. Type the title into eBay&apos;s category search and pick the closest.</p>
                    </div>
                  </div>
                )}
                {/* Brand shows once: in the specifics when it is there, otherwise here. */}
                {ids.brand && !l.specifics.some(([k, v]) => BRAND.test(k) && v === ids.brand) && <CopyField label="Brand" value={ids.brand} />}
                {ids.mpn && <CopyField label="MPN" mono value={ids.mpn} />}
                {ids.gtin && <CopyField label={barcodeLabel(job.marketplace)} mono value={ids.gtin} />}
                {l.specifics.length > 0 && (
                  <CopyField label="Item specifics" copyText={l.specifics.map(([k, v]) => `${k}: ${v}`).join('\n')}>
                    <p className={s.small}>Each one below can be copied or changed on its own. This button copies them all.</p>
                  </CopyField>
                )}
                {l.specifics.map(([k, v], i) => (
                  <EditableField
                    key={k}
                    label={k}
                    value={v}
                    original={o.specifics[i][1]}
                    onSave={save(`spec:${k}`)}
                    compact
                    validate={(x) => (x ? '' : `${k} cannot be empty. Put it back instead.`)}
                    lang={lang}
                  />
                ))}
                {needs.length > 0 && (
                  <div className={s.field}>
                    <div className={s.fieldMain}>
                      <p className={s.fieldLabel}><span>Still needed on eBay</span></p>
                      <p className={s.fieldValue} lang={lang}>{needs.join(', ')}</p>
                      <p className={s.small}>eBay asks for {plural(needs.length, 'this', 'these')} and the product page does not say. Fill {plural(needs.length, 'it', 'them')} in from the item in your hand.</p>
                    </div>
                  </div>
                )}
                {hasParcel(l.parcel) ? (
                  <CopyField label="Parcel" mono value={parcel(l.parcel)}>
                    <p className={`${s.fieldValue} ${s.fieldValueMono}`}>{parcel(l.parcel)}</p>
                    <p className={s.small}>
                      {l.parcel.band}
                      {l.parcel.l == null ? '. The page gives no size: measure the box.' : ''}
                      {l.parcel.weight == null ? '. The page gives no weight: weigh it packed.' : ''}
                    </p>
                  </CopyField>
                ) : (
                  <div className={s.field}>
                    <div className={s.fieldMain}>
                      <p className={s.fieldLabel}><span>Parcel</span></p>
                      <p className={s.fieldValue}>The product page gives no size or weight. Weigh and measure it packed.</p>
                    </div>
                  </div>
                )}
                <EditableField
                  label="Price"
                  value={l.price.value}
                  original={o.price.value}
                  onSave={async (v) => save('price')(v === null ? null : Number(String(v).replace(',', '.')))}
                  inputMode="decimal"
                  mono
                  validate={priceProblem}
                >
                  {l.price.value != null
                    ? <p className={s.price}>{listingPrice(l.price.value, l.price.currency)}</p>
                    : <p className={s.fieldValue}>Not set</p>}
                  <p className={s.small}>
                    {o.price.listings
                      ? `Middle of ${count(o.price.listings, `live ${site.site} listing`)} is ${listingPrice(o.price.median, o.price.currency)}`
                      : `No live ${site.site} listings of this product to price from. Set your own.`}
                  </p>
                </EditableField>
              </div>
              <p className={s.groupNote}>Check it against your stock before you publish. Kept until {longDate(keptUntil)}.</p>
            </section>

            <div className={`${s.section} ${s.actions} ${s.actionsRow}`}>
              <button type="button" className={`${s.button} ${s.primary}`} onClick={async () => { if (await copy(allText(job))) toast('Everything copied'); }}>
                <IconCopy size={20} /> Copy everything
              </button>
              <button type="button" className={`${s.button} ${s.secondary}`} onClick={() => download(job)}>
                <IconDownload size={20} /> Download CSV
              </button>
            </div>
          </>
        )}

        <div className={s.section}>
          <div className={s.group}>
            <button type="button" className={`${s.row} ${s.danger}`} onClick={() => setConfirm(true)}>
              <span className={s.rowMain}><span className={s.rowTitle}>Delete listing</span></span>
              <IconTrash size={20} />
            </button>
          </div>
        </div>
      </div>

      <Sheet
        open={confirm}
        onClose={() => !busy && setConfirm(false)}
        title="Delete this listing?"
        footer={
          <div className={s.actions}>
            <button type="button" className={`${s.button} ${s.destructive} ${s.block}`} onClick={remove} disabled={busy}>
              {busy ? 'Deleting…' : 'Delete listing'}
            </button>
            <button type="button" className={`${s.button} ${s.secondary} ${s.block}`} onClick={() => setConfirm(false)} disabled={busy}>
              Keep it
            </button>
          </div>
        }
      >
        <p className={s.sheetText}>
          It is removed now, not in 90 days, and cannot be brought back. The {job.credits || 'no'} credits it used stay spent.
        </p>
      </Sheet>
    </>
  );
}
