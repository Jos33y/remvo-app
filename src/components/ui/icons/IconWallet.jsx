/* IconWallet | wallet pouch with clasp button. Used in WalletBalance widget
 * and any screen referencing the hot wallet state. */
export function IconWallet({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" focusable="false">
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13a1.5 1.5 0 0 1 1.5 1.5V8" />
      <path d="M3 7.5V17a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1V10a1 1 0 0 0-1-1H5a2 2 0 0 1-2-1.5z" />
      <circle cx="17" cy="14" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}
