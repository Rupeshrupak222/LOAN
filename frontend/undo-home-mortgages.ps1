# ══════════════════════════════════════════════════════════════
# Adyapan LMS — 1-Click Restore Script for Home Mortgages Redesign
# ─────────────────────────────────────────────────────────────
# Restores files to baseline checkpoint (318a923).
# ══════════════════════════════════════════════════════════════

Write-Host "Restoring Home Mortgages to baseline checkpoint (318a923)..." -ForegroundColor Cyan

git reset --hard 318a923

Write-Host "✓ Successfully restored Home Mortgages signature page." -ForegroundColor Green
