# Undo script for Editorial Fintech Navigation redesign
# Baseline commit: f3e0846067efbf06e9821815d3151aa0be17b2b2

Write-Host "Reverting Navigation changes to baseline..." -ForegroundColor Yellow

$targetCommit = "f3e0846067efbf06e9821815d3151aa0be17b2b2"

# Restore modified navigation files
git checkout $targetCommit -- src/components/motion/MotionNavbar.tsx

Write-Host "Navigation has been successfully reverted to baseline commit $targetCommit." -ForegroundColor Green
