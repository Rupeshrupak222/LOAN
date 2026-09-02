# ══════════════════════════════════════════════════════════════
# Adyapan LMS — 1-Click Restore Script for Connect API Gateway Redesign
# ─────────────────────────────────────────────────────────────
# Restores ONLY the files modified/created during the Connect API
# Gateway signature redesign task.
# ══════════════════════════════════════════════════════════════

Write-Host "Restoring Connect API Gateway to baseline checkpoint (d7177ba)..." -ForegroundColor Cyan

# 1. Reset Connect API Gateway page to baseline commit
git checkout d7177ba -- src/app/products/connect-api-gateway/page.tsx

# 2. Remove dedicated Connect API components if created
if (Test-Path "src/components/products/connect-api") {
    Remove-Item -Recurse -Force "src/components/products/connect-api"
    Write-Host "✓ Removed src/components/products/connect-api/" -ForegroundColor Green
}

Write-Host "✓ Successfully restored Connect API Gateway to pre-redesign state." -ForegroundColor Green
