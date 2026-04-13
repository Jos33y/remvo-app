import { createContext, useContext } from 'react';

export const SessionContext = createContext(null);

/**
 * Read the current session and helpers from any component inside
 * a SessionProvider tree.
 *
 * @returns {{
 *   session: object | null,
 *   mockConfirmPayment: () => void,
 *   mockExpireSession: () => void,
 *   mockResetSession: () => void,
 *   startPaymentWindow: () => void,
 *   mockSelectAmount: (amountUsd: number) => void,
 *   mockResetToSelectMode: () => void,
 * }}
 */
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}
