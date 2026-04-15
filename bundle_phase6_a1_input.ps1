# Phase 6 | Session A1 input bundle.
# Run from the project root. Uploads the resulting zip back to Claude.
# These are read-only inputs. Claude needs them to extend tokens, mount the
# admin router alongside checkout, and clone the Phase 5 icon and Logo patterns.

$files = @(
  # Tokens, base styles, fonts
  'src\styles\base\tokens.css',
  'src\styles\base\global.css',
  'src\styles\base\reset.css',

  # Routing and entry point
  'src\main.jsx',
  'src\app\App.jsx',
  'src\app\router.jsx',
  'src\app\checkoutRouter.jsx',

  # Pattern reference for AdminShell
  'src\components\layout\CheckoutShell.jsx',
  'src\styles\layout\checkout-shell.module.css',
  'src\components\layout\CheckoutHeader.jsx',
  'src\styles\layout\checkout-header.module.css',
  'src\components\layout\PageShell.jsx',
  'src\styles\layout\page-shell.module.css',

  # Logo (composed by AdminHeader unchanged)
  'src\components\ui\Logo.jsx',
  'src\styles\ui\logo.module.css',

  # Icon pattern reference (one is enough; all follow the same shape)
  'src\components\ui\icons\IconCheck.jsx',
  'src\components\ui\icons\IconAlert.jsx',
  'src\components\ui\icons\IconClock.jsx',

  # Vault watermark and iridescent edge (composed onto admin chrome unchanged)
  'src\components\ui\VaultWatermark.jsx',
  'src\styles\ui\vault-watermark.module.css',
  'src\components\ui\IridescentEdge.jsx',
  'src\styles\ui\iridescent-edge.module.css',

  # Hooks composed by admin shell and drawer
  'src\hooks\useReducedMotion.js',

  # Build config
  'package.json',
  'vite.config.js',
  'index.html'
)

$dest = 'phase6_a1_input'
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

if (Test-Path 'phase6_a1_input.zip') { Remove-Item 'phase6_a1_input.zip' -Force }
Compress-Archive -Path "$dest\*" -DestinationPath 'phase6_a1_input.zip' -Force
Remove-Item $dest -Recurse -Force

Write-Host ""
if ($missing.Count -gt 0) {
  Write-Host "Done with $($missing.Count) missing file(s) listed above." -ForegroundColor Yellow
  Write-Host "If any missing file is genuinely not in the project, upload anyway. Claude will adapt." -ForegroundColor Yellow
} else {
  Write-Host "Done: phase6_a1_input.zip (all $($files.Count) files bundled)" -ForegroundColor Green
}
