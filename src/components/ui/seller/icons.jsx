/* ──────────────────────────────────────────────────────────────────
 * Seller app icons. One set, one geometry: 24 viewBox, 1.6 stroke,
 * round caps, drawn to sit on the text baseline at 20 to 24px. The
 * tab icons have a filled variant for the selected tab, as iOS does,
 * so selection never relies on colour alone.
 * ────────────────────────────────────────────────────────────────── */

const base = (size) => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: 'false',
});

export const IconHome = ({ size = 24, filled = false }) => (
  <svg {...base(size)}>
    <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" fill={filled ? 'currentColor' : 'none'} />
  </svg>
);

export const IconListings = ({ size = 24, filled = false }) => (
  <svg {...base(size)}>
    <rect x="4" y="3.5" width="16" height="17" rx="2.5" fill={filled ? 'currentColor' : 'none'} />
    <path d="M8 8.5h8M8 12h8M8 15.5h5" stroke={filled ? 'var(--app-bg, #fff)' : 'currentColor'} />
  </svg>
);

export const IconCredits = ({ size = 24, filled = false }) => (
  <svg {...base(size)}>
    <rect x="3" y="6" width="18" height="13" rx="2.5" fill={filled ? 'currentColor' : 'none'} />
    <path d="M3 10h18" stroke={filled ? 'var(--app-bg, #fff)' : 'currentColor'} />
    <path d="M6 4.5h12" />
  </svg>
);

export const IconProfile = ({ size = 24, filled = false }) => (
  <svg {...base(size)}>
    <circle cx="12" cy="8.5" r="4" fill={filled ? 'currentColor' : 'none'} />
    <path d="M4.5 20c.9-3.6 3.9-5.5 7.5-5.5s6.6 1.9 7.5 5.5" fill={filled ? 'currentColor' : 'none'} />
  </svg>
);

export const IconPlus = ({ size = 24 }) => (<svg {...base(size)}><path d="M12 5v14M5 12h14" /></svg>);
export const IconChevronRight = ({ size = 20 }) => (<svg {...base(size)}><path d="m9.5 6 6 6-6 6" /></svg>);
export const IconChevronLeft = ({ size = 24 }) => (<svg {...base(size)}><path d="m14.5 6-6 6 6 6" /></svg>);
export const IconClose = ({ size = 22 }) => (<svg {...base(size)}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const IconCopy = ({ size = 20 }) => (<svg {...base(size)}><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" /></svg>);
export const IconCheck = ({ size = 20 }) => (<svg {...base(size)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>);
export const IconDownload = ({ size = 20 }) => (<svg {...base(size)}><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" /></svg>);
export const IconTrash = ({ size = 20 }) => (<svg {...base(size)}><path d="M5 7h14M10 7V5h4v2M7 7l.8 12a1 1 0 0 0 1 .9h6.4a1 1 0 0 0 1-.9L17 7" /></svg>);
export const IconBarcode = ({ size = 20 }) => (<svg {...base(size)}><path d="M4 6v12M7 6v12M10.5 6v12M13 6v12M16.5 6v12M20 6v12" /></svg>);
export const IconLink = ({ size = 20 }) => (<svg {...base(size)}><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" /><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" /></svg>);
export const IconAlert = ({ size = 20 }) => (<svg {...base(size)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5.5M12 16.2v.1" /></svg>);
export const IconMail = ({ size = 20 }) => (<svg {...base(size)}><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></svg>);
export const IconExternal = ({ size = 16 }) => (<svg {...base(size)}><path d="M14 5h5v5M19 5l-8 8M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4" /></svg>);
