/* ──────────────────────────────────────────────────────────────────
 * lib/sellPaths.js (chat3)
 *
 * "Tell us how you sell": one tap to say who they are, so the first
 * reply fits them. The ids are the API's (support/service.js PATHS);
 * the words are the seller's own, never a guess at what is wrong.
 * Each sets the message box's hint to the one thing worth saying.
 * ────────────────────────────────────────────────────────────────── */

export const SELL_PATHS = Object.freeze([
  { id: 'thinking', label: "I'm thinking of selling on eBay", hint: 'What would you like to sell?' },
  { id: 'new', label: "I'm new to selling", hint: 'What do you sell, and what takes the time?' },
  { id: 'few', label: 'I list a few things a week', hint: 'What do you sell most?' },
  { id: 'bulk', label: 'I list in bulk: pallets, wholesale, returns', hint: 'Roughly how many a month, and what kind of stock?' },
  { id: 'established', label: "I'm an established seller", hint: 'Your eBay store name, and what you would like a second look at.' },
  { id: 'multi', label: 'I sell on more than eBay, or have my own shop', hint: 'Where else you sell, and what you would like in one place.' },
  { id: 'dropped', label: 'My sales have dropped', hint: 'Your eBay store name or a listing link. We never ask for your eBay password.' },
  { id: 'other', label: 'Something else', hint: 'Your question.' },
]);

export const pathById = (id) => SELL_PATHS.find((p) => p.id === id) ?? null;
