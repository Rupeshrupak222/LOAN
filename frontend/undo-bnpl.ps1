# ══════════════════════════════════════════════════════════════
# Adyapan LMS — 1-Click Restore Script for BNPL Redesign
# ─────────────────────────────────────────────────────────────
# Restores files to baseline checkpoint (910003f).
# ══════════════════════════════════════════════════════════════

Write-Host "Restoring 0% 3-Month BNPL to baseline checkpoint (910003f)..." -ForegroundColor Cyan

git reset --hard 910003f

Write-Host "✓ Successfully restored BNPL signature page." -ForegroundColor Green
