# ══════════════════════════════════════════════════════════════
# Adyapan LMS — 1-Click Restore Script for Neobanking Portal Redesign
# ─────────────────────────────────────────────────────────────
# Restores ONLY the files modified/created during the Neobanking
# Portal signature redesign task.
# ══════════════════════════════════════════════════════════════

Write-Host "Restoring Neobanking Portal to baseline checkpoint (96c64b1)..." -ForegroundColor Cyan

# 1. Reset Neobanking Portal page to baseline commit
git checkout 96c64b1 -- src/app/products/neobanking-portal/page.tsx

# 2. Remove dedicated Neobanking components if created
if (Test-Path "src/components/products/neobanking") {
    Remove-Item -Recurse -Force "src/components/products/neobanking"
    Write-Host "✓ Removed src/components/products/neobanking/" -ForegroundColor Green
}

Write-Host "✓ Successfully restored Neobanking Portal to pre-redesign state." -ForegroundColor Green
