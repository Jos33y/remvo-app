import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { IconAlert, IconSend } from '@components/ui/seller/icons';
import s from '@styles/ui/support/chat.module.css';

/* ──────────────────────────────────────────────────────────────────
 * ChatThread
 *
 * The conversation and the box to write in, shared by the chat on
 * remvo.app and Support in my.remvo.app. Reads the app's colour
 * variables (--app-*), so it sits right in either, light or dark.
 *
 * Your messages on the right, Remvo's on the left, a time under each
 * run. New replies are announced to screen readers. Enter sends on a
 * keyboard; on a phone Enter is a new line and the button sends.
 * A message that did not send stays, says why, and can be sent again.
 * ────────────────────────────────────────────────────────────────── */

const time = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const day = (iso) => {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = (today - new Date(d).setHours(0, 0, 0, 0)) / 86_400_000;
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
};

const coarse = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

export function ChatThread({ messages, onSend, intro = null, placeholder = 'Write a message', autoFocus = false, disabled = false, footnote = null }) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const boxRef = useRef(null);
  const nearBottom = useRef(true);
  const inputId = useId();

  // Stay at the bottom as messages arrive, unless the reader scrolled up.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && nearBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => { if (autoFocus && !coarse()) boxRef.current?.focus(); }, [autoFocus]);

  // The box grows with what is typed, up to six lines.
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 148)}px`;
  }, [draft]);

  async function submit(e) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || sending || disabled) return;
    setSending(true);
    setDraft('');
    nearBottom.current = true;
    try { await onSend(text); } catch { /* the message shows as not sent */ } finally { setSending(false); }
  }

  async function retry(m) {
    try { await onSend(m.body, m.id); } catch { /* still not sent */ }
  }

  let lastDay = null;
  return (
    <div className={s.thread}>
      <div
        ref={listRef}
        className={s.list}
        onScroll={(e) => { const el = e.currentTarget; nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Conversation"
        tabIndex={0}
      >
        {intro}
        {messages.map((m, i) => {
          const d = day(m.at);
          const showDay = d !== lastDay;
          lastDay = d;
          const next = messages[i + 1];
          const endOfRun = !next || next.from !== m.from || day(next.at) !== d;
          const startOfRun = i === 0 || messages[i - 1].from !== m.from || showDay;
          return (
            <div key={m.id} className={s.item}>
              {showDay && <p className={s.day}>{d}</p>}
              <div className={`${s.row} ${m.from === 'you' ? s.mine : s.theirs}`}>
                {startOfRun && m.from === 'remvo' && <span className={s.who}>Remvo</span>}
                <p className={`${s.bubble} ${m.failed ? s.failedBubble : ''}`}>
                  <span className="sr-only">{m.from === 'you' ? 'You: ' : 'Remvo: '}</span>
                  {m.body}
                </p>
                {m.failed ? (
                  <p className={s.failed}>
                    <IconAlert size={14} /> {m.failed}
                    <button type="button" className={s.retry} onClick={() => retry(m)}>Send again</button>
                  </p>
                ) : endOfRun && (
                  <p className={s.meta}>{m.local ? 'Sending' : time(m.at)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <form className={s.composer} onSubmit={submit}>
        <label htmlFor={inputId} className="sr-only">Message</label>
        <textarea
          ref={boxRef}
          id={inputId}
          className={s.box}
          rows={1}
          value={draft}
          placeholder={placeholder}
          maxLength={4000}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && !coarse()) submit(e);
          }}
          enterKeyHint="send"
        />
        <button type="submit" className={s.send} disabled={!draft.trim() || sending || disabled} aria-label="Send">
          <IconSend size={20} />
        </button>
      </form>
      {footnote && <p className={s.footnote}>{footnote}</p>}
    </div>
  );
}
