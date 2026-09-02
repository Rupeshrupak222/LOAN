import React from 'react';
import { ALL_PRODUCTS } from '@/lib/productData';
import { ProductDetailShell } from '@/components/product-detail/ProductDetailShell';

export default function NpciUpiNetworkPage() {
  const product = ALL_PRODUCTS['npci-upi-network'];
  return <ProductDetailShell product={product} />;
}
