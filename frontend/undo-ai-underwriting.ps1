# Undo script for AI Underwriting Scorecard product page
# Baseline commit: c1b12ab

Write-Host "Reverting AI Underwriting Scorecard changes to baseline commit c1b12ab..." -ForegroundColor Yellow

# Remove created scorecard components and page
if (Test-Path "src/app/products/ai-underwriting-scorecard") {
    Remove-Item -Recurse -Force "src/app/products/ai-underwriting-scorecard"
}

if (Test-Path "src/components/products/scorecard") {
    Remove-Item -Recurse -Force "src/components/products/scorecard"
}

# Restore modified files
git checkout c1b12ab -- src/app/products/ai-underwriting/page.tsx src/components/motion/MotionNavbar.tsx

Write-Host "AI Underwriting Scorecard changes have been cleanly reverted." -ForegroundColor Green
