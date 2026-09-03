# ══════════════════════════════════════════════════════════════
# Adyapan LMS — 1-Click Restore Script for Cross-Border Wire Redesign
# ─────────────────────────────────────────────────────────────
# Restores files to baseline checkpoint (619aa59).
# ══════════════════════════════════════════════════════════════

Write-Host "Restoring Cross-Border Wire to baseline checkpoint (619aa59)..." -ForegroundColor Cyan

git reset --hard 619aa59

Write-Host "✓ Successfully restored Cross-Border Wire signature page." -ForegroundColor Green
