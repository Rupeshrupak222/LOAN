# ══════════════════════════════════════════════════════════════
# Adyapan LMS — 1-Click Restore Script for Product Detail Pages
# ─────────────────────────────────────────────────────────────
# Restores ONLY files modified/created during the Product Detail Pages task.
# Leaves all unrelated workspace code intact.
# ══════════════════════════════════════════════════════════════

Write-Host "Restoring pre-product pages baseline..." -ForegroundColor Cyan

# 1. Restore MotionNavbar from backup
if (Test-Path ".backups/MotionNavbar.pre_products.tsx") {
    Copy-Item ".backups/MotionNavbar.pre_products.tsx" "src/components/motion/MotionNavbar.tsx" -Force
    Write-Host "✓ Restored src/components/motion/MotionNavbar.tsx" -ForegroundColor Green
}

# 2. Remove product pages routes
if (Test-Path "src/app/products") {
    Remove-Item -Recurse -Force "src/app/products"
    Write-Host "✓ Removed src/app/products/" -ForegroundColor Green
}

# 3. Remove product detail components
if (Test-Path "src/components/product-detail") {
    Remove-Item -Recurse -Force "src/components/product-detail"
    Write-Host "✓ Removed src/components/product-detail/" -ForegroundColor Green
}

# 4. Remove product data library
if (Test-Path "src/lib/productData.ts") {
    Remove-Item -Force "src/lib/productData.ts"
    Write-Host "✓ Removed src/lib/productData.ts" -ForegroundColor Green
}

Write-Host "✓ Successfully undone all product detail pages changes." -ForegroundColor Green
