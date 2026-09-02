import React from 'react';
import { ALL_PRODUCTS } from '@/lib/productData';
import { ProductDetailShell } from '@/components/product-detail/ProductDetailShell';

export default function CrossBorderWirePage() {
  const product = ALL_PRODUCTS['cross-border-wire'];
  return <ProductDetailShell product={product} />;
}
