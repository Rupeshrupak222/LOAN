import React from 'react';
import { ALL_PRODUCTS } from '@/lib/productData';
import { ProductDetailShell } from '@/components/product-detail/ProductDetailShell';

export default function PersonalLoansPage() {
  const product = ALL_PRODUCTS['personal-loans'];
  return <ProductDetailShell product={product} />;
}
