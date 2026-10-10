import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { Sheet } from '@components/ui/seller/Sheet';
import { useToast } from '@components/ui/seller/Toast';
import { CopyField, StatusPill } from '@components/ui/seller/parts';
import { IconAlert, IconCopy, IconDownload, IconTrash } from '@components/ui/seller/icons';
import { useSellerData } from '@context/SellerData';
import { useClipboard } from '@hooks/useClipboard';
import { listingCsv } from '@lib/sellerData';
import { inputLabel, longDate, pounds, when } from '@lib/sellerFormat';
import { PRICING, SELLER_ROUTES } from '@utils/constants';
import s from '@styles/pages/seller/app.module.css';

/* ──────────────────────────────────────────────────────────────────
 * A listing, /listings/:id
 *
 * The result of a job, one field per row in the order eBay's listing
 * form asks for them, each with its own copy button, so a seller
 * moving between this and eBay copies exactly what the next box needs.
 *
 * Copy all and Download put everything in one go. Delete removes it
 * now rather than in 90 days; its credits stay spent, because the work
 * was done.
 * ────────────────────────────────────────────────────────────────── */

const DAY = 86_400_000;

function allText(job) {
  const l = job.listing;
  return [
    `Title\n${l.title}`,
    `Description\n${l.description}`,
    `Category\n${l.category.path} (${l.category.id})`,
    `Item specifics\n${l.specifics.map(([k, v]) => `${k}: ${v}`).join('\n')}`,
    `Parcel\n${l.parcel.l} x ${l.parcel.w} x ${l.parcel.h} cm, ${l.parcel.kg} kg, ${l.parcel.band}`,
    `Price\n${pounds(l.price.value)}`,
  ].join('\n\n');
}

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
  const { job: find, deleteJob } = useSellerData();
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

  const l = job.listing;
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
            <section className={s.section} aria-label="The listing">
              <div className={s.group}>
                <CopyField label="Title" value={l.title} count={`${l.title.length}/80`} />
                <CopyField label="Description" value={l.description} clamp />
                <CopyField label="Category" value={l.category.path} copyText={l.category.id}>
                  <p className={s.fieldValue}>{l.category.path}</p>
                  <p className={`${s.small} ${s.mono}`}>ID {l.category.id}, copied by the button</p>
                </CopyField>
                <CopyField label="Item specifics" copyText={l.specifics.map(([k, v]) => `${k}: ${v}`).join('\n')}>
                  <dl className={s.specifics}>
                    {l.specifics.map(([k, v]) => (
                      <div key={k} className={s.pair}><dt>{k}</dt><dd>{v}</dd></div>
                    ))}
                  </dl>
                </CopyField>
                <CopyField
                  label="Parcel"
                  mono
                  value={`${l.parcel.l} x ${l.parcel.w} x ${l.parcel.h} cm, ${l.parcel.kg} kg`}
                >
                  <p className={`${s.fieldValue} ${s.fieldValueMono}`}>{l.parcel.l} x {l.parcel.w} x {l.parcel.h} cm, {l.parcel.kg} kg</p>
                  <p className={s.small}>{l.parcel.band}</p>
                </CopyField>
                <CopyField label="Price" copyText={l.price.value.toFixed(2)}>
                  <p className={s.price}>{pounds(l.price.value)}</p>
                  <p className={s.small}>Middle of {l.price.listings} live UK listings is {pounds(l.price.median)}</p>
                </CopyField>
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
