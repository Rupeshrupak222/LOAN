import React from 'react';
import { Metadata } from 'next';
import { PricingPolicyManagement } from '@/features/offers';

export const metadata: Metadata = {
  title: 'Pricing & Offer Policies | Adyapan Lending OS',
  description: 'Manage lending pricing policies, risk-based spreads, and statutory fee schedules',
};

export default function PricingPoliciesPage() {
  return <PricingPolicyManagement />;
}
