import { useEffect, useRef, useState } from 'react';
import { appChat } from '@lib/supportApi';

/* ──────────────────────────────────────────────────────────────────
 * useSupportUnread()
 *
 * How many replies from Remvo the seller has not seen, for the dot on
 * the Support tab. Asked every 30 seconds while the tab is visible,
 * only for messages newer than the last one seen here, and not at all
 * while the Support screen is open (that screen marks them seen).
 * ────────────────────────────────────────────────────────────────── */

const EVERY_MS = 30_000;

export function useSupportUnread({ enabled, onSupport }) {
  const [unread, setUnread] = useState(0);
  const last = useRef('0');

  useEffect(() => {
    if (!enabled) return undefined;
    if (onSupport) { setUnread(0); return undefined; }
    let live = true;
    const check = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const { chat } = await appChat.read({ after: last.current, open: false });
        if (!live || !chat) return;
        for (const m of chat.messages) if (BigInt(m.id) > BigInt(last.current)) last.current = m.id;
        setUnread(chat.unread);
      } catch { /* a missed check is caught by the next one */ }
    };
    check();
    const t = setInterval(check, EVERY_MS);
    document.addEventListener('visibilitychange', check);
    return () => { live = false; clearInterval(t); document.removeEventListener('visibilitychange', check); };
  }, [enabled, onSupport]);

  return unread;
}
