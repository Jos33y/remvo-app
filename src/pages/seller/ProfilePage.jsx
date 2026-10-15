import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { Sheet } from '@components/ui/seller/Sheet';
import { useToast } from '@components/ui/seller/Toast';
import { IconChat, IconChevronRight, IconExternal, IconMail } from '@components/ui/seller/icons';
import { CURRENCIES, MARKETPLACES, MARKETPLACE } from '@lib/market';
import { useSellerSession } from '@context/SellerSession';
import { useSellerData } from '@context/SellerData';
import { longDate } from '@lib/sellerFormat';
import { BRAND, SELLER_ROUTES, siteUrl } from '@utils/constants';
import s from '@styles/pages/seller/app.module.css';

/* ──────────────────────────────────────────────────────────────────
 * Profile
 *
 * Who you are signed in as, where to get help, the policies, and the
 * two ways out: sign out, and delete the account.
 *
 * Deleting is in the app because both app stores require it of any
 * app with sign-up. Until the API has the endpoint, the sheet says
 * exactly what deletion removes and sends the request to support,
 * which is a real, working path today.
 * ────────────────────────────────────────────────────────────────── */

const APP_VERSION = '0.1';

/* A long address wraps before the @ and at dots, never mid-word. */
function breakable(email = '') {
  return email.split(/(?=[@.])/).map((part, i) => <span key={i}>{i > 0 && <wbr />}{part}</span>);
}

function Row({ href, children, external = false }) {
  return (
    <a href={href} className={s.row} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      <span className={s.rowMain}><span className={s.rowTitle}>{children}</span></span>
      <span className={s.chevron}>{external ? <IconExternal size={18} /> : <IconChevronRight />}</span>
    </a>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { account, signOut } = useSellerSession();
  const { settings, updateSettings } = useSellerData();
  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [choosing, setChoosing] = useState(null); // 'site' | 'currency' | null
  const site = MARKETPLACE[settings?.marketplace ?? 'US'];
  const cur = CURRENCIES.find((c) => c.id === (settings?.currency ?? 'USD'));

  async function choose(patch, said) {
    try {
      await updateSettings(patch);
      setChoosing(null);
      toast(said);
    } catch (err) {
      toast(err.message);
    }
  }

  useEffect(() => { document.title = 'Remvo | Profile'; }, []);

  const initial = (account?.email ?? '?').charAt(0).toUpperCase();
  const deleteMail = `mailto:${BRAND.EMAIL}?subject=${encodeURIComponent('Delete my Remvo account')}&body=${encodeURIComponent(`Please delete the Remvo account for ${account?.email}.`)}`;

  async function onSignOut() {
    setLeaving(true);
    await signOut();
    navigate(SELLER_ROUTES.SIGN_IN, { replace: true });
  }

  return (
    <>
      <PageHeader title="Profile" />
      <div className={s.content}>
        <div className={s.section}>
          <div className={s.profileHead}>
            <span className={s.avatar} aria-hidden="true">{initial}</span>
            <span className={s.rowMain}>
              <span className={s.profileEmail}>{breakable(account?.email)}</span>
              {account?.createdAt && <span className={s.rowSub}>Since {longDate(account.createdAt)}</span>}
            </span>
          </div>
        </div>

        <section className={s.section} aria-labelledby="selling-heading">
          <div className={s.groupHead}><h2 id="selling-heading" className={s.groupTitle}>Selling</h2></div>
          <div className={s.group}>
            <button type="button" className={s.row} onClick={() => setChoosing('site')}>
              <span className={s.rowMain}>
                <span className={s.rowTitle}>eBay site</span>
                <span className={s.rowSub}>Listings written in {site.lang}</span>
              </span>
              <span className={s.rowValue}>{site.site}</span>
              <span className={s.chevron}><IconChevronRight /></span>
            </button>
            <button type="button" className={s.row} onClick={() => setChoosing('currency')}>
              <span className={s.rowMain}><span className={s.rowTitle}>Currency</span></span>
              <span className={s.rowValue}>{cur.symbol} {cur.id}</span>
              <span className={s.chevron}><IconChevronRight /></span>
            </button>
          </div>
          <p className={s.groupNote}>The eBay site sets the language, categories, parcel services and prices of new listings. The currency is what you pay in.</p>
        </section>

        <section className={s.section} aria-labelledby="account-heading">
          <div className={s.groupHead}><h2 id="account-heading" className={s.groupTitle}>Account</h2></div>
          <div className={s.group}>
            <div className={s.row}>
              <span className={s.rowMain}><span className={s.rowTitle}>Email</span></span>
              <span className={`${s.rowValue} ${s.rowValueTruncate}`}>{account?.email}</span>
            </div>
            <div className={s.row}>
              <span className={s.rowMain}><span className={s.rowTitle}>Signing in</span></span>
              <span className={s.rowValue}>Email link or code</span>
            </div>
          </div>
          <p className={s.groupNote}>To change your email, write to us from the one you use now.</p>
        </section>

        <section className={s.section} aria-labelledby="help-heading">
          <div className={s.groupHead}><h2 id="help-heading" className={s.groupTitle}>Help</h2></div>
          <div className={s.group}>
            <Link to={SELLER_ROUTES.SUPPORT} className={s.row}>
              <span className={s.rowIcon}><IconChat size={18} /></span>
              <span className={s.rowMain}>
                <span className={s.rowTitle}>Chat with us</span>
                <span className={s.rowSub}>A person answers, usually within a few hours</span>
              </span>
              <span className={s.chevron}><IconChevronRight /></span>
            </Link>
            <a href={`mailto:${BRAND.EMAIL}`} className={s.row}>
              <span className={s.rowIcon}><IconMail size={18} /></span>
              <span className={s.rowMain}>
                <span className={s.rowTitle}>Email support</span>
                <span className={s.rowSub}>{BRAND.EMAIL}, answered within 48 hours</span>
              </span>
            </a>
            <Row href={siteUrl('/how-it-works')} external>How Remvo works</Row>
            <Row href={siteUrl('/pricing')} external>Pricing</Row>
          </div>
        </section>

        <section className={s.section} aria-labelledby="legal-heading">
          <div className={s.groupHead}><h2 id="legal-heading" className={s.groupTitle}>Legal</h2></div>
          <div className={s.group}>
            <Row href={siteUrl('/terms')} external>Terms of service</Row>
            <Row href={siteUrl('/privacy')} external>Privacy policy</Row>
            <Row href={siteUrl('/refunds')} external>Refund policy</Row>
            <Row href={siteUrl('/credits')} external>Credit terms</Row>
          </div>
        </section>

        <div className={s.section}>
          <div className={s.group}>
            <button type="button" className={s.row} onClick={onSignOut} disabled={leaving}>
              <span className={s.rowMain}><span className={`${s.rowTitle} ${s.accent}`}>{leaving ? 'Signing out…' : 'Sign out'}</span></span>
            </button>
            <button type="button" className={s.row} onClick={() => setDeleting(true)}>
              <span className={s.rowMain}><span className={`${s.rowTitle} ${s.danger}`}>Delete account</span></span>
            </button>
          </div>
        </div>

        <p className={s.version}>Remvo {APP_VERSION}. {BRAND.LEGAL_NAME}</p>
      </div>

      <Sheet open={choosing === 'site'} onClose={() => setChoosing(null)} title="eBay site">
        <div className={s.packs} role="radiogroup" aria-label="eBay site">
          {MARKETPLACES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={settings?.marketplace === m.id}
              className={s.pack}
              onClick={() => choose({ marketplace: m.id }, `New listings for ${m.site}`)}
              data-autofocus={settings?.marketplace === m.id ? '' : undefined}
            >
              <span className={s.packMain}>
                <span className={s.packCredits}>{m.site}</span>
                <br />
                <span className={s.packSub}>{m.name}, in {m.lang}</span>
              </span>
              <span className={s.radio} aria-hidden="true" />
            </button>
          ))}
        </div>
        <p className={`${s.small} ${s.after}`}>Listings you have already made stay as they are.</p>
      </Sheet>

      <Sheet open={choosing === 'currency'} onClose={() => setChoosing(null)} title="Currency">
        <div className={s.packs} role="radiogroup" aria-label="Currency">
          {CURRENCIES.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={settings?.currency === c.id}
              className={s.pack}
              onClick={() => choose({ currency: c.id }, `Paying in ${c.name.toLowerCase()}`)}
              data-autofocus={settings?.currency === c.id ? '' : undefined}
            >
              <span className={s.packPrice}>{c.symbol}</span>
              <span className={s.packMain}><span className={s.packCredits}>{c.name}</span></span>
              <span className={s.radio} aria-hidden="true" />
            </button>
          ))}
        </div>
        <p className={`${s.small} ${s.after}`}>Your credits are the same in any currency. This only changes what top-ups are priced in.</p>
      </Sheet>

      <Sheet
        open={deleting}
        onClose={() => setDeleting(false)}
        title="Delete your account?"
        footer={
          <div className={s.actions}>
            <a href={deleteMail} className={`${s.button} ${s.destructive} ${s.block}`}>Ask us to delete it</a>
            <button type="button" className={`${s.button} ${s.secondary} ${s.block}`} onClick={() => setDeleting(false)}>Keep my account</button>
          </div>
        }
      >
        <div className={s.group}>
          <div className={s.row}><span className={s.rowMain}><span className={s.rowTitle}>Your listings</span><span className={s.rowSub}>Deleted</span></span></div>
          <div className={s.row}><span className={s.rowMain}><span className={s.rowTitle}>Unused credits</span><span className={s.rowSub}>Lost, unless bought in the last 14 days: those are refunded</span></span></div>
          <div className={s.row}><span className={s.rowMain}><span className={s.rowTitle}>Payment records</span><span className={s.rowSub}>Kept for six years, as tax law requires</span></span></div>
        </div>
        <p className={s.groupNote}>This opens an email to {BRAND.EMAIL}. We delete the account within 30 days and confirm by email.</p>
      </Sheet>
    </>
  );
}
