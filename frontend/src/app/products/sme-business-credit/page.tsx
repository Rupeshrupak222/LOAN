import React from 'react';
import { ALL_PRODUCTS } from '@/lib/productData';
import { ProductDetailShell } from '@/components/product-detail/ProductDetailShell';

export default function SmeBusinessCreditPage() {
  const product = ALL_PRODUCTS['sme-business-credit'];
  return <ProductDetailShell product={product} />;
}
