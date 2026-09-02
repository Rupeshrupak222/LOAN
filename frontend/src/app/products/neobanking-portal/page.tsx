import React from 'react';
import { ALL_PRODUCTS } from '@/lib/productData';
import { ProductDetailShell } from '@/components/product-detail/ProductDetailShell';

export default function NeobankingPortalPage() {
  const product = ALL_PRODUCTS['neobanking-portal'];
  return <ProductDetailShell product={product} />;
}
