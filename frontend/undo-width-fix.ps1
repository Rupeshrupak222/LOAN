# ══════════════════════════════════════════════════════════════
# Adyapan LMS — 1-Click Restore Script for Layout Width Expansion
# ─────────────────────────────────────────────────────────────
# Restores files to baseline checkpoint (f9363c7).
# ══════════════════════════════════════════════════════════════

Write-Host "Restoring layout width to baseline checkpoint (f9363c7)..." -ForegroundColor Cyan

git reset --hard f9363c7

Write-Host "✓ Successfully restored layout to pre-width-fix state." -ForegroundColor Green
