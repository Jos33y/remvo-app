import { createBrowserRouter, Navigate } from 'react-router';
import { AdminProtected } from '@components/layout/admin/AdminProtected';

import { LoginPage } from '@pages/admin/LoginPage';
import { EnrolPage } from '@pages/admin/EnrolPage';
import { InviteAcceptPage } from '@pages/admin/InviteAcceptPage';

import { DashboardPage } from '@pages/admin/DashboardPage';
import { TransactionsPage } from '@pages/admin/TransactionsPage';
import { TransactionDetailPage } from '@pages/admin/TransactionDetailPage';
import { SessionsPage } from '@pages/admin/SessionsPage';
import { SessionDetailPage } from '@pages/admin/SessionDetailPage';
import { SettlementsPage } from '@pages/admin/SettlementsPage';
import { SettlementBatchDetailPage } from '@pages/admin/SettlementBatchDetailPage';
import { RateEnginePage } from '@pages/admin/RateEnginePage';
import { PlatformsPage } from '@pages/admin/PlatformsPage';
import { PlatformDetailPage } from '@pages/admin/PlatformDetailPage';
import { MerchantsPage } from '@pages/admin/MerchantsPage';
import { MerchantDetailPage } from '@pages/admin/MerchantDetailPage';
import { CorridorsPage } from '@pages/admin/CorridorsPage';
import { CorridorDetailPage } from '@pages/admin/CorridorDetailPage';
import { AuditLogPage } from '@pages/admin/AuditLogPage';
import { SettingsPage } from '@pages/admin/SettingsPage';
import { WithdrawalsPage } from '@pages/admin/WithdrawalsPage';
import { AdminNotFoundPage } from '@pages/admin/AdminNotFoundPage';

/* Analytics (Phase 6 final screen group). Layout wraps three child
 * pages sharing the same range-picker context. */
import { AnalyticsLayout } from '@pages/admin/AnalyticsLayout';
import { AnalyticsOverviewPage } from '@pages/admin/AnalyticsOverviewPage';
import { AnalyticsFunnelPage } from '@pages/admin/AnalyticsFunnelPage';
import { AnalyticsPlatformsPage } from '@pages/admin/AnalyticsPlatformsPage';

/* analytics1: Remvo's own analytics for the eBay listing tool, at /remvo. */
import { RemvoLayout } from '@pages/admin/RemvoLayout';
import { RemvoOverviewPage } from '@pages/admin/RemvoOverviewPage';
import { RemvoSourcesPage } from '@pages/admin/RemvoSourcesPage';
import { RemvoFunnelPage } from '@pages/admin/RemvoFunnelPage';
import { RemvoPagesPage } from '@pages/admin/RemvoPagesPage';
import { RemvoSellersPage } from '@pages/admin/RemvoSellersPage';
import { RemvoSellerPage } from '@pages/admin/RemvoSellerPage';
import { RemvoQualityPage } from '@pages/admin/RemvoQualityPage';

/* Dev-only harness. */
import { DevPrimitivesPage } from '@pages/admin/DevPrimitivesPage';

/* ──────────────────────────────────────────────────────────────────
 * Admin Router (admin.remvo.app)
 * ────────────────────────────────────────────────────────────────── */

const CATCH_ALL_TARGET = import.meta.env.DEV ? '/?admin' : '/';
const REMVO_TARGET = import.meta.env.DEV ? '/remvo?admin' : '/remvo';

const authenticatedChildren = [
  /* analytics1: sign-in lands on Remvo; the paused corridor's dashboard moves to /dashboard, unchanged. */
  { index: true,                          element: <Navigate to={REMVO_TARGET} replace /> },
  { path: 'dashboard',                    element: <DashboardPage /> },
  {
    path: 'remvo',
    element: <RemvoLayout />,
    children: [
      { index: true,           element: <RemvoOverviewPage /> },
      { path: 'sources',       element: <RemvoSourcesPage /> },
      { path: 'funnel',        element: <RemvoFunnelPage /> },
      { path: 'pages',         element: <RemvoPagesPage /> },
      { path: 'sellers',       element: <RemvoSellersPage /> },
      { path: 'sellers/:id',   element: <RemvoSellerPage /> },
      { path: 'quality',       element: <RemvoQualityPage /> },
    ],
  },
  { path: 'transactions',                 element: <TransactionsPage /> },
  { path: 'transactions/:id',             element: <TransactionDetailPage /> },
  { path: 'sessions',                     element: <SessionsPage /> },
  { path: 'sessions/:id',                 element: <SessionDetailPage /> },
  { path: 'settlements',                  element: <SettlementsPage /> },
  { path: 'settlements/:id',              element: <SettlementBatchDetailPage /> },
  { path: 'rates',                        element: <RateEnginePage /> },
  {
    path: 'analytics',
    element: <AnalyticsLayout />,
    children: [
      { index: true,    element: <AnalyticsOverviewPage /> },
      { path: 'funnel', element: <AnalyticsFunnelPage /> },
      { path: 'platforms', element: <AnalyticsPlatformsPage /> },
    ],
  },
  { path: 'platforms',                    element: <PlatformsPage /> },
  { path: 'platforms/:id',                element: <PlatformDetailPage /> },
  { path: 'merchants',                    element: <MerchantsPage /> },
  { path: 'merchants/:id',                element: <MerchantDetailPage /> },
  { path: 'corridors',                    element: <CorridorsPage /> },
  { path: 'corridors/:id',                element: <CorridorDetailPage /> },
  { path: 'audit',                        element: <AuditLogPage /> },
  { path: 'settings',                     element: <SettingsPage /> },
  { path: 'withdrawals',                  element: <WithdrawalsPage /> },
];

if (import.meta.env.DEV) {
  authenticatedChildren.push({ path: '_dev/primitives', element: <DevPrimitivesPage /> });
}

authenticatedChildren.push({ path: '*', element: <AdminNotFoundPage /> });

export const adminRouter = createBrowserRouter([
  { path: '/login',          element: <LoginPage /> },
  { path: '/enrol',          element: <EnrolPage /> },
  { path: '/invite/:token',  element: <InviteAcceptPage /> },

  {
    path: '/',
    element: <AdminProtected />,
    children: authenticatedChildren,
  },

  { path: '*', element: <Navigate to={CATCH_ALL_TARGET} replace /> },
]);

/* ──────────────────────────────────────────────────────────────────
 * Sidebar nav definition. Single source of truth for sidebar,
 * drawer, and any future command palette.
 *
 * Analytics sits in the Insights section because it is read-only
 * intelligence (operator watches numbers), not an operational tool
 * (operator takes action). Audit log is its sibling; both answer
 * "what has been happening" rather than "what should I do next".
 * ────────────────────────────────────────────────────────────────── */

export const ADMIN_NAV_SECTIONS = [
  /* analytics1: the eBay listing tool, first. */
  {
    key: 'remvo',
    label: 'eBay listing tool',
    items: [
      { route: '/remvo',        label: 'Remvo',        icon: 'IconAnalytics' },
    ],
  },
  {
    key: 'operations',
    label: 'Operations',
    items: [
      { route: '/dashboard',    label: 'Dashboard',    icon: 'IconHome' },
      { route: '/sessions',     label: 'Sessions',     icon: 'IconClock' },
      { route: '/transactions', label: 'Transactions', icon: 'IconLayers' },
      { route: '/settlements',  label: 'Settlements',  icon: 'IconSettlement' },
      { route: '/rates',        label: 'Rate engine',  icon: 'IconRate' },
      { route: '/withdrawals',  label: 'Withdrawals',  icon: 'IconExport', gateKey: 'withdrawals' }, /* PHASE_7F_S3_WITHDRAWALS_GATE */
    ],
  },
  {
    key: 'configuration',
    label: 'Configuration',
    items: [
      { route: '/platforms', label: 'Platforms', icon: 'IconBuilding' },
      { route: '/merchants', label: 'Merchants', icon: 'IconMerchant' },
      { route: '/corridors', label: 'Corridors', icon: 'IconCountry' },
    ],
  },
  {
    key: 'insights',
    label: 'Insights',
    items: [
      { route: '/analytics', label: 'Analytics', icon: 'IconAnalytics', gateKey: 'analytics' }, /* PHASE_7F_S3_ANALYTICS_GATE */
      { route: '/audit',     label: 'Audit log', icon: 'IconAudit' },
    ],
  },
  {
    key: 'admin',
    label: 'Admin',
    items: [
      { route: '/settings', label: 'Settings', icon: 'IconCog' },
    ],
  },
];

/* ──────────────────────────────────────────────────────────────────
 * adminPath(path)
 *
 * Preserves ?admin in dev mode. Production returns unchanged.
 * ────────────────────────────────────────────────────────────────── */

export function adminPath(path) {
  if (!import.meta.env.DEV) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}admin`;
}
