# ══════════════════════════════════════════════════════════════
# Adyapan LMS — 1-Click Restore Script for Debit & Prepaid Cards Redesign
# ─────────────────────────────────────────────────────────────
# Restores ONLY the files modified/created during the Debit & Prepaid
# Cards signature redesign task.
# ══════════════════════════════════════════════════════════════

Write-Host "Restoring Debit & Prepaid Cards to baseline checkpoint (bc2cf64)..." -ForegroundColor Cyan

# 1. Reset Debit Cards page to baseline commit
git checkout bc2cf64 -- src/app/products/debit-prepaid-cards/page.tsx

# 2. Remove dedicated Debit Cards components if created
if (Test-Path "src/components/products/debit-cards") {
    Remove-Item -Recurse -Force "src/components/products/debit-cards"
    Write-Host "✓ Removed src/components/products/debit-cards/" -ForegroundColor Green
}

Write-Host "✓ Successfully restored Debit & Prepaid Cards to pre-redesign state." -ForegroundColor Green
