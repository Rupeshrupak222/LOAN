# ══════════════════════════════════════════════════════════════
# Adyapan LMS — 1-Click Rollback Script for Resources Page
# ─────────────────────────────────────────────────────────────
# Restores ONLY the changes made during the dedicated Resources
# page task back to checkpoint commit 1edf050.
# ══════════════════════════════════════════════════════════════

Write-Host "Restoring Adyapan LMS to pre-resources baseline checkpoint (1edf050)..." -ForegroundColor Cyan

# 1. Reset MotionNavbar.tsx
git checkout 1edf050 -- src/components/motion/MotionNavbar.tsx
Write-Host "✓ Reverted MotionNavbar.tsx" -ForegroundColor Green

# 2. Remove /resources route
if (Test-Path "src/app/resources") {
    Remove-Item -Recurse -Force "src/app/resources"
    Write-Host "✓ Removed src/app/resources" -ForegroundColor Green
}

# 3. Remove dedicated resources components
if (Test-Path "src/components/resources") {
    Remove-Item -Recurse -Force "src/components/resources"
    Write-Host "✓ Removed src/components/resources" -ForegroundColor Green
}

Write-Host "✓ Successfully restored project to pre-resources page state." -ForegroundColor Green
