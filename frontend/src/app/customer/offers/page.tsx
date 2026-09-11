import React from 'react';
import { Metadata } from 'next';
import { CustomerOfferAcceptanceView } from '@/features/offers';

export const metadata: Metadata = {
  title: 'My Loan Offer | Adyapan Lending OS',
  description: 'Review and accept your pre-approved loan offer, Key Fact Statement (KFS), and terms',
};

export default function CustomerOffersPage() {
  return <CustomerOfferAcceptanceView />;
}
