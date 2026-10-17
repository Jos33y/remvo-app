import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { Sheet } from '@components/ui/seller/Sheet';
import { NameSheet, PasswordSheet } from '@components/ui/seller/AccountSheets';
import { SellerTypeSheet, sellerTypeName } from '@components/ui/seller/SellerTypeSheet';
import { useToast } from '@components/ui/seller/Toast';
import { IconChat, IconChevronRight, IconExternal, IconMail } from '@components/ui/seller/icons';
import { CURRENCIES, MARKETPLACES, MARKETPLACE } from '@lib/market';
import { useSellerSession } from '@context/SellerSession';
import { useSellerData } from '@context/SellerData';
import { longDate, when } from '@lib/sellerFormat';
import { sellerApi } from '@lib/sellerApi';
import { addPasskey, passkeysSupported } from '@lib/sellerPasskeys';
import { BRAND, SELLER_ROUTES, siteUrl } from '@utils/constants';
import s from '@styles/pages/seller/app.module.css';
import P from '@styles/pages/seller/profile.module.css';

/* ──────────────────────────────────────────────────────────────────
 * Profile
 *
 * Who you are signed in as, where to get help, the policies, and the
 * two ways out: sign out, and delete the account.
 *
 * Who you are is a sender's label: ivory paper with a cut line, FROM,
 * the seller's name in serif, the email and the date they joined, and
 * a barcode drawn from the email (the same account always gets the
 * same bars). The label is Profile's one picture; the rest is rows.
 *
 * Deleting is in the app because both app stores require it of any
 * app with sign-up. Until the API has the endpoint, the sheet says
 * exactly what deletion removes and sends the request to support,
 * which is a real, working path today.
 * ────────────────────────────────────────────────────────────────── */

const APP_VERSION = '0.1';

/* Bars for the label, from the email: the same address, the same bars. */
function barsFor(text = '') {
  let h = 2166136261;
  const out = [];
  for (let i = 0; i < 38; i += 1) {
    h ^= text.charCodeAt(i % Math.max(1, text.length)) + i;
    h = Math.imul(h, 16777619) >>> 0;
    out.push(1 + (h % 3));
  }
  return out;
}

function Bars({ seed }) {
  let x = 0;
  const rects = barsFor(seed).map((w, i) => {
    const r = i % 2 === 0 ? <rect key={i} x={x} y="0" width={w} height="28" /> : null;
    x += w + (i % 2 === 0 ? 0 : 0);
    return r;
  });
  return <svg className={P.bars} viewBox={`0 0 ${x} 28`} preserveAspectRatio="none" aria-hidden="true" focusable="false">{rects}</svg>;
}

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
  const [choosing, setChoosing] = useState(null); // 'site' | 'currency' | 'account' | 'password' | 'name' | null
  const [keys, setKeys] = useState(null);
  const [keyBusy, setKeyBusy] = useState(false);
  const [removing, setRemoving] = useState(null); // the passkey being asked about
  const canPasskey = passkeysSupported();

  const loadKeys = useCallback(() => sellerApi.passkeys().then((r) => setKeys(r.items)).catch(() => setKeys([])), []);
  useEffect(() => { loadKeys(); }, [loadKeys]);

  async function onAddPasskey() {
    if (keyBusy) return;
    setKeyBusy(true);
    try {
      const added = await addPasskey();
      if (added) { await loadKeys(); toast(`Passkey added for this ${added.label === 'Passkey' ? 'device' : added.label}`); }
    } catch (err) {
      toast(err.message);
    } finally {
      setKeyBusy(false);
    }
  }

  async function onRemovePasskey(k) {
    setKeyBusy(true);
    try {
      await sellerApi.passkeyRemove(k.id);
      await loadKeys();
      setRemoving(null);
      toast('Passkey removed');
    } catch (err) {
      toast(err.message);
    } finally {
      setKeyBusy(false);
    }
  }
  const site = MARKETPLACE[settings?.marketplace ?? 'US'];
  const cur = CURRENCIES.find((c) => c.id === (settings?.currency ?? 'USD'));

  async function choose(patch, said, keepOpen = false) {
    try {
      await updateSettings(patch);
      if (!keepOpen) setChoosing(null);
      toast(said);
    } catch (err) {
      toast(err.message);
    }
  }

  useEffect(() => { document.title = 'Remvo | Profile'; }, []);

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
        <section className={`${s.section} ${P.label}`} aria-label="Signed in as">
          <div className={P.cut}>
            <p className={P.from}>From</p>
            {account?.name ? (
              <p className={P.name}>{account.name}</p>
            ) : (
              <button type="button" className={P.addName} onClick={() => setChoosing('name')}>Add your name</button>
            )}
            <p className={P.email}>{breakable(account?.email)}</p>
            <div className={P.foot}>
              {account?.createdAt && <p className={P.since}>Remvo seller since {longDate(account.createdAt)}</p>}
              <Bars seed={account?.email ?? ''} />
            </div>
          </div>
        </section>

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
            <button type="button" className={s.row} onClick={() => setChoosing('account')}>
              <span className={s.rowMain}>
                <span className={s.rowTitle}>eBay account</span>
                <span className={s.rowSub}>For the fees in What you keep</span>
              </span>
              <span className={s.rowValue}>{sellerTypeName(settings)}</span>
              <span className={s.chevron}><IconChevronRight /></span>
            </button>
          </div>
          <p className={s.groupNote}>The eBay site sets the language, categories, parcel services and prices of new listings. The currency is what you pay in. Your eBay account, private or business, sets the fees profit is worked out on.</p>
        </section>

        <section className={s.section} aria-labelledby="account-heading">
          <div className={s.groupHead}><h2 id="account-heading" className={s.groupTitle}>Account</h2></div>
          <div className={s.group}>
            <div className={s.row}>
              <span className={s.rowMain}><span className={s.rowTitle}>Email</span></span>
              <span className={`${s.rowValue} ${s.rowValueTruncate}`}>{account?.email}</span>
            </div>
            <button type="button" className={s.row} onClick={() => setChoosing('name')}>
              <span className={s.rowMain}><span className={s.rowTitle}>Name</span></span>
              <span className={`${s.rowValue} ${s.rowValueTruncate}`}>{account?.name || 'Add'}</span>
              <span className={s.chevron}><IconChevronRight /></span>
            </button>
            <button type="button" className={s.row} onClick={() => setChoosing('password')}>
              <span className={s.rowMain}>
                <span className={s.rowTitle}>Password</span>
                {!account?.hasPassword && <span className={s.rowSub}>Not set yet. Set one so your browser can sign you in.</span>}
              </span>
              <span className={s.rowValue}>{account?.hasPassword ? 'Change' : 'Set'}</span>
              <span className={s.chevron}><IconChevronRight /></span>
            </button>
          </div>
          <p className={s.groupNote}>To change your email, write to us from the one you use now.</p>
        </section>

        <section className={s.section} aria-labelledby="passkeys-heading">
          <div className={s.groupHead}><h2 id="passkeys-heading" className={s.groupTitle}>Passkeys</h2></div>
          <div className={s.group}>
            {(keys ?? []).map((k) => (
              <div key={k.id} className={s.row}>
                <span className={s.rowMain}>
                  <span className={s.rowTitle}>{k.label}</span>
                  <span className={s.rowSub}>Added {longDate(k.createdAt)}{k.lastUsedAt ? `. Last used ${when(k.lastUsedAt).replace(/^(Today|Yesterday)/, (m) => m.toLowerCase())}` : ''}</span>
                </span>
                <button type="button" className={s.keyRemove} onClick={() => setRemoving(k)}>Remove<span className="sr-only"> passkey on {k.label}</span></button>
              </div>
            ))}
            {canPasskey ? (
              <button type="button" className={s.row} onClick={onAddPasskey} disabled={keyBusy}>
                <span className={s.rowMain}><span className={`${s.rowTitle} ${s.accent}`}>{keyBusy ? 'Adding…' : 'Add a passkey on this device'}</span></span>
              </button>
            ) : (
              <div className={s.row}><span className={s.rowMain}><span className={s.rowSub}>This browser cannot make passkeys.</span></span></div>
            )}
          </div>
          <p className={s.groupNote}>Sign in with Face ID, a fingerprint or your screen lock instead of typing a password. Your phone or password manager keeps it and can share it with your other devices.</p>
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

      <Sheet
        open={Boolean(removing)}
        onClose={() => !keyBusy && setRemoving(null)}
        title="Remove this passkey?"
        footer={
          <div className={s.actions}>
            <button type="button" className={`${s.button} ${s.destructive} ${s.block}`} onClick={() => onRemovePasskey(removing)} disabled={keyBusy}>
              {keyBusy ? 'Removing…' : 'Remove passkey'}
            </button>
            <button type="button" className={`${s.button} ${s.secondary} ${s.block}`} onClick={() => setRemoving(null)} disabled={keyBusy}>Keep it</button>
          </div>
        }
      >
        <p className={s.sheetText}>
          {removing?.label} will no longer sign you in. {account?.hasPassword ? 'You can still sign in with your password.' : 'Set a password first if this is your only way in.'}
        </p>
      </Sheet>

      <PasswordSheet open={choosing === 'password'} onClose={() => setChoosing(null)} onSaved={toast} />
      <NameSheet open={choosing === 'name'} onClose={() => setChoosing(null)} onSaved={toast} />

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

      <SellerTypeSheet open={choosing === 'account'} onClose={() => setChoosing(null)} settings={settings} onChoose={choose} />

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
