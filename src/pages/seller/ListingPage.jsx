import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { NotHere } from '@components/ui/seller/NotHere';
import { NextQuestion } from '@components/ui/seller/AskNext';
import { useToast } from '@components/ui/seller/Toast';
import { CopyField, EditableField, StatusPill } from '@components/ui/seller/parts';
import { IconAlert, IconCheck, IconCopy, IconDownload, IconExternal, IconTrash } from '@components/ui/seller/icons';
import { useSellerData } from '@context/SellerData';
import { useClipboard } from '@hooks/useClipboard';
import { barcodeLabel, listingCsv, productName, stepsFor, withEdits } from '@lib/sellerData';
import { MARKETPLACE } from '@lib/market';
import { hasParcel, inputLabel, listingPrice, longDate, parcel, when } from '@lib/sellerFormat';
import { count, plural } from '@lib/plural';
import { PRICING, SELLER_ROUTES, supportPath, worldPath } from '@utils/constants';
import { Breakable } from '@components/ui/seller/Breakable';
import { ProfitCard } from '@components/ui/seller/ProfitCard';
import { SellerTypeSheet } from '@components/ui/seller/SellerTypeSheet';
import s from '@styles/pages/seller/app.module.css';
import L from '@styles/pages/seller/listing.module.css';

// Undo is offered for as long as its toast shows (eight seconds, longer
// while it is pointed at or focused); this is only the longest wait.
const UNDO_SAFETY_MS = 60_000;

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
 * now rather than in 90 days, with Undo for a few seconds instead of a
 * question first; its credits stay spent, because the work was done.
 *
 * Anything Remvo could not find (a category, a parcel the page does
 * not give, a price with no live listings to go by, a required item
 * specific) is said plainly where it would be, never left blank.
 *
 * Above the fields, what the seller keeps if it sells (ProfitCard),
 * on their own eBay fees: worked out by the API, which is why the
 * listing is asked for again when it came from a list without it, and
 * when the seller changes how their eBay account is set up.
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
const MPN = /^(mpn|herstellernummer|numéro de pièce fabricant|codice produttore|número de pieza del fabricante)$/i;

/* The product photo's own colour, softly behind it: a tint, never a
 * theme. Read from a copy of the image; when the image host does not
 * allow that (no CORS), the tint stays the default lapis. */
function useTint(src) {
  const [tint, setTint] = useState(null);
  useEffect(() => {
    if (!src) return undefined;
    let live = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = 24; c.height = 24;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, 24, 24);
        const d = ctx.getImageData(0, 0, 24, 24).data;
        let r = 0; let g = 0; let b = 0; let n = 0;
        for (let i = 0; i < d.length; i += 4) {
          const max = Math.max(d[i], d[i + 1], d[i + 2]);
          const min = Math.min(d[i], d[i + 1], d[i + 2]);
          // Skip the white studio background and near-greys: the product's colour is what is left.
          if (d[i + 3] < 200 || min > 225 || max - min < 18) continue;
          r += d[i]; g += d[i + 1]; b += d[i + 2]; n += 1;
        }
        if (live && n > 12) setTint(`${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)}`);
      } catch { /* the host does not allow reading it: keep the default */ }
    };
    img.src = src;
    return () => { live = false; };
  }, [src]);
  return tint;
}

/* Where the price sits among live listings on the site: the spread
 * from lowest to highest, the middle marked, the seller's price as a
 * gold dot. Said in words too, for screen readers. */
function PriceRange({ price, value, site }) {
  const { low, high, median, listings, currency } = price;
  if (!listings || low == null || high == null) return null;
  const span = high - low;
  // Every live listing at one price: there is no spread to place anything on (world2). The note says it in words.
  if (!(span > 0)) return null;
  const at = (x) => Math.min(100, Math.max(0, ((x - low) / span) * 100));
  return (
    <div className={L.range}>
      <div className={L.rangeTrack} aria-hidden="true">
        {median != null && <span className={L.rangeMid} style={{ left: `${at(median)}%` }} />}
        {value != null && <span className={L.rangeYou} style={{ left: `${at(value)}%` }} />}
      </div>
      <div className={L.rangeEnds} aria-hidden="true">
        <span>{listingPrice(low, currency)}</span>
        <span>{listingPrice(high, currency)}</span>
      </div>
      <p className="sr-only">
        {count(listings, `live ${site} listing`)} range from {listingPrice(low, currency)} to {listingPrice(high, currency)}
        {median != null ? `, middle ${listingPrice(median, currency)}` : ''}.
      </p>
    </div>
  );
}

/* What the live listings say, in one line. One price for all of them is said as that (world2). */
function priceNote(price, site, none = 'Set your own below.') {
  const { listings, low, high, median, currency } = price;
  if (!listings) return `No live ${site} listings of this product to price from. ${none}`;
  if (listings === 1) return `One live ${site} listing, at ${listingPrice(median ?? low, currency)}.`;
  if (low != null && low === high) return `All ${listings} live ${site} listings are ${listingPrice(low, currency)}.`;
  return `Middle of ${count(listings, `live ${site} listing`)} is ${listingPrice(median, currency)}.`;
}

function BigPhoto({ src }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <span className={`${L.photo} ${L.photoEmpty}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="56" height="56" focusable="false">
          <path d="M12 3.5l8 4v9l-8 4-8-4v-9z M4 7.5l8 4 8-4M12 11.5v9" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className={L.photo}>
      <img src={src} alt="" width="200" height="200" decoding="async" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
    </span>
  );
}

export function ListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const madeIn = location.state?.madeIn ?? null;
  const toast = useToast();
  const { job: find, fetchJob, deleteJobSoon, editJob, jobsStatus, settings, updateSettings } = useSellerData();
  const [account, setAccount] = useState(false); // the eBay account sheet
  const { copy } = useClipboard({ resetMs: 1500 });
  const [missing, setMissing] = useState(false);
  // Set as a delete starts: the listing leaving the store is not a reason to ask the server for it.
  const deleting = useRef(false);
  const job = find(id);
  const tint = useTint(job?.source?.image ?? null);

  useEffect(() => { document.title = 'Remvo | Listing'; }, []);

  // Opened straight from a link, or older than the first page: ask for it.
  useEffect(() => {
    if (job || jobsStatus === 'loading' || deleting.current) return;
    let live = true;
    fetchJob(id).catch(() => { if (live) setMissing(true); });
    return () => { live = false; };
  }, [id, Boolean(job), jobsStatus]);

  // The profit comes with a listing asked for by id, not with the list,
  // and follows the seller's eBay account settings.
  const profitKey = `${settings?.sellerType ?? ''}|${settings?.vatRegistered ? 1 : 0}`;
  const askedFor = useRef(null);
  useEffect(() => {
    if (!job || job.status !== 'ready' || deleting.current) return;
    const key = `${job.id}|${profitKey}`;
    if (askedFor.current === key && job.profit !== undefined) return;
    askedFor.current = key;
    fetchJob(job.id).catch(() => {});
  }, [job?.id, job?.status, job?.profit === undefined, profitKey]);

  if (!job) {
    return (
      <>
        <PageHeader title="Listing" back={SELLER_ROUTES.LISTINGS} backLabel="Listings" large={false} />
        <div className={s.content}>
          {missing ? (
            <NotHere title="This listing is not here" text="It may have been deleted, or passed its 90 days." />
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

  // Delete at once, with Undo: no question first. The listing goes back
  // to Listings and is deleted for good when the Undo window closes.
  function remove(e) {
    deleting.current = true;
    const { undo, commit } = deleteJobSoon(job.id, UNDO_SAFETY_MS, (err) => toast(err.message || 'That listing did not delete. It is back in your list.'));
    navigate(SELLER_ROUTES.LISTINGS, { replace: true });
    toast('Listing deleted', {
      focus: e?.detail === 0, // pressed with a keyboard
      onClose: commit,
      action: { label: 'Undo', onClick: () => { if (undo()) toast('Listing back'); } },
    });
  }

  return (
    <>
      <PageHeader title={job.status === 'failed' ? 'Failed listing' : 'Listing'} back={SELLER_ROUTES.LISTINGS} backLabel="Listings" large={false} />
      <div className={`${s.content} ${L.page} ${madeIn != null ? L.fresh : ''}`}>
        <aside className={L.summary} style={tint ? { '--tint': tint } : undefined} aria-labelledby="listing-heading">
          <div className={L.stage}>
            <BigPhoto src={job.source?.image} />
          </div>
          <h2 id="listing-heading" className={L.title} title={productName(job) ?? undefined}>
            {l?.title ?? productName(job) ?? <Breakable text={inputLabel(job.input)} />}
          </h2>
          <p className={L.meta}>
            <StatusPill status={job.status} />
            <span>{site.site}</span>
            {l && <span>{l.condition}</span>}
            <span>{when(job.createdAt)}</span>
          </p>
          {madeIn != null && job.status === 'ready' && <p className={L.madeIn}>Ready in {count(madeIn, 'second')}.</p>}
          {job.worldId && (
            <p className={L.world}>
              One of several eBay sites for this product. <Link to={worldPath(job.worldId)} className={L.worldLink}>See where it brings in most</Link>
            </p>
          )}

          {l && (
            <>
              <div className={L.priceBlock}>
                <p className={L.priceLabel}>Price</p>
                {l.price.value != null
                  ? <p className={L.priceFigure}>{listingPrice(l.price.value, l.price.currency)}</p>
                  : <p className={L.priceNone}>Not set</p>}
                <PriceRange price={o.price} value={l.price.value} site={site.site} />
                <p className={L.priceNote}>
                  {priceNote(o.price, site.site)}
                </p>
              </div>

              <dl className={L.facts}>
                <div><dt>Category</dt><dd lang={lang}>{l.category ? l.category.path.split(' > ').at(-1) : 'Pick on eBay'}</dd></div>
                <div><dt>Item specifics</dt><dd>{l.specifics.length ? `${l.specifics.length} filled` : 'None needed'}{needs.length ? `, ${needs.length} to add` : ''}</dd></div>
                <div><dt>Parcel</dt><dd className={hasParcel(l.parcel) ? s.mono : undefined}>{hasParcel(l.parcel) ? parcel(l.parcel) : 'Measure it'}</dd></div>
              </dl>

              <div className={L.actions}>
                <button type="button" className={`${s.button} ${s.primary} ${s.block}`} onClick={async () => { if (await copy(allText(job))) toast('Everything copied'); }}>
                  <IconCopy size={20} /> Copy everything
                </button>
                <button type="button" className={`${s.button} ${s.secondary} ${s.block}`} onClick={() => download(job)}>
                  <IconDownload size={20} /> Download CSV
                </button>
              </div>
            </>
          )}

          {job.source?.url && (
            <p className={L.madeFrom}>
              <span className={L.madeFromLabel}>Made from</span>
              <a href={job.source.url} target="_blank" rel="noopener noreferrer" className={L.madeFromLink}>
                {job.source.title && <span className={L.madeFromTitle}>{job.source.title}</span>}
                <span className={L.madeFromHost}>View on {job.source.amazon ?? 'the product page'} <IconExternal size={13} /></span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </p>
          )}
          <p className={L.ref}><span className={s.mono}>{job.ref}</span> <span>{job.credits ? count(job.credits, 'credit') : 'No credits used'}</span></p>
        </aside>

        <div className={L.work}>
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
            {/* chat3: a person, a tap away, at the moment it went wrong. */}
            <p className={L.talk}>
              <Link to={supportPath('failed', job.ref)}>Want a person to look at it?</Link>
            </p>
          </div>
        )}

        {l && (
          <>
            {job.profit !== undefined && (
              <ProfitCard
                key={job.id}
                job={job}
                profit={job.profit}
                site={site}
                onSave={(field, value) => editJob(job.id, field, value)}
                onSellerType={(patch) => updateSettings(patch).then(() => toast(patch.sellerType === 'business' ? 'Business seller fees' : 'Private seller fees')).catch((err) => toast(err.message))}
                onOpenSettings={() => setAccount(true)}
              />
            )}

            <section className={L.fieldsSection} aria-labelledby="copy-heading">
              <div className={s.groupHead}>
                <h2 id="copy-heading" className={s.groupTitle}>Copy into eBay</h2>
                <span className={L.headNote}>In the order eBay asks</span>
              </div>
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
                {/* Brand and MPN show once: in the specifics when they are there, otherwise here. */}
                {ids.brand && !l.specifics.some(([k, v]) => BRAND.test(k) && v === ids.brand) && <CopyField label="Brand" value={ids.brand} />}
                {ids.mpn && !l.specifics.some(([k, v]) => MPN.test(k) && v === ids.mpn) && <CopyField label="MPN" mono value={ids.mpn} />}
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
                    {priceNote(o.price, site.site, 'Set your own.')}
                  </p>
                </EditableField>
              </div>
              <p className={s.groupNote}>Check it against your stock before you publish. Kept until {longDate(keptUntil)}.</p>
            </section>

            {/* ask1 and tidy1: the name if we have none, then what next; once each. */}
            <NextQuestion />

          </>
        )}

        <div className={s.section}>
          <div className={s.group}>
            <button type="button" className={`${s.row} ${s.danger}`} onClick={remove}>
              <span className={s.rowMain}>
                <span className={s.rowTitle}>Delete listing</span>
                <span className={s.rowSub}>Now, not in 90 days. Its credits stay spent.</span>
              </span>
              <IconTrash size={20} />
            </button>
          </div>
        </div>
        </div>
      </div>

      <SellerTypeSheet
        open={account}
        onClose={() => setAccount(false)}
        settings={settings}
        onChoose={(patch, said, keepOpen) => updateSettings(patch).then(() => { if (!keepOpen) setAccount(false); toast(said); }).catch((err) => toast(err.message))}
      />
    </>
  );
}
