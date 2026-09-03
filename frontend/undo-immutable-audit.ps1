# Undo script for Immutable Audit Trail redesign (The Record That Cannot Be Rewritten)
# Baseline commit: db22da895a6ec89f280a969b76dbb4249a5b6f3b

Write-Host "Reverting Immutable Audit Trail changes..." -ForegroundColor Yellow

$targetCommit = "db22da895a6ec89f280a969b76dbb4249a5b6f3b"

# Restore modified page
git checkout $targetCommit -- src/app/products/immutable-audit-trail/page.tsx

# Remove components
if (Test-Path "src/components/products/immutable-audit-trail") {
    Remove-Item -Recurse -Force "src/components/products/immutable-audit-trail"
    Write-Host "Removed src/components/products/immutable-audit-trail" -ForegroundColor Green
}

Write-Host "Immutable Audit Trail has been reverted to baseline commit $targetCommit." -ForegroundColor Green
