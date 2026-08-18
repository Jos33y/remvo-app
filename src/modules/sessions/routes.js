/* ──────────────────────────────────────────────────────────────────
 * modules/sessions/routes.js
 *
 * Two routes, mounted under /v1:
 *
 *   POST /v1/checkout/initialize
 *     Auth: requirePlatformApiKey
 *     Server-to-server. Platforms call this from their backend when
 *     a user clicks 'deposit'. Returns a session_id, a checkout_url
 *     the platform redirects to, and the locked-in money snapshot.
 *
 *   GET /v1/checkout/session/:id
 *     Auth: NONE | the session id is the capability (144 bits of
 *     entropy, unguessable). Matches Stripe's Checkout Sessions
 *     model. The Remvo frontend polls this every 3s while pending.
 *
 * Response shaping:
 *   - active sessions return the full money snapshot + virtual_account
 *     (Batch 4 ships placeholder virtual_account values; Batch 5 fills
 *     them in from the PSP with NO contract change)
 *   - country_not_active sessions strip the money + virtual_account
 *     fields, surface { reason, country_code, notify_email_enabled,
 *     callback_url, platform_id, platform_name }
 *   - confirmed sessions add confirmed_at
 *
 * Public endpoint policy:
 *   No rate limit on GET /session/:id. Each session is single-user;
 *   spraying one id does nothing useful, and creating many ids
 *   requires hitting POST /initialize which IS platform-authed and
 *   per-platform rate-limited (Batch 17).
 *
 * Related docs:
 *   PHASE_7B_SESSION_INIT_SPEC.md §05 + §06
 * ────────────────────────────────────────────────────────────────── */

import { Router } from 'express';
import { config } from '../../config.js';
import { notFound } from '../../errors/AppError.js';
import { ErrorCodes } from '../../errors/errorCodes.js';
import { sessionInitSchema, parseOrThrow } from '../../lib/validators.js';
import { requirePlatformApiKey } from '../../auth/platformAuth.js';
import * as service from './service.js';
import { RateUnavailableError } from '../rates/priority.js';
import { KoraUnavailableError } from '../kora/client.js';
import * as platformService from '../platforms/service.js';
import { hashIp } from '../../lib/hashIp.js';

export const publicRouter = Router();

// Placeholder virtual_account block used as a safety fallback when
// reading a row that pre-dates a PSP swap (or any future row missing
// virtual_account fields). Live sessions populate these from the
// PSP's bank-transfer charge at init time.
//
// account_name is deliberately NOT 'Remvo'. The beneficiary name is
// whatever the PSP resolves (Paystack returns 'PAYSTACK CHECKOUT')
// and we do not control it. Showing a name the bank app will not
// display is worse than showing that it is unavailable.
const PLACEHOLDER_VIRTUAL_ACCOUNT = Object.freeze({
  account_number: '0000000000',
  bank_name: 'Setup pending',
  account_name: 'Setup pending',
});

// Where the user is redirected after init. The platform's frontend
// builds the URL from the session_id; we just hand it back
// preformatted as a convenience.
const CHECKOUT_BASE_URL = 'https://pay.remvo.app';

// ══════════════════════════════════════════════════════════════════
//  POST /v1/checkout/initialize
// ══════════════════════════════════════════════════════════════════

publicRouter.post(
  '/checkout/initialize',
  requirePlatformApiKey(),
  async (req, res, next) => {
    try {
      const body = parseOrThrow(sessionInitSchema, req.body);
      const platform = req.platform;

      // Production callback_url policy: hostname must match one of
      // the platform's allowed callback hosts. For Batch 4 we read
      // the allowlist from env (GEAS_CALLBACK_HOSTS, set in Batch 1)
      // because the platform_callback_hosts table doesn't ship until
      // Phase 7E. localhost is allowed in dev to keep iteration fast.
      if (config.nodeEnv === 'production') {
        const url = new URL(body.callback_url);
        const allowed = (process.env.GEAS_CALLBACK_HOSTS ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (allowed.length > 0 && !allowed.includes(url.hostname)) {
          // Use validation_failed envelope so the platform sees a
          // clear actionable message, not a generic 403.
          const { badRequest } = await import('../../errors/AppError.js');
          throw badRequest(
            `callback_url hostname "${url.hostname}" is not in the allowlist.`,
            { allowed_hosts: allowed }
          );
        }
      }

      const ipHash = hashIp(req.ip);
      const userAgent = (req.headers['user-agent'] ?? null);

      const { row, isCountryActive } = await service.initSession({
        platform,
        body,
        requestId: req.id,
        ipHash,
        userAgent,
      });

      // Active country: full response with the PSP bank-transfer
      // virtual account values.
      if (isCountryActive) {
        return res.status(200).json({
          session_id: row.id,
          checkout_url: `${CHECKOUT_BASE_URL}/${row.id}`,
          amount_usd: Number(row.amount_usd_credited),
          amount_ngn: Number(row.amount_ngn),
          rate_applied: row.display_rate,
          expires_at: row.expires_at,
          virtual_account: {
            account_number: row.virtual_account_number,
            bank_name: row.virtual_account_bank,
            // Must be the PSP-resolved name, never a constant. This
            // is the beneficiary the user sees in their bank app.
            account_name: row.virtual_account_name,
            expires_at: row.expires_at,
          },
        });
      }

      // country_not_active branch: the spec wants this returned
      // through the same endpoint with status='country_not_active'
      // so the platform's redirect lands on the coming-soon page.
      const countryState = platformService.getCountryState(platform, row.country_code);
      return res.status(200).json({
        status: 'country_not_active',
        session_id: row.id,
        checkout_url: `${CHECKOUT_BASE_URL}/${row.id}`,
        reason: row.country_not_active_reason,
        country_code: row.country_code,
        notify_email_enabled: countryState.notify_email_enabled,
        callback_url: row.callback_url,
        platform_id: platform.id,
        platform_name: platform.name,
        expires_at: row.expires_at,
      });
    } catch (err) {
      if (err instanceof RateUnavailableError) {
        return res.status(503).json({
          error: {
            code: ErrorCodes.RATE_UNAVAILABLE,
            message:
              'Rate engine has no source available. Try again in a few minutes.',
          },
        });
      }
      if (err instanceof KoraUnavailableError) {
        return res.status(503).json({
          error: {
            code: ErrorCodes.PSP_UNAVAILABLE,
            message:
              'Payment provider unavailable. Try again in a few minutes.',
          },
        });
      }
      next(err);
    }
  }
);

// ══════════════════════════════════════════════════════════════════
//  GET /v1/checkout/session/:id
// ══════════════════════════════════════════════════════════════════
//
//  Read path. No auth | id is the capability. The frontend polls
//  this every 3s while status='pending'.

publicRouter.get(
  '/checkout/session/:id',
  async (req, res, next) => {
    try {
      const sessionId = req.params.id;
      // Defensive shape check | not enough to bother zod, but a
      // 404 for an obviously malformed id beats noise in the error log.
      if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
        return next(notFound('Session not found', {
          code: ErrorCodes.SESSION_NOT_FOUND,
        }));
      }

      const result = await service.getSessionForPublicView(sessionId);
      if (!result) {
        return next(notFound('Session not found', {
          code: ErrorCodes.SESSION_NOT_FOUND,
        }));
      }

      const { session, platformName, notifyEmailEnabled } = result;

      // country_not_active sessions: strip money fields, surface the
      // coming-soon-specific shape. notify_email_enabled is resolved
      // from the platform's country_config by the service so the
      // GET shape matches POST /initialize (S5 handoff item 4).
      /* PHASE_7F_S6_GET_PARITY_NOTIFY */
      if (session.status === 'country_not_active') {
        return res.status(200).json({
          status: session.status,
          session_id: session.id,
          platform_id: session.platform_id,
          platform_name: platformName,
          country_code: session.country_code,
          reason: session.country_not_active_reason,
          notify_email_enabled: notifyEmailEnabled === true,
          callback_url: session.callback_url,
          expires_at: session.expires_at,
          public_reference: session.public_reference,
        });
      }

      // active path: full money snapshot.
      const response = {
        status: session.status,
        session_id: session.id,
        platform_id: session.platform_id,
        platform_name: platformName,
        amount_usd: Number(session.amount_usd_credited),
        amount_ngn: Number(session.amount_ngn),
        rate_applied: session.display_rate,
        country_code: session.country_code,
        virtual_account: {
          account_number: session.virtual_account_number ?? PLACEHOLDER_VIRTUAL_ACCOUNT.account_number,
          bank_name: session.virtual_account_bank ?? PLACEHOLDER_VIRTUAL_ACCOUNT.bank_name,
          account_name: session.virtual_account_name ?? PLACEHOLDER_VIRTUAL_ACCOUNT.account_name,
        },
        expires_at: session.expires_at,
        public_reference: session.public_reference,
        callback_url: session.callback_url,
      };

      if (session.status === 'confirmed') {
        response.confirmed_at = session.confirmed_at;
      }

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
);
