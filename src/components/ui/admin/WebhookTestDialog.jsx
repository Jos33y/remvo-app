import { useEffect, useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { IconCheck } from '@components/ui/icons/IconCheck';
import { IconAlert } from '@components/ui/icons/IconAlert';
import styles from '@styles/ui/admin/webhook-test-dialog.module.css';

/* ──────────────────────────────────────────────────────────────────
 * WebhookTestDialog
 *
 * Fire a synthetic webhook.test payload at the platform's webhook
 * URL. Returns status + latency + body preview. No state mutation,
 * no audit. Pure connectivity probe.
 *
 * Three result tiers:
 *   ok  | 2xx response, body shown if short
 *   warn | non-2xx response (3xx/4xx/5xx); body shown for debugging
 *   error | network failure / timeout / no response
 *
 * Auto-fires on dialog open. Operator can re-run via Retry button.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   webhookUrl: string,
 *   onTest: () => Promise<{
 *     ok: boolean, status: number, latency_ms: number,
 *     body_preview: string, error: string|null
 *   }>,
 * }} props
 * ────────────────────────────────────────────────────────────────── */

export function WebhookTestDialog({ isOpen, onClose, webhookUrl, onTest }) {
  const [state, setState] = useState({ phase: 'idle', result: null, error: null });

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    setState({ phase: 'running', result: null, error: null });
    onTest()
      .then((result) => {
        if (cancelled) return;
        setState({ phase: 'done', result, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          phase: 'done',
          result: null,
          error: err?.details?.message || err?.message || 'Test failed.',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, onTest]);

  function handleRetry() {
    setState({ phase: 'running', result: null, error: null });
    onTest()
      .then((result) => setState({ phase: 'done', result, error: null }))
      .catch((err) =>
        setState({
          phase: 'done',
          result: null,
          error: err?.details?.message || err?.message || 'Test failed.',
        })
      );
  }

  const r = state.result;
  const tier = !r ? null : r.ok ? 'ok' : r.error || r.status === 0 ? 'error' : 'warn';

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onCancel={onClose}
      onConfirm={onClose}
      title="Webhook test"
      body=""
      confirmLabel="Close"
      cancelLabel={state.phase === 'running' ? '' : 'Retry'}
      confirmVariant="primary"
      isLoading={false}
    >
      <div className={styles.body}>
        <p className={styles.lede}>
          Sends a signed <code className={styles.mono}>webhook.test</code> payload to your configured URL. No state changes.
        </p>

        <div className={styles.urlRow}>
          <span className={styles.urlLabel}>URL</span>
          <code className={styles.url}>{webhookUrl || '(not set)'}</code>
        </div>

        {state.phase === 'running' && (
          <div className={styles.runningBox}>
            <span className={styles.spinner} aria-hidden="true" />
            <span>Sending probe...</span>
          </div>
        )}

        {state.phase === 'done' && state.error && (
          <div className={styles.errorBox} role="alert">
            <IconAlert size={14} />
            <div>
              <strong className={styles.resultTitle}>Test failed</strong>
              <p className={styles.resultBody}>{state.error}</p>
            </div>
          </div>
        )}

        {state.phase === 'done' && r && (
          <div
            className={
              tier === 'ok' ? styles.okBox :
              tier === 'warn' ? styles.warnBox :
              styles.errorBox
            }
            role="status"
          >
            {tier === 'ok' ? <IconCheck size={14} /> : <IconAlert size={14} />}
            <div className={styles.resultBlock}>
              <strong className={styles.resultTitle}>
                {tier === 'ok' && `${r.status} ${statusName(r.status)}`}
                {tier === 'warn' && `${r.status} ${statusName(r.status)}`}
                {tier === 'error' && (r.error || 'No response')}
              </strong>
              <p className={styles.resultBody}>
                Latency: <span className={styles.mono}>{r.latency_ms}ms</span>
              </p>
              {r.body_preview && (
                <pre className={styles.preview}>{r.body_preview}</pre>
              )}
            </div>
          </div>
        )}

        {state.phase === 'done' && (
          <button
            type="button"
            className={styles.retryButton}
            onClick={handleRetry}
          >
            Retry
          </button>
        )}
      </div>
    </ConfirmDialog>
  );
}

function statusName(status) {
  if (status >= 200 && status < 300) return 'OK';
  if (status === 301 || status === 302) return 'Redirect';
  if (status === 400) return 'Bad request';
  if (status === 401) return 'Unauthorized';
  if (status === 403) return 'Forbidden';
  if (status === 404) return 'Not found';
  if (status === 408) return 'Timeout';
  if (status === 429) return 'Rate limited';
  if (status >= 500) return 'Server error';
  return '';
}
