# ══════════════════════════════════════════════════════════════
# Adyapan LMS — 1-Click Restore Script for Core Banking Redesign
# ─────────────────────────────────────────────────────────────
# Restores ONLY the files modified/created during the Core Banking
# Engine signature redesign task.
# ══════════════════════════════════════════════════════════════

Write-Host "Restoring Core Banking Engine to baseline checkpoint (102ff93)..." -ForegroundColor Cyan

# 1. Reset Core Banking page to baseline commit
git checkout 102ff93 -- src/app/products/core-banking-engine/page.tsx

# 2. Remove dedicated Core Banking components if created
if (Test-Path "src/components/products/core-banking") {
    Remove-Item -Recurse -Force "src/components/products/core-banking"
    Write-Host "✓ Removed src/components/products/core-banking/" -ForegroundColor Green
}

Write-Host "✓ Successfully restored Core Banking Engine to pre-redesign state." -ForegroundColor Green
