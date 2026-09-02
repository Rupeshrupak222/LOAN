import React from 'react';
import { ALL_PRODUCTS } from '@/lib/productData';
import { ProductDetailShell } from '@/components/product-detail/ProductDetailShell';

export default function MerchantQrSoundboxPage() {
  const product = ALL_PRODUCTS['merchant-qr-soundbox'];
  return <ProductDetailShell product={product} />;
}
