$files = @(
  'src\styles\ui\iridescent-edge.module.css',
  'src\styles\ui\vault-watermark.module.css',
  'src\styles\ui\faceted-surface.module.css',
  'src\components\ui\FacetedSurface.jsx',
  'src\styles\layout\checkout-shell.module.css',
  'src\components\layout\CheckoutHeader.jsx',
  'src\styles\layout\checkout-header.module.css',
  'src\components\layout\CheckoutFooter.jsx',
  'src\styles\layout\checkout-footer.module.css',
  'src\components\ui\Logo.jsx',
  'src\styles\ui\logo.module.css',
  'src\hooks\useReducedMotion.js',
  'src\components\layout\ScrollToTop.jsx',
  'src\components\ui\icons\IconCheck.jsx',
  'src\components\ui\icons\IconClock.jsx',
  'src\components\ui\icons\IconAlert.jsx',
  'src\pages\checkout\LandingPage.jsx',
  'src\styles\pages\landing-page.module.css',
  'src\pages\checkout\ExpiredPage.jsx',
  'src\pages\checkout\AlreadyPaidPage.jsx',
  'src\pages\checkout\InvalidPage.jsx',
  'src\styles\pages\edge-page.module.css'
)

$dest = 'phase5_session3_bundle2'
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

if (Test-Path 'phase5_session3_bundle2.zip') { Remove-Item 'phase5_session3_bundle2.zip' -Force }
Compress-Archive -Path "$dest\*" -DestinationPath 'phase5_session3_bundle2.zip' -Force
Remove-Item $dest -Recurse -Force

Write-Host ""
if ($missing.Count -gt 0) {
  Write-Host "Done with $($missing.Count) missing file(s) listed above." -ForegroundColor Yellow
} else {
  Write-Host "Done: phase5_session3_bundle2.zip (all $($files.Count) files bundled)" -ForegroundColor Green
}