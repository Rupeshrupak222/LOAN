import { api } from '@/lib/api';
import type {
  CreditFacility,
  CreditLimitPolicy,
  CreateCreditLimitPolicyDto,
  CreditFacilityTransaction,
  LimitAdjustmentRecord,
  Drawdown,
  CustomerExposureSummary,
  RequestDrawdownDto,
  LimitAdjustmentDto,
  CreditLimitSimulationInput,
  CreditLimitSimulationResult,
} from './types';

export const creditLimitsApi = {
  // 1. Facility Retrieval & Management
  async listFacilities(params?: { status?: string; search?: string; customerId?: string }): Promise<CreditFacility[]> {
    const res = await api.get('/credit-facilities', { params });
    return res.data?.data || res.data || [];
  },

  async getFacilityById(id: string): Promise<CreditFacility> {
    const res = await api.get(`/credit-facilities/${id}`);
    return res.data?.data || res.data;
  },

  async getCustomerExposure(customerId: string): Promise<CustomerExposureSummary> {
    const res = await api.get(`/credit-facilities/customer/${customerId}/exposure`);
    return res.data?.data || res.data;
  },

  async createFacilityFromOffer(offerId: string): Promise<CreditFacility> {
    const res = await api.post(`/credit-facilities/from-offer/${offerId}`);
    return res.data?.data || res.data;
  },

  // 2. Drawdowns
  async requestDrawdown(facilityId: string, data: RequestDrawdownDto): Promise<Drawdown> {
    const res = await api.post(`/credit-facilities/${facilityId}/drawdowns`, data);
    return res.data?.data || res.data;
  },

  async listDrawdowns(): Promise<Drawdown[]> {
    const res = await api.get('/drawdowns');
    return res.data?.data || res.data || [];
  },

  // 3. Transactions & Adjustments
  async getTransactions(facilityId: string): Promise<CreditFacilityTransaction[]> {
    const res = await api.get(`/credit-facilities/${facilityId}/transactions`);
    return res.data?.data || res.data || [];
  },

  async getAdjustments(facilityId: string): Promise<LimitAdjustmentRecord[]> {
    const res = await api.get(`/credit-facilities/${facilityId}/adjustments`);
    return res.data?.data || res.data || [];
  },

  async adjustLimit(facilityId: string, data: LimitAdjustmentDto): Promise<CreditFacility> {
    const res = await api.post(`/credit-facilities/${facilityId}/adjust`, data);
    return res.data?.data || res.data;
  },

  async increaseLimit(facilityId: string, data: { newLimit: number; reasonCode: string; comments: string }): Promise<CreditFacility> {
    const res = await api.post(`/credit-facilities/${facilityId}/increase`, data);
    return res.data?.data || res.data;
  },

  async decreaseLimit(facilityId: string, data: { newLimit: number; reasonCode: string; comments: string }): Promise<CreditFacility> {
    const res = await api.post(`/credit-facilities/${facilityId}/decrease`, data);
    return res.data?.data || res.data;
  },

  // 4. Operational Risk Actions
  async suspendFacility(facilityId: string, reason: string): Promise<CreditFacility> {
    const res = await api.post(`/credit-facilities/${facilityId}/suspend`, { reason });
    return res.data?.data || res.data;
  },

  async freezeFacility(facilityId: string, reason: string): Promise<CreditFacility> {
    const res = await api.post(`/credit-facilities/${facilityId}/freeze`, { reason });
    return res.data?.data || res.data;
  },

  async resumeFacility(facilityId: string, reason: string): Promise<CreditFacility> {
    const res = await api.post(`/credit-facilities/${facilityId}/resume`, { reason });
    return res.data?.data || res.data;
  },

  async closeFacility(facilityId: string, reason: string): Promise<CreditFacility> {
    const res = await api.post(`/credit-facilities/${facilityId}/close`, { reason });
    return res.data?.data || res.data;
  },

  // 5. Simulator
  async simulateLimit(data: CreditLimitSimulationInput): Promise<CreditLimitSimulationResult> {
    const res = await api.post('/credit-facilities/simulate', data);
    return res.data?.data || res.data;
  },

  // 6. Policy Management
  async listPolicies(tenantId?: string): Promise<CreditLimitPolicy[]> {
    const res = await api.get('/credit-policies', { params: { tenantId } });
    return res.data?.data || res.data || [];
  },

  async getPolicyById(id: string): Promise<CreditLimitPolicy> {
    const res = await api.get(`/credit-policies/${id}`);
    return res.data?.data || res.data;
  },

  async createPolicy(data: CreateCreditLimitPolicyDto): Promise<CreditLimitPolicy> {
    const res = await api.post('/credit-policies', data);
    return res.data?.data || res.data;
  },
};
