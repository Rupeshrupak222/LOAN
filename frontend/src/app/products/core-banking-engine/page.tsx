import React from 'react';
import { ALL_PRODUCTS } from '@/lib/productData';
import { ProductDetailShell } from '@/components/product-detail/ProductDetailShell';

export default function CoreBankingEnginePage() {
  const product = ALL_PRODUCTS['core-banking-engine'];
  return <ProductDetailShell product={product} />;
}
