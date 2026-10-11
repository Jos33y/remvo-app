import { useCallback, useEffect } from 'react';
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
 * gone. It covers the tabs, as a compose screen does, so the box to
 * write in sits where a thumb is.
 * ────────────────────────────────────────────────────────────────── */

export function SupportPage() {
  const { account } = useSellerSession();
  const load = useCallback(({ after, open }) => appChat.read({ after, open }).then((r) => r.chat), []);
  const send = useCallback((text) => appChat.write(text, SELLER_ROUTES.SUPPORT).then((r) => r.chat), []);
  const chat = useChat({ load, send, open: true });

  useEffect(() => { document.title = 'Remvo | Support'; }, []);

  const intro = (
    <div className={s.intro}>
      <p className={s.introTitle}>Ask us anything</p>
      <p className={s.introText}>
        A listing that went wrong, a question about credits, or something you would like built. A person answers,
        usually within a few hours.
      </p>
    </div>
  );

  return (
    <>
      <PageHeader title="Support" back={SELLER_ROUTES.PROFILE} backLabel="Profile" large={false} />
      <div className={s.page}>
        {chat.error && chat.error.status !== 404 && !chat.messages.length ? (
          <p className={s.notice} role="alert">{chat.error.message}</p>
        ) : null}
        <ChatThread
          messages={chat.messages}
          onSend={chat.post}
          intro={chat.ready && !chat.messages.length ? intro : null}
          autoFocus
          footnote={account?.email ? `Replies also go to ${account.email} if you are not here.` : null}
        />
      </div>
    </>
  );
}
