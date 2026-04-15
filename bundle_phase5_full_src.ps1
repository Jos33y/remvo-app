# Phase 6 | Pre-A2 reorganisation input bundle.
#
# Grabs the FULL current src/ tree plus vite.config.js so Claude can
# rewrite every import path to the new domain-split convention
# (layout/ checkout, layout/ admin, layout/ marketing, layout/ shared
# and the equivalent split inside ui/ and styles/).
#
# Run from the project root. Output: phase5_full_src.zip.
#
# 111 files expected. The script lists each one explicitly rather
# than recursing so a missing file is named in the output and not
# silently skipped.

$files = @(
  # Root + config
  'src\main.jsx',
  'vite.config.js',

  # app
  'src\app\App.jsx',
  'src\app\checkoutRouter.jsx',
  'src\app\router.jsx',

  # components/layout
  'src\components\layout\CheckoutFooter.jsx',
  'src\components\layout\CheckoutHeader.jsx',
  'src\components\layout\CheckoutShell.jsx',
  'src\components\layout\FocusPullOutlet.jsx',
  'src\components\layout\Footer.jsx',
  'src\components\layout\Header.jsx',
  'src\components\layout\LegalPageLayout.jsx',
  'src\components\layout\PageShell.jsx',
  'src\components\layout\ScrollToTop.jsx',

  # components/ui
  'src\components\ui\BankTransferCard.jsx',
  'src\components\ui\Button.jsx',
  'src\components\ui\CheckoutMockup.jsx',
  'src\components\ui\CopyableRow.jsx',
  'src\components\ui\DenominationGrid.jsx',
  'src\components\ui\DevSimulateButton.jsx',
  'src\components\ui\FacetedSurface.jsx',
  'src\components\ui\GoldRing.jsx',
  'src\components\ui\IridescentEdge.jsx',
  'src\components\ui\Logo.jsx',
  'src\components\ui\PaymentStatusBar.jsx',
  'src\components\ui\RemvoCard.jsx',
  'src\components\ui\Reveal.jsx',
  'src\components\ui\SignatureMoment.jsx',
  'src\components\ui\VaultWatermark.jsx',

  # components/ui/icons
  'src\components\ui\icons\IconAlert.jsx',
  'src\components\ui\icons\IconCheck.jsx',
  'src\components\ui\icons\IconClock.jsx',
  'src\components\ui\icons\IconCopy.jsx',
  'src\components\ui\icons\IconDot.jsx',
  'src\components\ui\icons\IconLock.jsx',

  # context
  'src\context\MockSessionProvider.jsx',
  'src\context\SessionContext.jsx',

  # hooks
  'src\hooks\useCheckoutNavigate.js',
  'src\hooks\useClipboard.js',
  'src\hooks\useCountdown.js',
  'src\hooks\useReducedMotion.js',

  # pages/cac
  'src\pages\cac\cac-data.js',
  'src\pages\cac\CACRegistrationPage.jsx',

  # pages/checkout
  'src\pages\checkout\AlreadyPaidPage.jsx',
  'src\pages\checkout\CompletePage.jsx',
  'src\pages\checkout\ConfirmPage.jsx',
  'src\pages\checkout\ExpiredPage.jsx',
  'src\pages\checkout\InvalidPage.jsx',
  'src\pages\checkout\LandingPage.jsx',
  'src\pages\checkout\PaymentPage.jsx',
  'src\pages\checkout\SelectPage.jsx',
  'src\pages\checkout\SessionResolver.jsx',

  # pages/contact
  'src\pages\contact\ContactPage.jsx',

  # pages/home
  'src\pages\home\HomePage.jsx',
  'src\pages\home\sections\HomeCheckout.jsx',
  'src\pages\home\sections\HomeCTA.jsx',
  'src\pages\home\sections\HomeFeatures.jsx',
  'src\pages\home\sections\HomeHero.jsx',

  # pages/legal
  'src\pages\legal\AMLPage.jsx',
  'src\pages\legal\PrivacyPage.jsx',
  'src\pages\legal\RefundsPage.jsx',
  'src\pages\legal\TermsPage.jsx',

  # pages/not-found
  'src\pages\not-found\NotFoundPage.jsx',

  # pages/partners
  'src\pages\partners\AgreementPage.jsx',
  'src\pages\partners\PartnersPage.jsx',
  'src\pages\partners\sections\CTASection.jsx',
  'src\pages\partners\sections\ExampleSection.jsx',
  'src\pages\partners\sections\FlowSection.jsx',
  'src\pages\partners\sections\HeroSection.jsx',
  'src\pages\partners\sections\IntegrationSection.jsx',
  'src\pages\partners\sections\SettlementSection.jsx',

  # styles/base
  'src\styles\base\global.css',
  'src\styles\base\reset.css',
  'src\styles\base\tokens.css',

  # styles/layout
  'src\styles\layout\checkout-footer.module.css',
  'src\styles\layout\checkout-header.module.css',
  'src\styles\layout\checkout-shell.module.css',
  'src\styles\layout\footer.module.css',
  'src\styles\layout\header.module.css',
  'src\styles\layout\legal-page-layout.module.css',
  'src\styles\layout\page-shell.module.css',

  # styles/pages
  'src\styles\pages\cac.module.css',
  'src\styles\pages\complete-page.module.css',
  'src\styles\pages\confirm-page.module.css',
  'src\styles\pages\contact.module.css',
  'src\styles\pages\edge-page.module.css',
  'src\styles\pages\homepage.module.css',
  'src\styles\pages\landing-page.module.css',
  'src\styles\pages\not-found.module.css',
  'src\styles\pages\partners.module.css',
  'src\styles\pages\payment-page.module.css',
  'src\styles\pages\select-page.module.css',

  # styles/ui
  'src\styles\ui\bank-transfer-card.module.css',
  'src\styles\ui\button.module.css',
  'src\styles\ui\checkout-mockup.module.css',
  'src\styles\ui\copyable-row.module.css',
  'src\styles\ui\denomination-grid.module.css',
  'src\styles\ui\dev-simulate-button.module.css',
  'src\styles\ui\faceted-surface.module.css',
  'src\styles\ui\gold-ring.module.css',
  'src\styles\ui\iridescent-edge.module.css',
  'src\styles\ui\logo.module.css',
  'src\styles\ui\payment-status-bar.module.css',
  'src\styles\ui\remvo-card.module.css',
  'src\styles\ui\reveal.module.css',
  'src\styles\ui\vault-watermark.module.css',

  # utils
  'src\utils\constants.js',
  'src\utils\formatAccountNumber.js',
  'src\utils\formatNaira.js',
  'src\utils\formatUsd.js',
  'src\utils\generateReference.js',
  'src\utils\motion.js'
)

$dest = 'phase5_full_src'
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

if (Test-Path 'phase5_full_src.zip') { Remove-Item 'phase5_full_src.zip' -Force }
Compress-Archive -Path "$dest\*" -DestinationPath 'phase5_full_src.zip' -Force
Remove-Item $dest -Recurse -Force

Write-Host ""
if ($missing.Count -gt 0) {
  Write-Host "Done with $($missing.Count) missing file(s) listed above." -ForegroundColor Yellow
  Write-Host "If a file is genuinely not in your project, upload anyway. Claude will adapt." -ForegroundColor Yellow
} else {
  Write-Host "Done: phase5_full_src.zip (all $($files.Count) files bundled)" -ForegroundColor Green
}
