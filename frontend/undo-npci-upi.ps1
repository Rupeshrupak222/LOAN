# ══════════════════════════════════════════════════════════════
# Adyapan LMS — 1-Click Restore Script for NPCI UPI Network Redesign
# ─────────────────────────────────────────────────────────────
# Restores files to baseline checkpoint (81b447a).
# ══════════════════════════════════════════════════════════════

Write-Host "Restoring NPCI UPI Network to baseline checkpoint (81b447a)..." -ForegroundColor Cyan

git reset --hard 81b447a

Write-Host "✓ Successfully restored NPCI UPI Network signature page." -ForegroundColor Green
