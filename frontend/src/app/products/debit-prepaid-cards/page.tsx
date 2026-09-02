import React from 'react';
import { ALL_PRODUCTS } from '@/lib/productData';
import { ProductDetailShell } from '@/components/product-detail/ProductDetailShell';

export default function DebitPrepaidCardsPage() {
  const product = ALL_PRODUCTS['debit-prepaid-cards'];
  return <ProductDetailShell product={product} />;
}
