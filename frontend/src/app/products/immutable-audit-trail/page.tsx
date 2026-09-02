import React from 'react';
import { ALL_PRODUCTS } from '@/lib/productData';
import { ProductDetailShell } from '@/components/product-detail/ProductDetailShell';

export default function ImmutableAuditTrailPage() {
  const product = ALL_PRODUCTS['immutable-audit-trail'];
  return <ProductDetailShell product={product} />;
}
