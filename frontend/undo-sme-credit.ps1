# ══════════════════════════════════════════════════════════════
# Adyapan LMS — 1-Click Restore Script for SME Business Credit Redesign
# ─────────────────────────────────────────────────────────────
# Restores files to baseline checkpoint (ee277a1).
# ══════════════════════════════════════════════════════════════

Write-Host "Restoring SME Business Credit to baseline checkpoint (ee277a1)..." -ForegroundColor Cyan

git reset --hard ee277a1

Write-Host "✓ Successfully restored SME Business Credit signature page." -ForegroundColor Green
