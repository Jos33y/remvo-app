/* ──────────────────────────────────────────────────────────────────
 * lib/worldRows.js (world2)
 *
 * One product listed on several eBay sites is one row in Listings and
 * on Home, the way a bulk run is one card: it opens the comparison,
 * where each site's listing is a tap away. A row goes where its newest
 * site would have been. A product on one site only is an ordinary row.
 * ────────────────────────────────────────────────────────────────── */

import { MARKETPLACES } from '@lib/market';

const ORDER = Object.fromEntries(MARKETPLACES.map((m, i) => [m.id, i]));

/** @returns {Array<{ kind: 'job', job: object } | { kind: 'world', id: string, jobs: object[] }>} */
export function withWorlds(jobs) {
  const worlds = new Map();
  for (const j of jobs) if (j.worldId) worlds.set(j.worldId, [...(worlds.get(j.worldId) ?? []), j]);
  const placed = new Set();
  const out = [];
  for (const j of jobs) {
    const group = j.worldId ? worlds.get(j.worldId) : null;
    if (!group || group.length < 2) { out.push({ kind: 'job', job: j }); continue; }
    if (placed.has(j.worldId)) continue;
    placed.add(j.worldId);
    out.push({ kind: 'world', id: j.worldId, jobs: [...group].sort((a, b) => (ORDER[a.marketplace] ?? 9) - (ORDER[b.marketplace] ?? 9)) });
  }
  return out;
}

/** One status for the row: still being made, then ready if any site is, else failed. */
export function worldStatus(jobs) {
  if (jobs.some((j) => j.status === 'running')) return 'running';
  if (jobs.some((j) => j.status === 'queued')) return 'queued';
  return jobs.some((j) => j.status === 'ready') ? 'ready' : 'failed';
}
