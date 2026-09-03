# Undo script for Immutable Audit Trail redesign (The Unbreakable Chain of Truth)
# Baseline commit: e7d87d402aafe8e32906ecaa6f387f3942007011

Write-Host "Reverting Immutable Audit Trail changes to Unbreakable Chain of Truth baseline..." -ForegroundColor Yellow

$targetCommit = "e7d87d402aafe8e32906ecaa6f387f3942007011"

# Restore modified page
git checkout $targetCommit -- src/app/products/immutable-audit-trail/page.tsx

# Remove components
if (Test-Path "src/components/products/immutable-audit-trail") {
    Remove-Item -Recurse -Force "src/components/products/immutable-audit-trail"
    Write-Host "Removed src/components/products/immutable-audit-trail" -ForegroundColor Green
}

Write-Host "Immutable Audit Trail has been reverted to baseline commit $targetCommit." -ForegroundColor Green
