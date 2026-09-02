import React from 'react';
import { ALL_PRODUCTS } from '@/lib/productData';
import { ProductDetailShell } from '@/components/product-detail/ProductDetailShell';

export default function ConnectApiGatewayPage() {
  const product = ALL_PRODUCTS['connect-api-gateway'];
  return <ProductDetailShell product={product} />;
}
