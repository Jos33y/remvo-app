/* ──────────────────────────────────────────────────────────────────
 * CountryFlag
 *
 * ISO-3166-1 alpha-2 → SVG flag. Ships with the 8 countries GE-AS
 * serves at launch plus a neutral globe fallback for unknown codes.
 *
 * Each flag is hand-authored at a 4:3 aspect ratio (default 32×24).
 * Geometry is intentionally simplified — at 24px tall a screen
 * cannot resolve seal details, coat-of-arms text, or fine star
 * geometry; what matters is the colour band layout and any bold
 * central device. This keeps the component lean, avoids external
 * dependencies, and renders crisply on any retina or subpixel grid.
 *
 * On the obsidian canvas the wrapper applies saturate(0.85) so the
 * flag sits politely with the two-tone palette (gold + white) rather
 * than shouting for attention. The reduction is subtle; colours stay
 * true enough for the flag to read as itself.
 *
 * Supported codes:
 *   NG  Nigeria
 *   GH  Ghana
 *   KE  Kenya
 *   UG  Uganda
 *   TZ  Tanzania
 *   ZA  South Africa
 *   EG  Egypt
 *   CI  Ivory Coast (Côte d'Ivoire)
 *
 * Unknown codes render a neutral globe glyph. The component never
 * throws; it always returns a valid SVG.
 *
 * @param {{
 *   code?: string,
 *   size?: number,
 *   title?: string,
 *   className?: string
 * }} props
 * ────────────────────────────────────────────────────────────────── */

export function CountryFlag({ code, size = 24, title, className }) {
  const width = Math.round((size * 4) / 3);
  const height = size;
  const normalised = typeof code === 'string' ? code.trim().toUpperCase() : '';
  const labelId = title ? `flag-${normalised || 'unknown'}-title` : undefined;

  const wrapperProps = {
    width,
    height,
    viewBox: '0 0 36 24',
    className,
    xmlns: 'http://www.w3.org/2000/svg',
    role: title ? 'img' : 'presentation',
    ...(title ? { 'aria-labelledby': labelId } : { 'aria-hidden': 'true' }),
    focusable: 'false',
  };

  const titleNode = title ? <title id={labelId}>{title}</title> : null;

  switch (normalised) {
    /* ── Nigeria ────────────────────────────────────────────────── */
    case 'NG':
      return (
        <svg {...wrapperProps}>
          {titleNode}
          <rect width="36" height="24" fill="#008751" />
          <rect x="12" width="12" height="24" fill="#FFFFFF" />
        </svg>
      );

    /* ── Ghana ──────────────────────────────────────────────────── */
    case 'GH':
      return (
        <svg {...wrapperProps}>
          {titleNode}
          <rect width="36" height="8" fill="#CE1126" />
          <rect y="8" width="36" height="8" fill="#FCD116" />
          <rect y="16" width="36" height="8" fill="#006B3F" />
          <polygon
            points="18,9.5 18.9,12.3 21.8,12.3 19.5,14.1 20.3,16.9 18,15.2 15.7,16.9 16.5,14.1 14.2,12.3 17.1,12.3"
            fill="#000000"
          />
        </svg>
      );

    /* ── Kenya ──────────────────────────────────────────────────── */
    case 'KE':
      return (
        <svg {...wrapperProps}>
          {titleNode}
          <rect width="36" height="24" fill="#FFFFFF" />
          <rect width="36" height="7" fill="#000000" />
          <rect y="7" width="36" height="2" fill="#FFFFFF" />
          <rect y="9" width="36" height="6" fill="#BB0000" />
          <rect y="15" width="36" height="2" fill="#FFFFFF" />
          <rect y="17" width="36" height="7" fill="#006600" />
          <ellipse cx="18" cy="12" rx="3" ry="5" fill="#BB0000" />
          <ellipse cx="18" cy="12" rx="1.5" ry="5" fill="#000000" opacity="0.4" />
        </svg>
      );

    /* ── Uganda ─────────────────────────────────────────────────── */
    case 'UG':
      return (
        <svg {...wrapperProps}>
          {titleNode}
          <rect width="36" height="4" fill="#000000" />
          <rect y="4" width="36" height="4" fill="#FCDC04" />
          <rect y="8" width="36" height="4" fill="#D90000" />
          <rect y="12" width="36" height="4" fill="#000000" />
          <rect y="16" width="36" height="4" fill="#FCDC04" />
          <rect y="20" width="36" height="4" fill="#D90000" />
          <circle cx="18" cy="12" r="3.5" fill="#FFFFFF" />
          <circle cx="18" cy="12" r="1.2" fill="#D90000" />
        </svg>
      );

    /* ── Tanzania ───────────────────────────────────────────────── */
    case 'TZ':
      return (
        <svg {...wrapperProps}>
          {titleNode}
          <rect width="36" height="24" fill="#1EB53A" />
          <polygon points="0,24 36,0 36,24" fill="#00A3DD" />
          <polygon points="0,20 0,24 4,24" fill="#00A3DD" />
          <polygon points="32,0 36,0 36,4" fill="#1EB53A" />
          <polygon points="0,24 4,24 36,0 32,0" fill="#000000" />
          <polygon points="-1,23 3,23 35,-1 31,-1" fill="#FCD116" opacity="0.001" />
          <polygon points="0.5,22.5 2.5,22.5 35.5,-0.5 33.5,-0.5" fill="#FCD116" />
        </svg>
      );

    /* ── South Africa ───────────────────────────────────────────── */
    case 'ZA':
      return (
        <svg {...wrapperProps}>
          {titleNode}
          <rect width="36" height="24" fill="#FFFFFF" />
          <rect width="36" height="8" fill="#DE3831" />
          <rect y="16" width="36" height="8" fill="#002395" />
          <rect y="8" width="36" height="8" fill="#FFFFFF" />
          <polygon points="0,0 15,12 0,24" fill="#007A4D" />
          <polygon points="0,0 12,12 0,24 -1,24 -1,0" fill="#000000" />
          <polygon points="0,3 10,12 0,21" fill="#FFB612" />
          <polygon points="0,5 8,12 0,19" fill="#007A4D" />
        </svg>
      );

    /* ── Egypt ──────────────────────────────────────────────────── */
    case 'EG':
      return (
        <svg {...wrapperProps}>
          {titleNode}
          <rect width="36" height="8" fill="#CE1126" />
          <rect y="8" width="36" height="8" fill="#FFFFFF" />
          <rect y="16" width="36" height="8" fill="#000000" />
          <path
            d="M 17 10.5 L 19 10.5 L 19.5 12 L 18 13.5 L 16.5 12 Z"
            fill="#C09300"
          />
        </svg>
      );

    /* ── Ivory Coast (Côte d'Ivoire) ────────────────────────────── */
    case 'CI':
      return (
        <svg {...wrapperProps}>
          {titleNode}
          <rect width="12" height="24" fill="#F77F00" />
          <rect x="12" width="12" height="24" fill="#FFFFFF" />
          <rect x="24" width="12" height="24" fill="#009E60" />
        </svg>
      );

    /* ── Fallback: neutral globe ─────────────────────────────────
     * Unknown country code. Renders a simple globe so the slot is
     * visually filled without implying a specific place. */
    default:
      return (
        <svg {...wrapperProps}>
          {titleNode}
          <rect width="36" height="24" fill="#1A1A1A" />
          <circle cx="18" cy="12" r="7" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <ellipse cx="18" cy="12" rx="3" ry="7" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <line x1="11" y1="12" x2="25" y2="12" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        </svg>
      );
  }
}
