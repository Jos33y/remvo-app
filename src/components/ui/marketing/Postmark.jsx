/* A postmark, drawn in Remvo's postage world: words round the top and
 * bottom of a double ring, the day in the middle. Decoration only (the
 * words it carries are also in the page's text), so it is hidden from
 * screen readers. The ink is currentColor. */

import { useId } from 'react';

export function Postmark({ top, bottom, iso, className = '' }) {
  const id = `pm${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const d = new Date(`${iso}T12:00:00Z`);
  const day = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).toUpperCase();
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <path id={`${id}t`} d="M 18 60 A 42 42 0 0 1 102 60" />
        <path id={`${id}b`} d="M 14 60 A 46 46 0 0 0 106 60" />
      </defs>
      <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <text fontFamily="var(--font-mono)" fontSize="11" fontWeight="600" letterSpacing="2" fill="currentColor">
        <textPath href={`#${id}t`} startOffset="50%" textAnchor="middle">{top}</textPath>
      </text>
      <text fontFamily="var(--font-mono)" fontSize="11" fontWeight="600" letterSpacing="3" fill="currentColor">
        <textPath href={`#${id}b`} startOffset="50%" textAnchor="middle">{bottom}</textPath>
      </text>
      <text x="60" y="58" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" fontWeight="600" fill="currentColor">{day}</text>
      <text x="60" y="72" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="currentColor">{d.getUTCFullYear()}</text>
    </svg>
  );
}
