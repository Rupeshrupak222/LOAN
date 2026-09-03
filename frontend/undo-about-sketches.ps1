# Rollback script to undo Sketched Illustrations and revert About page to clean baseline (commit ad533a4)
Write-Host "Reverting About page sketches to baseline commit ad533a4..." -ForegroundColor Yellow

git checkout ad533a4 -- src/components/about/

Write-Host "About page sketched illustrations have been cleanly reverted to original design." -ForegroundColor Green
