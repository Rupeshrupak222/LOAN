import React from 'react';
import { Metadata } from 'next';
import { OfferManagementList } from '@/features/offers';

export const metadata: Metadata = {
  title: 'Loan Offers | Adyapan Lending OS',
  description: 'Manage, simulate, and inspect RBI-compliant versioned loan offers and Key Fact Statements',
};

export default function OffersPage() {
  return <OfferManagementList />;
}
