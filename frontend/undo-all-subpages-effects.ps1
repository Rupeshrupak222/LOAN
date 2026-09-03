# Undo script for 3D Visual Effects & Unique Hero Backgrounds across all sub-pages
# Baseline commit: 2ae04daf55826cccebac6284f299b4fe04511a55

Write-Host "Reverting 3D effects and subpage changes to baseline commit 2ae04daf55826cccebac6284f299b4fe04511a55..." -ForegroundColor Yellow

$targetCommit = "2ae04daf55826cccebac6284f299b4fe04511a55"

# Restore modified files
git checkout $targetCommit -- src/components/products/
git checkout $targetCommit -- src/app/products/
git checkout $targetCommit -- src/components/product-detail/

# Clean untracked files in product directories if any created
git clean -fd src/components/products/
git clean -fd src/app/products/

Write-Host "All sub-pages have been successfully reverted to baseline commit $targetCommit." -ForegroundColor Green
