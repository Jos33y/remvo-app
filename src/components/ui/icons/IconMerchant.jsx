/* IconMerchant | storefront silhouette per PRIMITIVES section 07.
 * Awning above, single door below. Matches IconCheck conventions. */
export function IconMerchant({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" focusable="false">
      <path d="M 3 9 L 5 5 H 19 L 21 9" />
      <path d="M 4 9 V 20 H 20 V 9" />
      <path d="M 10 20 V 13 H 14 V 20" />
    </svg>
  );
}
