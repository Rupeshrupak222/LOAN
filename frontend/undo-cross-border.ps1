# ══════════════════════════════════════════════════════════════
# Adyapan LMS — 1-Click Restore Script for Cross-Border Wire Redesign
# ─────────────────────────────────────────────────────────────
# Restores files to baseline checkpoint (f0ac6f9).
# ══════════════════════════════════════════════════════════════

Write-Host "Restoring Cross-Border Wire to baseline checkpoint (f0ac6f9)..." -ForegroundColor Cyan

git reset --hard f0ac6f9

Write-Host "✓ Successfully restored Cross-Border Wire signature page." -ForegroundColor Green
