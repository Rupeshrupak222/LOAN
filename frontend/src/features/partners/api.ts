import { api } from '@/lib/api';
import type {
  PartnerEntity,
  PartnerApiCredential,
  PartnerWebhookSubscription,
  PartnerWebhookDelivery,
  PartnerApplicationMapping,
  PartnerPayoutSummary,
  PartnerStatus,
  PartnerScope,
  PartnerEnvironment,
} from './types';

export const partnersApi = {
  // Admin Partner Management
  async listPartners(): Promise<PartnerEntity[]> {
    const res = await api.get('/partners');
    return res.data?.data || res.data || [];
  },

  async getPartnerById(id: string): Promise<PartnerEntity> {
    const res = await api.get(`/partners/${id}`);
    return res.data?.data || res.data;
  },

  async registerPartner(data: Partial<PartnerEntity>): Promise<PartnerEntity> {
    const res = await api.post('/partners', data);
    return res.data?.data || res.data;
  },

  async updatePartner(id: string, data: Partial<PartnerEntity>): Promise<PartnerEntity> {
    const res = await api.put(`/partners/${id}`, data);
    return res.data?.data || res.data;
  },

  async updatePartnerStatus(id: string, status: PartnerStatus): Promise<PartnerEntity> {
    const res = await api.patch(`/partners/${id}/status`, { status });
    return res.data?.data || res.data;
  },

  async listCredentials(partnerId: string): Promise<PartnerApiCredential[]> {
    const res = await api.get(`/partners/${partnerId}/credentials`);
    return res.data?.data || res.data || [];
  },

  async createCredential(partnerId: string, data: { name: string; environment: PartnerEnvironment; scopes?: PartnerScope[] }): Promise<PartnerApiCredential> {
    const res = await api.post(`/partners/${partnerId}/credentials`, data);
    return res.data?.data || res.data;
  },

  async rotateSecret(partnerId: string, credentialId: string): Promise<PartnerApiCredential> {
    const res = await api.post(`/partners/${partnerId}/credentials/${credentialId}/rotate`);
    return res.data?.data || res.data;
  },

  async revokeCredential(partnerId: string, credentialId: string): Promise<PartnerApiCredential> {
    const res = await api.post(`/partners/${partnerId}/credentials/${credentialId}/revoke`);
    return res.data?.data || res.data;
  },

  async listWebhooks(partnerId: string): Promise<PartnerWebhookSubscription[]> {
    const res = await api.get(`/partners/${partnerId}/webhooks`);
    return res.data?.data || res.data || [];
  },

  async registerWebhook(partnerId: string, data: any): Promise<PartnerWebhookSubscription> {
    const res = await api.post(`/partners/${partnerId}/webhooks`, data);
    return res.data?.data || res.data;
  },

  async getPayoutSummary(partnerId: string): Promise<PartnerPayoutSummary> {
    const res = await api.get(`/partners/${partnerId}/payout-summary`);
    return res.data?.data || res.data;
  },

  async processPayoutBatch(partnerId: string): Promise<any> {
    const res = await api.post(`/partners/${partnerId}/payouts/batch`);
    return res.data?.data || res.data;
  },

  // Partner Portal & Developer APIs
  async getPartnerApplications(): Promise<PartnerApplicationMapping[]> {
    const res = await api.get('/partner-applications');
    return res.data?.data || res.data || [];
  },

  async getPartnerApplicationById(id: string): Promise<PartnerApplicationMapping> {
    const res = await api.get(`/partner-applications/${id}`);
    return res.data?.data || res.data;
  },

  async createPartnerApplication(data: any): Promise<PartnerApplicationMapping> {
    const res = await api.post('/partner-applications', data);
    return res.data?.data || res.data;
  },

  async submitPartnerApplication(id: string): Promise<any> {
    const res = await api.post(`/partner-applications/${id}/submit`);
    return res.data?.data || res.data;
  },

  async getPartnerOffer(partnerApplicationId: string): Promise<any> {
    const res = await api.get(`/partner-offers/${partnerApplicationId}`);
    return res.data?.data || res.data;
  },

  async acceptPartnerOffer(offerId: string): Promise<any> {
    const res = await api.post(`/partner-offers/${offerId}/accept`, { kfsAccepted: true, termsAccepted: true });
    return res.data?.data || res.data;
  },

  async getCreditFacility(customerId: string): Promise<any> {
    const res = await api.get(`/partner-credit-lines/customer/${customerId}`);
    return res.data?.data || res.data;
  },

  async requestDrawdown(facilityId: string, data: any): Promise<any> {
    const res = await api.post(`/partner-credit-lines/${facilityId}/drawdowns`, data);
    return res.data?.data || res.data;
  },

  async listWebhookDeliveries(): Promise<PartnerWebhookDelivery[]> {
    const res = await api.get('/partner-webhooks/deliveries');
    return res.data?.data || res.data || [];
  },

  async replayWebhookDelivery(deliveryId: string): Promise<any> {
    const res = await api.post(`/partner-webhooks/replay/${deliveryId}`);
    return res.data?.data || res.data;
  },

  async triggerTestPing(): Promise<any> {
    const res = await api.post('/partner-webhooks/test-ping');
    return res.data?.data || res.data;
  },

  async getPartnerReportsSummary(): Promise<any> {
    const res = await api.get('/partner-reports/summary');
    return res.data?.data || res.data;
  },
};
