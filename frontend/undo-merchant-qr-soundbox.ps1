# ══════════════════════════════════════════════════════════════
# Adyapan LMS — 1-Click Restore Script for Merchant QR Soundbox Redesign
# ─────────────────────────────────────────────────────────────
# Restores ONLY the files modified/created during the Merchant
# QR Soundbox signature redesign task.
# Baseline commit: 96e9a059c75a58b73ba0fa76b343295a241394ac
# ══════════════════════════════════════════════════════════════

Write-Host "Restoring Merchant QR Soundbox to baseline checkpoint (96e9a05)..." -ForegroundColor Cyan

# 1. Reset Merchant QR Soundbox page to baseline commit
git checkout 96e9a059c75a58b73ba0fa76b343295a241394ac -- src/app/products/merchant-qr-soundbox/page.tsx

# 2. Remove dedicated Merchant QR Soundbox components
if (Test-Path "src/components/products/merchant-qr-soundbox") {
    Remove-Item -Recurse -Force "src/components/products/merchant-qr-soundbox"
    Write-Host "✓ Removed src/components/products/merchant-qr-soundbox/" -ForegroundColor Green
}

Write-Host "✓ Successfully restored Merchant QR Soundbox to pre-redesign state." -ForegroundColor Green
