# ══════════════════════════════════════════════════════════════
# Adyapan LMS — 1-Click Restore Script for Personal Loans Redesign
# ─────────────────────────────────────────────────────────────
# Restores ONLY the files modified/created during the Personal
# Loans signature redesign task.
# ══════════════════════════════════════════════════════════════

Write-Host "Restoring Personal Loans to baseline checkpoint (dfa7dfe)..." -ForegroundColor Cyan

# 1. Reset Personal Loans page to baseline commit
git checkout dfa7dfe -- src/app/products/personal-loans/page.tsx

# 2. Remove dedicated Personal Loans components if created
if (Test-Path "src/components/products/personal-loans") {
    Remove-Item -Recurse -Force "src/components/products/personal-loans"
    Write-Host "✓ Removed src/components/products/personal-loans/" -ForegroundColor Green
}

Write-Host "✓ Successfully restored Personal Loans to pre-redesign state." -ForegroundColor Green
