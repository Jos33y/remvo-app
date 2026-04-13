import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Wraps navigator.clipboard with state for "copied" feedback.
 *
 * Falls back to document.execCommand('copy') for browsers without
 * the async clipboard API or when the page is not in a secure
 * context. The fallback covers older Android browsers which still
 * appear in Nigerian traffic.
 *
 * @param {object} [options]
 * @param {number} [options.resetMs=2000] - How long the copied flag stays true after a copy
 * @returns {{
 *   copy: (text: string) => Promise<boolean>,
 *   copied: boolean,
 *   error: Error | null,
 * }}
 */
export function useClipboard({ resetMs = 2000 } = {}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  /* Cleanup timer on unmount so a stale setState never fires */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      try {
        const value = String(text);

        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(value);
        } else {
          // Fallback for non-secure contexts and older browsers
          const textarea = document.createElement('textarea');
          textarea.value = value;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'absolute';
          textarea.style.left = '-9999px';
          textarea.style.top = '0';
          document.body.appendChild(textarea);

          const selection = document.getSelection();
          const previousRange =
            selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

          textarea.select();
          const ok = document.execCommand('copy');
          document.body.removeChild(textarea);

          // Restore prior selection so we don't disturb the user's text selection
          if (previousRange && selection) {
            selection.removeAllRanges();
            selection.addRange(previousRange);
          }

          if (!ok) throw new Error('execCommand copy failed');
        }

        setCopied(true);
        setError(null);
        timerRef.current = setTimeout(() => {
          setCopied(false);
          timerRef.current = null;
        }, resetMs);

        return true;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setCopied(false);
        return false;
      }
    },
    [resetMs]
  );

  return { copy, copied, error };
}
