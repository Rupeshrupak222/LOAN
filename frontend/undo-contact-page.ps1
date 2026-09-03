# Undo script for Contact Page 3D scroll animation system
# Baseline commit: edd9a2b

Write-Host "Reverting Contact page changes to baseline commit edd9a2b..." -ForegroundColor Yellow

# Remove created contact components and page
if (Test-Path "src/app/contact") {
    Remove-Item -Recurse -Force "src/app/contact"
}

if (Test-Path "src/components/contact") {
    Remove-Item -Recurse -Force "src/components/contact"
}

if (Test-Path "src/components/motion/ScrollStage3D.tsx") {
    Remove-Item -Force "src/components/motion/ScrollStage3D.tsx"
}

Write-Host "Contact page changes have been cleanly reverted." -ForegroundColor Green
