import { api } from '@/lib/api';
import type {
  LoanOffer,
  PricingPolicy,
  CreatePricingPolicyDto,
  OfferSimulationInput,
  OfferSimulationResult,
  GenerateOfferDto,
  AcceptOfferDto,
  DeclineOfferDto,
} from './types';

export const offersApi = {
  // 1. Offer Management
  async listOffers(params?: { status?: string; search?: string; customerId?: string }): Promise<LoanOffer[]> {
    const res = await api.get('/offers', { params });
    return res.data?.data || res.data || [];
  },

  async getOfferById(id: string): Promise<LoanOffer> {
    const res = await api.get(`/offers/${id}`);
    return res.data?.data || res.data;
  },

  async getApplicationOffers(applicationId: string): Promise<LoanOffer[]> {
    const res = await api.get(`/offers/applications/${applicationId}/offers`);
    return res.data?.data || res.data || [];
  },

  async generateOffer(applicationId: string, data?: GenerateOfferDto): Promise<LoanOffer> {
    const res = await api.post(
      `/offers/applications/${applicationId}/generate`,
      data
    );
    return res.data?.data || res.data;
  },

  async acceptOffer(offerId: string, data: AcceptOfferDto): Promise<LoanOffer> {
    const res = await api.post(`/offers/${offerId}/accept`, data);
    return res.data?.data || res.data;
  },

  async declineOffer(offerId: string, data: DeclineOfferDto): Promise<LoanOffer> {
    const res = await api.post(`/offers/${offerId}/decline`, data);
    return res.data?.data || res.data;
  },

  async cancelOffer(offerId: string, reason: string): Promise<LoanOffer> {
    const res = await api.post(`/offers/${offerId}/cancel`, { reason });
    return res.data?.data || res.data;
  },

  // 2. Offer Simulator
  async simulateOffer(data: OfferSimulationInput): Promise<OfferSimulationResult> {
    const res = await api.post('/offers/simulate', data);
    return res.data?.data || res.data;
  },

  // 3. Pricing Policy Management
  async listPricingPolicies(params?: { status?: string; search?: string }): Promise<PricingPolicy[]> {
    const res = await api.get('/pricing-policies', { params });
    return res.data?.data || res.data || [];
  },

  async getPricingPolicyById(id: string): Promise<PricingPolicy> {
    const res = await api.get(`/pricing-policies/${id}`);
    return res.data?.data || res.data;
  },

  async createPricingPolicy(data: CreatePricingPolicyDto): Promise<PricingPolicy> {
    const res = await api.post('/pricing-policies', data);
    return res.data?.data || res.data;
  },

  async createPolicyVersion(id: string): Promise<PricingPolicy> {
    const res = await api.post(`/pricing-policies/${id}/versions`);
    return res.data?.data || res.data;
  },

  async activatePricingPolicy(id: string): Promise<PricingPolicy> {
    const res = await api.post(`/pricing-policies/${id}/activate`);
    return res.data?.data || res.data;
  },
};
