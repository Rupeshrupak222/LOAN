# Undo script for Automated DTI Policy redesign (The Financial X-Ray)
# Baseline commit: e1a962828ff798cf0c7f0fefbb71e065aa6ba702

Write-Host "Reverting Automated DTI Policy changes..." -ForegroundColor Yellow

$targetCommit = "e1a962828ff798cf0c7f0fefbb71e065aa6ba702"

# Restore modified page
git checkout $targetCommit -- src/app/products/automated-dti-policy/page.tsx

# Remove components
if (Test-Path "src/components/products/automated-dti-policy") {
    Remove-Item -Recurse -Force "src/components/products/automated-dti-policy"
    Write-Host "Removed src/components/products/automated-dti-policy" -ForegroundColor Green
}

Write-Host "Automated DTI Policy has been reverted to baseline commit $targetCommit." -ForegroundColor Green
