import React from 'react';
import { ALL_PRODUCTS } from '@/lib/productData';
import { ProductDetailShell } from '@/components/product-detail/ProductDetailShell';

export default function BnplPage() {
  const product = ALL_PRODUCTS['bnpl'];
  return <ProductDetailShell product={product} />;
}
