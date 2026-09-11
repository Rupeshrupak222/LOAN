import { api } from '@/lib/api';
import type {
  BorrowerProfile,
  BorrowerLendingProduct,
  BorrowerApplicationSummary,
  BorrowerLoanOffer,
  BorrowerContractAgreement,
  BorrowerLoanSummary,
  BorrowerCreditFacility,
  BorrowerDrawdownItem,
  BorrowerDocumentItem,
  CreateBorrowerApplicationDto,
} from './types';

export const borrowerApi = {
  // 1. Borrower Profile & Account
  async getMyProfile(): Promise<BorrowerProfile> {
    const res = await api.get('/customers/me');
    return res.data?.data || res.data;
  },

  async updateMyProfile(data: Partial<BorrowerProfile>): Promise<BorrowerProfile> {
    const me = await this.getMyProfile();
    const res = await api.patch(`/customers/${me.id}`, data);
    return res.data?.data || res.data;
  },

  // 2. Products Discovery
  async getAvailableProducts(): Promise<BorrowerLendingProduct[]> {
    const res = await api.get('/loan-products');
    const items = res.data?.data || res.data || [];
    return items.filter((p: any) => p.isActive);
  },

  async getProductById(id: string): Promise<BorrowerLendingProduct> {
    const res = await api.get(`/loan-products/${id}`);
    return res.data?.data || res.data;
  },

  // 3. Application Lifecycle
  async createApplication(data: CreateBorrowerApplicationDto): Promise<BorrowerApplicationSummary> {
    const res = await api.post('/applications', data);
    return res.data?.data || res.data;
  },

  async getApplicationById(id: string): Promise<BorrowerApplicationSummary> {
    const res = await api.get(`/applications/${id}`);
    return res.data?.data || res.data;
  },

  async updateDraftApplication(id: string, data: Partial<CreateBorrowerApplicationDto>): Promise<BorrowerApplicationSummary> {
    const res = await api.patch(`/applications/${id}`, data);
    return res.data?.data || res.data;
  },

  async submitApplication(id: string): Promise<BorrowerApplicationSummary> {
    const res = await api.post(`/applications/${id}/submit`);
    return res.data?.data || res.data;
  },

  // 4. Offer Engine & KFS
  async getOffersByApplication(applicationId: string): Promise<BorrowerLoanOffer[]> {
    const res = await api.get(`/offers/application/${applicationId}`);
    return res.data?.data || res.data || [];
  },

  async getOfferById(id: string): Promise<BorrowerLoanOffer> {
    const res = await api.get(`/offers/${id}`);
    return res.data?.data || res.data;
  },

  async acceptOffer(offerId: string, kfsAcknowledged: boolean = true): Promise<BorrowerLoanOffer> {
    const res = await api.post(`/offers/${offerId}/accept`, { kfsAcknowledged });
    return res.data?.data || res.data;
  },

  async declineOffer(offerId: string, reason?: string): Promise<BorrowerLoanOffer> {
    const res = await api.post(`/offers/${offerId}/decline`, { reason });
    return res.data?.data || res.data;
  },

  // 5. Digital Contracts, eSign & Mandate
  async getKfs(applicationId: string): Promise<any> {
    const res = await api.get(`/contracts/kfs/${applicationId}`);
    return res.data?.data || res.data;
  },

  async generateDigitalAgreement(applicationId: string): Promise<BorrowerContractAgreement> {
    const res = await api.post(`/contracts/agreement/${applicationId}`);
    return res.data?.data || res.data;
  },

  async initiateESign(applicationId: string, provider: string = 'AADHAAR_ESIGN'): Promise<any> {
    const res = await api.post('/contracts/esign/initiate', { applicationId, provider });
    return res.data?.data || res.data;
  },

  async completeESign(sessionId: string): Promise<any> {
    const res = await api.post(`/contracts/esign/complete/${sessionId}`, { status: 'SUCCESS' });
    return res.data?.data || res.data;
  },

  async initiateMandate(applicationId: string, bankAccountId?: string): Promise<any> {
    const res = await api.post('/contracts/mandate/initiate', { applicationId, bankAccountId });
    return res.data?.data || res.data;
  },

  async verifyMandate(mandateId: string): Promise<any> {
    const res = await api.post(`/contracts/mandate/verify/${mandateId}`, { status: 'ACTIVE' });
    return res.data?.data || res.data;
  },

  // 6. Loans & Repayments
  async getMyLoans(): Promise<BorrowerLoanSummary[]> {
    const profile = await this.getMyProfile();
    return profile.loans || [];
  },

  async getLoanById(id: string): Promise<BorrowerLoanSummary> {
    const res = await api.get(`/loans/${id}`);
    return res.data?.data || res.data;
  },

  async payEmi(loanId: string, data: { amount: number; method: string; reference?: string }): Promise<any> {
    const res = await api.post('/payments', { loanId, ...data });
    return res.data?.data || res.data;
  },

  // 7. Credit Facility & Drawdowns
  async getCreditFacilities(): Promise<BorrowerCreditFacility[]> {
    const res = await api.get('/credit-facilities');
    return res.data?.data || res.data || [];
  },

  async requestDrawdown(facilityId: string, requestedAmount: number, tenureMonths: number = 12): Promise<BorrowerDrawdownItem> {
    const res = await api.post(`/credit-facilities/${facilityId}/drawdowns`, {
      requestedAmount,
      tenureMonths,
      purpose: 'Borrower Credit Line Drawdown',
    });
    return res.data?.data || res.data;
  },

  // 8. Documents
  async getMyDocuments(): Promise<BorrowerDocumentItem[]> {
    const profile = await this.getMyProfile();
    return profile.documents || [];
  },

  async uploadDocument(formData: FormData): Promise<BorrowerDocumentItem> {
    const res = await api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data || res.data;
  },
};
