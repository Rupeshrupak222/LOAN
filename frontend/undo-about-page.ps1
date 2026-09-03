# Undo script for About Adyapan page
# Baseline commit: d4c7c3b

Write-Host "Reverting About Adyapan changes to baseline commit d4c7c3b..." -ForegroundColor Yellow

# Remove created about components and page
if (Test-Path "src/app/about") {
    Remove-Item -Recurse -Force "src/app/about"
}

if (Test-Path "src/components/about") {
    Remove-Item -Recurse -Force "src/components/about"
}

# Restore modified navbar
git checkout d4c7c3b -- src/components/motion/MotionNavbar.tsx

Write-Host "About Adyapan changes have been cleanly reverted." -ForegroundColor Green
