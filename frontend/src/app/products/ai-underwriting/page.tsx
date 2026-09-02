import React from 'react';
import { ALL_PRODUCTS } from '@/lib/productData';
import { ProductDetailShell } from '@/components/product-detail/ProductDetailShell';

export default function AiUnderwritingPage() {
  const product = ALL_PRODUCTS['ai-underwriting'];
  return <ProductDetailShell product={product} />;
}
