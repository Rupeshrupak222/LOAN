# ══════════════════════════════════════════════════════════════
# Adyapan LMS — 1-Click Script to Restore Sketches
# ─────────────────────────────────────────────────────────────
# Reverts commit 7b4e9bb to bring back the sketches if desired.
# ══════════════════════════════════════════════════════════════

Write-Host "Restoring sketches commit (e148717)..." -ForegroundColor Cyan

git checkout e148717 -- src/components/about/

Write-Host "✓ Sketches restored to About page." -ForegroundColor Green
