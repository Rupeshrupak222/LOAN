import React from 'react';
import { Metadata } from 'next';
import { OfferDetailView } from '@/features/offers';

export const metadata: Metadata = {
  title: 'Loan Offer Detail | Adyapan Lending OS',
  description: 'Detailed view of loan sanction breakdown, amortization schedule, and KFS terms',
};

interface OfferDetailPageProps {
  params: {
    id: string;
  };
}

export default function OfferDetailPage({ params }: OfferDetailPageProps) {
  return <OfferDetailView offerId={params.id} />;
}
