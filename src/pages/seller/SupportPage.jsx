import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { ChatThread } from '@components/ui/support/ChatThread';
import { useSellerSession } from '@context/SellerSession';
import { useChat } from '@hooks/useChat';
import { appChat } from '@lib/supportApi';
import { SELLER_ROUTES } from '@utils/constants';
import s from '@styles/pages/seller/support.module.css';

/* ──────────────────────────────────────────────────────────────────
 * Support, /support
 *
 * A conversation with Remvo, answered by a person from Telegram. The
 * seller's account is who they are, so there is nothing to fill in:
 * they write, and the reply appears here, or by email if they have
 * gone. A tab of its own, so a way to reach a person is never more
 * than one tap away; the box to write in sits just above the tabs.
 *
 * Before the first message: a postbox, in lapis (information), and the
 * four things sellers write about, each a tap that starts the message
 * in the box without sending it, so the seller only adds the detail.
 * ────────────────────────────────────────────────────────────────── */

const TOPICS = [
  { label: 'A listing went wrong', start: 'A listing went wrong: ' },
  { label: 'Credits or a payment', start: 'About credits or a payment: ' },
  { label: 'Bulk listing', start: 'About bulk listing: ' },
  { label: 'Something to build', start: 'I would like Remvo to ' },
];

function Postbox() {
  return (
    <svg className={s.postbox} viewBox="0 0 160 150" aria-hidden="true" focusable="false">
      {/* The box: an isometric pillar, three faces */}
      <path d="M80 18 L124 38 L80 58 L36 38 Z" fill="currentColor" opacity="0.5" />
      <path d="M36 38 L80 58 L80 132 L36 112 Z" fill="currentColor" opacity="0.26" />
      <path d="M124 38 L80 58 L80 132 L124 112 Z" fill="currentColor" opacity="0.14" />
      {/* The slot, and a letter going in */}
      <path d="M46 62 L72 74 L72 80 L46 68 Z" fill="var(--night-0)" opacity="0.9" />
      <path d="M50 52 L74 63 L74 73 L50 62 Z" fill="var(--ivory)" />
      <path d="M50 52 L62 63 L74 63" fill="none" stroke="var(--night-0)" strokeWidth="1.2" opacity="0.35" />
    </svg>
  );
}

export function SupportPage() {
  const { account } = useSellerSession();
  const load = useCallback(({ after, open }) => appChat.read({ after, open }).then((r) => r.chat), []);
  const send = useCallback((text) => appChat.write(text, SELLER_ROUTES.SUPPORT).then((r) => r.chat), []);
  const chat = useChat({ load, send, open: true });
  const [seed, setSeed] = useState(null);

  useEffect(() => { document.title = 'Remvo | Support'; }, []);

  const intro = (
    <div className={s.intro}>
      <Postbox />
      <h2 className={s.introTitle}>Ask us anything</h2>
      <p className={s.introText}>A person answers, usually within a few hours. Start with one of these, or just write.</p>
      <ul className={s.topics} role="list">
        {TOPICS.map((t) => (
          <li key={t.label}>
            <button type="button" className={s.topic} onClick={() => setSeed({ text: t.start, key: Date.now() })}>{t.label}</button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
      <PageHeader title="Support" large={false} />
      <div className={s.page}>
        {chat.error && chat.error.status !== 404 && !chat.messages.length ? (
          <p className={s.notice} role="alert">{chat.error.message}</p>
        ) : null}
        <ChatThread
          messages={chat.messages}
          onSend={chat.post}
          intro={chat.ready && !chat.messages.length ? intro : null}
          autoFocus
          seed={seed}
          footnote={account?.email ? `Replies also go to ${account.email} if you are not here.` : null}
        />
      </div>
    </>
  );
}
