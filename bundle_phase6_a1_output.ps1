# Phase 6 | Session A1 output bundle.
#
# Run from the directory where you extracted Claude's src/ tree.
# Produces phase6_a1_output.zip mirroring the project src/ tree
# so a single archive contains the full A1 delivery.
#
# Alternative workflow: skip this script and copy the unpacked
# src/ tree directly over your project's src/ tree. The script
# exists for clean version-control snapshotting.

$files = @(
  # Edits to existing files
  'src\main.jsx',
  'src\app\App.jsx',
  'src\styles\base\tokens.css',

  # New routing
  'src\app\adminRouter.jsx',

  # New shell components (4 components, 4 modules)
  'src\components\admin\AdminShell\AdminShell.jsx',
  'src\components\admin\AdminShell\admin-shell.module.css',
  'src\components\admin\AdminHeader\AdminHeader.jsx',
  'src\components\admin\AdminHeader\admin-header.module.css',
  'src\components\admin\AdminSidebar\AdminSidebar.jsx',
  'src\components\admin\AdminSidebar\admin-sidebar.module.css',
  'src\components\admin\AdminDrawer\AdminDrawer.jsx',
  'src\components\admin\AdminDrawer\admin-drawer.module.css',

  # Auth gate stub + screen stub
  'src\components\admin\AdminProtected\AdminProtected.jsx',
  'src\components\admin\AdminScreenStub\AdminScreenStub.jsx',
  'src\components\admin\AdminScreenStub\admin-screen-stub.module.css',

  # 15 icons
  'src\components\ui\icons\IconBell.jsx',
  'src\components\ui\icons\IconHamburger.jsx',
  'src\components\ui\icons\IconChevron.jsx',
  'src\components\ui\icons\IconX.jsx',
  'src\components\ui\icons\IconLogout.jsx',
  'src\components\ui\icons\IconHome.jsx',
  'src\components\ui\icons\IconLayers.jsx',
  'src\components\ui\icons\IconSettlement.jsx',
  'src\components\ui\icons\IconRate.jsx',
  'src\components\ui\icons\IconExport.jsx',
  'src\components\ui\icons\IconBuilding.jsx',
  'src\components\ui\icons\IconMerchant.jsx',
  'src\components\ui\icons\IconCountry.jsx',
  'src\components\ui\icons\IconAudit.jsx',
  'src\components\ui\icons\IconCog.jsx',

  # 19 page skeletons + 2 page CSS modules
  'src\pages\admin\LoginPage.jsx',
  'src\pages\admin\login-page.module.css',
  'src\pages\admin\EnrolPage.jsx',
  'src\pages\admin\InviteAcceptPage.jsx',
  'src\pages\admin\DashboardPage.jsx',
  'src\pages\admin\TransactionsPage.jsx',
  'src\pages\admin\TransactionDetailPage.jsx',
  'src\pages\admin\SettlementsPage.jsx',
  'src\pages\admin\SettlementBatchDetailPage.jsx',
  'src\pages\admin\RateEnginePage.jsx',
  'src\pages\admin\PlatformsPage.jsx',
  'src\pages\admin\PlatformDetailPage.jsx',
  'src\pages\admin\MerchantsPage.jsx',
  'src\pages\admin\MerchantDetailPage.jsx',
  'src\pages\admin\CorridorsPage.jsx',
  'src\pages\admin\CorridorDetailPage.jsx',
  'src\pages\admin\AuditLogPage.jsx',
  'src\pages\admin\SettingsPage.jsx',
  'src\pages\admin\WithdrawalsPage.jsx',
  'src\pages\admin\AdminNotFoundPage.jsx',
  'src\pages\admin\admin-not-found-page.module.css'
)

$dest = 'phase6_a1_output'
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
New-Item -ItemType Directory -Path $dest | Out-Null

$missing = @()
foreach ($f in $files) {
  if (Test-Path $f) {
    $target = Join-Path $dest $f
    New-Item -ItemType Directory -Path (Split-Path $target) -Force | Out-Null
    Copy-Item $f $target
    Write-Host "  ok  $f" -ForegroundColor DarkGray
  } else {
    Write-Host "MISSING: $f" -ForegroundColor Red
    $missing += $f
  }
}

if (Test-Path 'phase6_a1_output.zip') { Remove-Item 'phase6_a1_output.zip' -Force }
Compress-Archive -Path "$dest\*" -DestinationPath 'phase6_a1_output.zip' -Force
Remove-Item $dest -Recurse -Force

Write-Host ""
if ($missing.Count -gt 0) {
  Write-Host "Done with $($missing.Count) missing file(s) listed above." -ForegroundColor Yellow
} else {
  Write-Host "Done: phase6_a1_output.zip (all $($files.Count) files bundled)" -ForegroundColor Green
}
