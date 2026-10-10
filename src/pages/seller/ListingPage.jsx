import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { Sheet } from '@components/ui/seller/Sheet';
import { useToast } from '@components/ui/seller/Toast';
import { CopyField, EditableField, StatusPill } from '@components/ui/seller/parts';
import { IconAlert, IconCopy, IconDownload, IconTrash } from '@components/ui/seller/icons';
import { useSellerData } from '@context/SellerData';
import { useClipboard } from '@hooks/useClipboard';
import { listingCsv, withEdits } from '@lib/sellerData';
import { MARKETPLACE } from '@lib/market';
import { inputLabel, listingPrice, longDate, parcel, when } from '@lib/sellerFormat';
import { PRICING, SELLER_ROUTES } from '@utils/constants';
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
 * ────────────────────────────────────────────────────────────────── */

const DAY = 86_400_000;

function allText(job) {
  const l = withEdits(job);
  return [
    `Title\n${l.title}`,
    `Condition\n${l.condition}`,
    `Description\n${l.description}`,
    `Category\n${l.category.path} (${l.category.id})`,
    `Item specifics\n${l.specifics.map(([k, v]) => `${k}: ${v}`).join('\n')}`,
    `Parcel\n${parcel(l.parcel)}, ${l.parcel.band}`,
    `Price\n${listingPrice(l.price.value, l.price.currency)}`,
  ].join('\n\n');
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

export function ListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { job: find, deleteJob, editJob, preview } = useSellerData();
  const { copy } = useClipboard({ resetMs: 1500 });
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const job = find(id);

  useEffect(() => { document.title = 'Remvo | Listing'; }, []);

  if (!job) {
    return (
      <>
        <PageHeader title="Listing" back={SELLER_ROUTES.LISTINGS} backLabel="Listings" large={false} />
        <div className={s.content}>
          <div className={s.empty}>
            <p className={s.emptyTitle}>This listing is not here</p>
            <p className={s.emptyText}>It may have been deleted, or passed its 90 days.</p>
          </div>
        </div>
      </>
    );
  }

  const l = withEdits(job);
  const o = job.listing;
  const site = MARKETPLACE[job.marketplace] ?? MARKETPLACE.US;
  const lang = site.langCode === 'en' ? undefined : site.langCode;
  const save = (field) => (value) => editJob(job.id, field, value);
  const keptUntil = new Date(Date.parse(job.createdAt) + PRICING.RESULT_DAYS * DAY).toISOString();

  async function remove() {
    setBusy(true);
    await deleteJob(job.id);
    toast('Listing deleted');
    navigate(SELLER_ROUTES.LISTINGS, { replace: true });
  }

  return (
    <>
      <PageHeader title={l ? 'Listing' : 'Failed listing'} back={SELLER_ROUTES.LISTINGS} backLabel="Listings" large={false} />
      <div className={s.content}>
        <header className={s.jobHead}>
          <h2 className={s.jobTitle}>{job.source ?? inputLabel(job.input)}</h2>
          <p className={s.jobMeta}>
            <StatusPill status={job.status} />
            <span>{when(job.createdAt)}</span>
            <span>{site.site}</span>
            <span className={s.mono}>{job.ref}</span>
            <span>{job.credits ? `${job.credits} credits` : 'No credits used'}</span>
          </p>
        </header>

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
            {preview && site.langCode !== 'en' && (
              <div className={s.section}>
                <p className={s.notice}>This example is in English. A real listing for {site.site} is written in {site.lang}.</p>
              </div>
            )}
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
                />
                <CopyField label="Condition" value={l.condition} />
                <EditableField label="Description" value={l.description} original={o.description} onSave={save('description')} multiline clamp lang={lang} />
                <CopyField label="Category" value={l.category.path} copyText={l.category.id}>
                  <p className={s.fieldValue} lang={lang}>{l.category.path}</p>
                  <p className={`${s.small} ${s.mono}`}>ID {l.category.id}, copied by the button</p>
                </CopyField>
                <CopyField label="Item specifics" copyText={l.specifics.map(([k, v]) => `${k}: ${v}`).join('\n')}>
                  <p className={s.small}>Each one below can be copied or changed on its own. This button copies them all.</p>
                </CopyField>
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
                <CopyField label="Parcel" mono value={parcel(l.parcel)}>
                  <p className={`${s.fieldValue} ${s.fieldValueMono}`}>{parcel(l.parcel)}</p>
                  <p className={s.small}>{l.parcel.band}</p>
                </CopyField>
                <EditableField
                  label="Price"
                  value={l.price.value}
                  original={o.price.value}
                  onSave={async (v) => save('price')(v === null ? null : Number(String(v).replace(',', '.')))}
                  inputMode="decimal"
                  mono
                  validate={priceProblem}
                >
                  <p className={s.price}>{listingPrice(l.price.value, l.price.currency)}</p>
                  <p className={s.small}>Middle of {l.price.listings} live {site.site} listings is {listingPrice(l.price.median, l.price.currency)}</p>
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
              {busy ? 'Deleting' : 'Delete listing'}
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
