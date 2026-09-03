# Undo script for DigiLocker e-KYC signature product page rebuild
# Baseline commit: 4b3fde28e4693c4c929a5fe2bb808542cbb3e0eb

Write-Host "Reverting DigiLocker e-KYC changes to baseline commit 4b3fde28e4693c4c929a5fe2bb808542cbb3e0eb..." -ForegroundColor Yellow

$targetCommit = "4b3fde28e4693c4c929a5fe2bb808542cbb3e0eb"

# Restore modified files
git checkout $targetCommit -- src/app/products/digilocker-ekyc/page.tsx

# Remove newly created digilocker component files
if (Test-Path "src/components/products/digilocker") {
    Remove-Item -Recurse -Force "src/components/products/digilocker"
}

Write-Host "DigiLocker e-KYC page has been successfully reverted to baseline commit $targetCommit." -ForegroundColor Green
