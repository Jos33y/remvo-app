/* ──────────────────────────────────────────────────────────────────
 * The example listing at remvo.app/example
 *
 * A real Remvo listing, stored once: the JBL Flip 6 (barcode
 * 050036384407) made for eBay.com on 15 October 2026, L-SWJA6E, as its
 * download gave it, unedited; the price guide from its listing page.
 * Nothing here is written by hand, and the page makes no API call. To show a newer run, replace this file with
 * that run's output; never edit a field to look better.
 * ────────────────────────────────────────────────────────────────── */

export const EXAMPLE = Object.freeze({
  ref: 'L-SWJA6E',
  madeOn: { label: '15 October 2026', iso: '2026-10-15' },
  input: { kind: 'barcode', value: '050036384407' },
  condition: 'New',
  site: 'eBay.com',
  // The barcode's matches on the product page, as the picker showed them.
  matches: 3,
  title: 'JBL Flip 6 Portable Waterproof Bluetooth Speaker IP67 Dustproof Black New',
  category: {
    path: 'Consumer Electronics > Portable Audio & Headphones > Audio Docks & Mini Speakers',
    id: '111694',
  },
  identifiers: { brand: 'JBL', mpn: 'JBLFLIP6BLKAM', gtin: '050036384407' },
  specifics: [
    ['Brand', 'JBL'],
    ['Model', 'Flip 6'],
    ['Type', 'Portable Speaker System'],
    ['Connectivity', 'Bluetooth'],
    ['Features', 'Waterproof'],
    ['Color', 'Black'],
    ['MPN', 'JBLFLIP6BLKAM'],
    ['Material', 'Plastic'],
    ['Manufacturer Warranty', '1 Year'],
  ],
  parcel: { size: '8 x 4 x 4 in', weight: '2 lb', band: 'USPS Ground Advantage' },
  price: { value: '$85.99', median: '$86.75', listings: 4 },
  description: `The JBL Flip 6 is a portable Bluetooth speaker in black, built to be carried to the pool, park, gym, campsite or around the house.

Key features

- 2-way speaker system with a racetrack-shaped woofer, a separate tweeter and dual passive radiators for deep bass
- IP67 waterproof and dustproof
- Up to 12 hours of playtime on a single charge; 2.5 hours charge time
- PartyBoost lets you pair two JBL PartyBoost-compatible speakers for stereo sound, or link several to fill a party
- Bluetooth connection with a range of about 33 ft (10 meters); touch controls
- 30 watts maximum output power, with Bass Boost
- USB port; stands vertically or horizontally

What's in the box

- 1 x JBL Flip 6 speaker
- 1 x Type-C to Type-A charging cable
- Quick Start Guide
- Safety Instructions
- Warranty Card

Size and weight

- Dimensions: 2.8 in D x 7 in W x 2.6 in H
- Weight: 1.2 lb

Good to know

- Model: JBLFLIP6BLKAM
- Woofer 3 in (7.62 cm); tweeter 1 in (25.4 mm)
- Plastic enclosure
- Limited 1 year manufacturer warranty`,
});

/**
 * The description as blocks, the way the eBay drafts file lays it out:
 * a paragraph, a heading (a short line followed by a list), a list.
 * @returns {Array<{ kind: 'p'|'h'|'ul', text?: string, items?: string[] }>}
 */
export function descriptionBlocks(text) {
  const parts = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return parts.map((p, i) => {
    const lines = p.split('\n');
    if (lines.every((l) => l.startsWith('- '))) return { kind: 'ul', items: lines.map((l) => l.slice(2)) };
    const next = parts[i + 1] ?? '';
    if (lines.length === 1 && next.startsWith('- ') && p.length < 60) return { kind: 'h', text: p };
    return { kind: 'p', text: p };
  });
}
