import { api } from '@/lib/api';
import type {
  PaymentItem,
  PayoutItem,
  DisputeItem,
  SettlementBatchItem,
  CustomerSafeReceipt,
} from './types';

export const paymentsApi = {
  // Payments
  getPayments: async (params?: { page?: number; pageSize?: number; search?: string; loanId?: string }): Promise<{ data: PaymentItem[]; pagination: any }> => {
    const res = await api.get('/payments', { params });
    return res.data?.data ? res.data : { data: res.data || [], pagination: {} };
  },

  getPaymentDetail: async (id: string): Promise<PaymentItem> => {
    const res = await api.get(`/payments/${id}`);
    return res.data?.data || res.data;
  },

  initiatePayment: async (data: {
    loanId?: string;
    customerId?: string;
    amount: number;
    method?: string;
    type?: string;
    notes?: string;
  }): Promise<{ paymentId: string; paymentNo: string; checkoutUrl?: string; providerOrderId?: string }> => {
    const res = await api.post('/payments/initiate', data);
    return res.data?.data || res.data;
  },

  confirmPayment: async (paymentId: string, data?: { providerPaymentId?: string; utrNumber?: string }): Promise<any> => {
    const res = await api.post(`/payments/${paymentId}/confirm`, data || {});
    return res.data?.data || res.data;
  },

  processRefund: async (paymentId: string, data: { amount: number; reason: string; comments?: string }): Promise<any> => {
    const res = await api.post(`/payments/${paymentId}/refund`, data);
    return res.data?.data || res.data;
  },

  reversePayment: async (paymentId: string, data: { reason: string; comments?: string }): Promise<any> => {
    const res = await api.post(`/payments/${paymentId}/reverse`, data);
    return res.data?.data || res.data;
  },

  getCustomerSafeReceipt: async (paymentId: string): Promise<CustomerSafeReceipt> => {
    const res = await api.get(`/payments/${paymentId}/customer-safe`);
    return res.data?.data || res.data;
  },

  // Payouts
  getPayouts: async (params?: { loanId?: string; status?: string }): Promise<PayoutItem[]> => {
    const res = await api.get('/payments/payouts', { params });
    return res.data?.data || res.data || [];
  },

  getPayoutDetail: async (id: string): Promise<PayoutItem> => {
    const res = await api.get(`/payments/payouts/${id}`);
    return res.data?.data || res.data;
  },

  initiatePayout: async (data: {
    loanId?: string;
    amount?: number;
    beneficiaryName?: string;
    beneficiaryAccountNo?: string;
    beneficiaryIfsc?: string;
  }): Promise<PayoutItem> => {
    const res = await api.post('/payments/payouts/initiate', data);
    return res.data?.data || res.data;
  },

  // Disputes
  getDisputes: async (params?: { paymentId?: string; status?: string }): Promise<DisputeItem[]> => {
    const res = await api.get('/payments/disputes', { params });
    return res.data?.data || res.data || [];
  },

  createDispute: async (data: {
    paymentId: string;
    paymentNo: string;
    type: string;
    amount: number;
    reason: string;
  }): Promise<DisputeItem> => {
    const res = await api.post('/payments/disputes', data);
    return res.data?.data || res.data;
  },

  resolveDispute: async (
    id: string,
    data: { status: 'RESOLVED' | 'CLOSED'; resolutionNotes: string; acceptChargeback?: boolean }
  ): Promise<DisputeItem> => {
    const res = await api.post(`/payments/disputes/${id}/resolve`, data);
    return res.data?.data || res.data;
  },

  // Settlements
  getSettlementBatches: async (params?: { status?: string; providerCode?: string }): Promise<SettlementBatchItem[]> => {
    const res = await api.get('/reconciliation/settlements', { params });
    return res.data?.data || res.data || [];
  },

  createSettlementBatch: async (data: {
    providerCode: string;
    transactionCount: number;
    grossAmount: number;
    deductedFees?: number;
    contractedMdrPct?: number;
    utrNumber?: string;
  }): Promise<SettlementBatchItem> => {
    const res = await api.post('/reconciliation/settlements', data);
    return res.data?.data || res.data;
  },

  confirmSettlement: async (batchId: string, data?: { utrNumber?: string }): Promise<SettlementBatchItem> => {
    const res = await api.post(`/reconciliation/settlements/${batchId}/confirm`, data || {});
    return res.data?.data || res.data;
  },

  // Reconciliation
  runReconciliation: async (): Promise<{ scannedCount: number; exceptionsFound: number }> => {
    const res = await api.post('/reconciliation/run');
    return res.data?.data || res.data;
  },

  getReconciliationDashboard: async (): Promise<any> => {
    const res = await api.get('/reconciliation/dashboard');
    return res.data?.data || res.data;
  },

  getReconciliationExceptions: async (params?: { status?: string; severity?: string; type?: string }): Promise<any[]> => {
    const res = await api.get('/reconciliation/exceptions', { params });
    return res.data?.data || res.data || [];
  },

  proposeAdjustment: async (data: {
    type: string;
    loanId: string;
    exceptionId?: string;
    amount: number;
    reason: string;
  }): Promise<any> => {
    const res = await api.post('/reconciliation/adjustments', data);
    return res.data?.data || res.data;
  },

  approveAdjustment: async (id: string): Promise<any> => {
    const res = await api.post(`/reconciliation/adjustments/${id}/approve`);
    return res.data?.data || res.data;
  },

  rejectAdjustment: async (id: string, rejectionReason?: string): Promise<any> => {
    const res = await api.post(`/reconciliation/adjustments/${id}/reject`, { rejectionReason });
    return res.data?.data || res.data;
  },
};
