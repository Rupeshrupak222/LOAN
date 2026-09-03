# Undo script for Credit Line on UPI signature redesign
# Baseline commit: 325a81878d655f01e695d6664d4b1a4597b830d1

Write-Host "Reverting Credit Line on UPI changes..." -ForegroundColor Yellow

$targetCommit = "325a81878d655f01e695d6664d4b1a4597b830d1"

# Restore modified page
git checkout $targetCommit -- src/app/products/credit-line-upi/page.tsx

# Remove new components
if (Test-Path "src/components/products/credit-line-upi") {
    Remove-Item -Recurse -Force "src/components/products/credit-line-upi"
    Write-Host "Removed src/components/products/credit-line-upi" -ForegroundColor Green
}

Write-Host "Credit Line on UPI has been reverted to baseline commit $targetCommit." -ForegroundColor Green
