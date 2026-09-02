import React from 'react';
import { ALL_PRODUCTS } from '@/lib/productData';
import { ProductDetailShell } from '@/components/product-detail/ProductDetailShell';

export default function HomeMortgagesPage() {
  const product = ALL_PRODUCTS['home-mortgages'];
  return <ProductDetailShell product={product} />;
}
