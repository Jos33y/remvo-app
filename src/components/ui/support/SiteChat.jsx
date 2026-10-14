import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { ChatThread } from '@components/ui/support/ChatThread';
import { IconChat, IconClose } from '@components/ui/seller/icons';
import { useChat } from '@hooks/useChat';
import { siteChat } from '@lib/supportApi';
import { ROUTES } from '@utils/constants';
import theme from '@styles/layout/seller/app-theme.module.css';
import s from '@styles/ui/support/site-chat.module.css';

/* ──────────────────────────────────────────────────────────────────
 * SiteChat: the chat button on every page of remvo.app
 *
 * A visitor leaves their email and a first message; after that it is a
 * conversation, answered by a person from Telegram. The chat's id and
 * key live in this browser, so it carries on across pages and visits.
 * The link in a reply email (?chat=id.key) opens it on any device.
 *
 * A panel above the button on a desktop, the whole screen on a phone.
 * Escape closes it and focus goes back to the button.
 * ────────────────────────────────────────────────────────────────── */

const STORE = 'remvo.chat';

/* The strip at the bottom of a phone screen the round button covers:
 * 56px button, 16px margin, and room for the safe area. */
const STRIP = 104;

/* True while any [data-chat-clear] element (the pricing Top up buttons)
 * is in that strip, on a phone. The button steps aside rather than sit
 * on a button the visitor is about to press. Desktop never needs it:
 * the pill sits in the margin beside the content. */
function useStepAside(pathname) {
  const [aside, setAside] = useState(false);
  useEffect(() => {
    const phone = window.matchMedia('(max-width: 559px)');
    if (typeof IntersectionObserver === 'undefined') return undefined;
    let io = null;
    const under = new Set();
    const watch = () => {
      io?.disconnect();
      io = null;
      under.clear();
      setAside(false);
      const targets = document.querySelectorAll('[data-chat-clear]');
      if (!phone.matches || targets.length === 0) return;
      io = new IntersectionObserver((entries) => {
        for (const e of entries) { if (e.isIntersecting) under.add(e.target); else under.delete(e.target); }
        setAside(under.size > 0);
      }, { rootMargin: `-${Math.max(0, window.innerHeight - STRIP)}px 0px 0px 0px` });
      targets.forEach((t) => io.observe(t));
    };
    watch();
    phone.addEventListener('change', watch);
    window.addEventListener('resize', watch);
    return () => { io?.disconnect(); phone.removeEventListener('change', watch); window.removeEventListener('resize', watch); };
  }, [pathname]);
  return aside;
}
const read = () => { try { return JSON.parse(localStorage.getItem(STORE) ?? 'null'); } catch { return null; } };
const keep = (v) => { try { if (v) localStorage.setItem(STORE, JSON.stringify(v)); else localStorage.removeItem(STORE); } catch { /* private mode */ } };

export function SiteChat() {
  const location = useLocation();
  const [saved, setSaved] = useState(read);
  const [open, setOpen] = useState(false);
  const launcher = useRef(null);
  const panel = useRef(null);
  const titleId = useId();
  const aside = useStepAside(location.pathname);

  // A reply email's link: take the chat, open it, tidy the address.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('chat');
    if (!v) return;
    const [id, key] = v.split('.');
    if (/^cnv_[A-Za-z0-9]{20}$/.test(id ?? '') && key) {
      const next = { ...(read() ?? {}), id, key };
      keep(next);
      setSaved(next);
      setOpen(true);
    }
    params.delete('chat');
    const q = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${q ? `?${q}` : ''}${window.location.hash}`);
  }, []);

  const load = useCallback(({ after, open: isOpen }) => siteChat.read(saved.id, saved.key, { after, open: isOpen }).then((r) => r.chat), [saved]);
  const send = useCallback((text) => siteChat.write(saved.id, saved.key, text).then((r) => r.chat), [saved]);
  const chat = useChat({ load, send, open, enabled: Boolean(saved?.id) });

  // A key that no longer opens anything (an old browser copy): start again.
  useEffect(() => {
    if (chat.error?.status === 404) { keep(null); setSaved(null); chat.reset(); }
  }, [chat.error]);

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => launcher.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    document.addEventListener('keydown', onKey);
    // The page behind does not scroll under a full-screen chat on a phone.
    const phone = window.matchMedia('(max-width: 559px)').matches;
    const before = document.body.style.overflow;
    if (phone) document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => panel.current?.querySelector('input, textarea')?.focus({ preventScroll: true }));
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = before; };
  }, [open, close]);

  return (
    <div className={`${theme.theme} ${s.root}`}>
      {open && (
        <section ref={panel} className={s.panel} role="dialog" aria-modal="false" aria-labelledby={titleId}>
          <header className={s.head}>
            <span className={s.mark} aria-hidden="true"><IconChat size={20} /></span>
            <span className={s.headText}>
              <h2 id={titleId} className={s.title}>Chat with Remvo</h2>
              <span className={s.sub}>A person answers, usually within a few hours.</span>
            </span>
            <button type="button" className={s.close} onClick={close} aria-label="Close chat"><IconClose size={20} /></button>
          </header>
          {saved?.id ? (
            <ChatThread
              messages={chat.messages}
              onSend={chat.post}
              autoFocus
              footnote={saved.email ? `If you leave, the reply goes to ${saved.email}.` : 'If you leave, the reply comes by email.'}
            />
          ) : (
            <StartForm
              page={location.pathname}
              onStarted={(out, email) => {
                const next = { id: out.chat.id, key: out.key, email };
                keep(next);
                setSaved(next);
              }}
            />
          )}
        </section>
      )}

      <button
        ref={launcher}
        type="button"
        className={`${s.launcher} ${open ? s.launcherOpen : ''} ${aside && !open ? s.launcherAside : ''}`}
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-label={open ? 'Close chat' : chat.unread ? `Chat with Remvo, ${chat.unread} new` : 'Chat with Remvo'}
      >
        {open ? <IconClose size={22} /> : <IconChat size={24} />}
        <span className={s.launcherText} aria-hidden="true">{open ? 'Close' : 'Chat'}</span>
        {!open && chat.unread > 0 && <span className={s.badge} aria-hidden="true">{chat.unread}</span>}
      </button>
    </div>
  );
}

function StartForm({ page, onStarted }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [trap, setTrap] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ids = { email: useId(), name: useId(), message: useId(), error: useId() };

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const em = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setError('Enter an email we can reply to.'); return; }
    if (!message.trim()) { setError('Write your message first.'); return; }
    setBusy(true);
    setError('');
    try {
      const out = await siteChat.start({ email: em, ...(name.trim() ? { name: name.trim() } : {}), message: message.trim(), page, website: trap });
      onStarted(out, em.toLowerCase());
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form className={s.form} onSubmit={submit} noValidate>
      <p className={s.lead}>Questions about Remvo, a listing that went wrong, or something you would like built. Leave your email so we can answer even if you close this page.</p>
      <label className={s.label} htmlFor={ids.email}>Email</label>
      <input id={ids.email} className={s.input} type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required aria-describedby={error ? ids.error : undefined} />
      <label className={s.label} htmlFor={ids.name}>Name <span className={s.optional}>optional</span></label>
      <input id={ids.name} className={s.input} type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
      <label className={s.label} htmlFor={ids.message}>Message</label>
      <textarea id={ids.message} className={`${s.input} ${s.area}`} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={4000} required />
      {/* Hidden from people; a bot that fills it is turned away. */}
      <input className={s.trap} type="text" name="website" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} aria-hidden="true" />
      {error && <p id={ids.error} className={s.error} role="alert">{error}</p>}
      <button type="submit" className={s.start} disabled={busy}>{busy ? 'Sending' : 'Start chat'}</button>
      <p className={s.small}>We use your email only to answer you. <Link to={ROUTES.PRIVACY}>Privacy policy</Link></p>
    </form>
  );
}
