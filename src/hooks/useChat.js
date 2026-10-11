import { useCallback, useEffect, useRef, useState } from 'react';

/* ──────────────────────────────────────────────────────────────────
 * useChat()
 *
 * One conversation, kept in step with the API by polling: every 3
 * seconds while it is on screen, every 30 while it is not (enough for
 * an unread badge), and not at all when the tab is hidden. A message
 * the visitor sends shows at once and is marked sent when the API has
 * it; if it fails it stays, marked, with the reason, so nothing typed
 * is ever lost.
 *
 *   load({ after, open }) -> chat | null    (chat: { id, ref, status, unread, messages })
 *   send(text)            -> chat           (the conversation, with the message just sent)
 * ────────────────────────────────────────────────────────────────── */

const OPEN_MS = 3000;
const CLOSED_MS = 30_000;

export function useChat({ load, send, open, enabled = true }) {
  const [messages, setMessages] = useState([]);
  const [chat, setChat] = useState(null);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const last = useRef('0');
  const busy = useRef(false);
  const live = useRef(true);

  const merge = useCallback((incoming) => {
    if (!incoming?.length) return;
    setMessages((prev) => {
      const byId = new Map(prev.filter((m) => !m.local || m.failed).map((m) => [m.id, m]));
      // Our own pending copies are replaced by what the API kept.
      const sentBodies = new Set(incoming.filter((m) => m.from === 'you').map((m) => m.body));
      for (const m of prev) if (m.local && !m.failed && !sentBodies.has(m.body)) byId.set(m.id, m);
      for (const m of incoming) byId.set(m.id, m);
      return [...byId.values()].sort((a, b) => (a.local === b.local ? (a.local ? 0 : BigInt(a.id) < BigInt(b.id) ? -1 : 1) : a.local ? 1 : -1));
    });
    const top = incoming.reduce((a, m) => (BigInt(m.id) > BigInt(a) ? m.id : a), last.current);
    last.current = top;
  }, []);

  const poll = useCallback(async () => {
    if (busy.current || !enabled) return;
    busy.current = true;
    try {
      const c = await load({ after: last.current, open });
      if (!live.current) return;
      if (c) {
        setChat({ id: c.id, ref: c.ref, status: c.status });
        merge(c.messages);
        setUnread(open ? 0 : c.unread);
      }
      setError(null);
      setReady(true);
    } catch (err) {
      if (live.current) { setError(err); setReady(true); }
    } finally {
      busy.current = false;
    }
  }, [load, open, enabled, merge]);

  useEffect(() => {
    live.current = true;
    return () => { live.current = false; };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    poll();
    const t = setInterval(() => { if (document.visibilityState === 'visible') poll(); }, open ? OPEN_MS : CLOSED_MS);
    const onShow = () => { if (document.visibilityState === 'visible') poll(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onShow); };
  }, [poll, open, enabled]);

  const post = useCallback(async (text, retryId = null) => {
    const id = retryId ?? `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const mine = { id, from: 'you', body: text, at: new Date().toISOString(), local: true };
    setMessages((prev) => [...prev.filter((m) => m.id !== id), mine]);
    try {
      const c = await send(text);
      setChat({ id: c.id, ref: c.ref, status: c.status });
      setMessages((prev) => prev.filter((m) => m.id !== id));
      merge(c.messages);
      setError(null);
      return c;
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, failed: err.message || 'Not sent.' } : m)));
      throw err;
    }
  }, [send, merge]);

  const reset = useCallback(() => {
    setMessages([]); setChat(null); setUnread(0); last.current = '0';
  }, []);

  return { chat, messages, unread, error, ready, post, poll, reset };
}
