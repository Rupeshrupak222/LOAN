import React from 'react';
import { ALL_PRODUCTS } from '@/lib/productData';
import { ProductDetailShell } from '@/components/product-detail/ProductDetailShell';

export default function CreditLineUpiPage() {
  const product = ALL_PRODUCTS['credit-line-upi'];
  return <ProductDetailShell product={product} />;
}
