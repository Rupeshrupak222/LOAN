import React from 'react';
import { ALL_PRODUCTS } from '@/lib/productData';
import { ProductDetailShell } from '@/components/product-detail/ProductDetailShell';

export default function AutomatedDtiPolicyPage() {
  const product = ALL_PRODUCTS['automated-dti-policy'];
  return <ProductDetailShell product={product} />;
}
