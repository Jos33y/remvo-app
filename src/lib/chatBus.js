/* ──────────────────────────────────────────────────────────────────
 * lib/chatBus.js (chat3)
 *
 * Any button on remvo.app can open the chat: with how the visitor
 * sells already chosen, or with a hint for the message box ("Roughly
 * how many do you list a month?"). The chat (SiteChat) listens.
 * ────────────────────────────────────────────────────────────────── */

export const CHAT_EVENT = 'remvo:chat';

/** @param {{ path?: string, hint?: string }} [what] */
export function openChat(what = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CHAT_EVENT, { detail: what }));
}
