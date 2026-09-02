import React from 'react';
import { ALL_PRODUCTS } from '@/lib/productData';
import { ProductDetailShell } from '@/components/product-detail/ProductDetailShell';

export default function DigilockerEkycPage() {
  const product = ALL_PRODUCTS['digilocker-ekyc'];
  return <ProductDetailShell product={product} />;
}
