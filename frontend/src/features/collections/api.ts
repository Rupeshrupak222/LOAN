import { api } from '@/lib/api';
import type {
  CollectionCaseDetail,
  CollectionCaseSummary,
  CollectionDashboardData,
  CollectionStrategy,
  CollectorScorecard,
  RollForwardMetric,
} from './types';

export const collectionsApi = {
  getDashboard: async (options?: { dateFilter?: string; startDate?: string; endDate?: string }): Promise<CollectionDashboardData> => {
    const res = await api.get('/collections/dashboard', { params: options });
    return res.data?.data;
  },

  listCases: async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    bucket?: string;
    status?: string;
    queueType?: 'MY_QUEUE' | 'TEAM_QUEUE' | 'UNASSIGNED';
  }): Promise<{ data: CollectionCaseSummary[]; pagination: any }> => {
    const res = await api.get('/collections/cases', { params });
    return {
      data: res.data?.data || [],
      pagination: res.data?.pagination,
    };
  },

  getCaseDetail: async (id: string): Promise<CollectionCaseDetail> => {
    const res = await api.get(`/collections/cases/${id}`);
    return res.data?.data;
  },

  logActivity: async (data: {
    caseId: string;
    activityType: string;
    outcome: string;
    notes: string;
    nextFollowUpDate?: string;
  }) => {
    const res = await api.post('/collections/activities', data);
    return res.data?.data;
  },

  recordPtp: async (data: {
    caseId: string;
    promisedAmount: number;
    promisedDate: string;
    paymentMode?: string;
    notes?: string;
  }) => {
    const res = await api.post('/collections/ptp', data);
    return res.data?.data;
  },

  assignCase: async (caseId: string, data: { assignedToUserId: string; strategy?: string; notes?: string }) => {
    const res = await api.post(`/collections/cases/${caseId}/assign`, data);
    return res.data?.data;
  },

  autoAssign: async (data?: { tenantId?: string; branchId?: string; strategy?: string }) => {
    const res = await api.post('/collections/auto-assign', data || {});
    return res.data?.data;
  },

  createFollowUp: async (data: {
    caseId: string;
    assignedToUserId?: string;
    dueDate: string;
    priority?: string;
    actionTitle: string;
    notes?: string;
  }) => {
    const res = await api.post('/collections/follow-ups', data);
    return res.data?.data;
  },

  completeFollowUp: async (id: string, completedNotes?: string) => {
    const res = await api.post(`/collections/follow-ups/${id}/complete`, { completedNotes });
    return res.data?.data;
  },

  escalateCase: async (caseId: string, data: {
    triggerReason: string;
    toTier: string;
    escalatedToUserId?: string;
    notes?: string;
  }) => {
    const res = await api.post(`/collections/cases/${caseId}/escalate`, data);
    return res.data?.data;
  },

  proposeSettlement: async (data: {
    caseId: string;
    proposedSettlementAmount: number;
    waivedPenalties?: number;
    waivedInterest?: number;
    waivedPrincipal?: number;
    reason: string;
    validityDays?: number;
  }) => {
    const res = await api.post('/collections/settlements', data);
    return res.data?.data;
  },

  authorizeSettlement: async (id: string, data: { action: 'APPROVE' | 'REJECT'; rejectionReason?: string }) => {
    const res = await api.post(`/collections/settlements/${id}/authorize`, data);
    return res.data?.data;
  },

  proposeWriteOff: async (data: {
    caseId: string;
    reason: string;
    recoveryExhaustionSummary: string;
  }) => {
    const res = await api.post('/collections/write-offs', data);
    return res.data?.data;
  },

  authorizeWriteOff: async (id: string, data: { action: 'APPROVE' | 'REJECT'; rejectionReason?: string }) => {
    const res = await api.post(`/collections/write-offs/${id}/authorize`, data);
    return res.data?.data;
  },

  listStrategies: async (): Promise<CollectionStrategy[]> => {
    const res = await api.get('/collections/strategies');
    return res.data?.data || [];
  },

  createStrategy: async (data: any): Promise<CollectionStrategy> => {
    const res = await api.post('/collections/strategies', data);
    return res.data?.data;
  },

  activateStrategy: async (id: string): Promise<CollectionStrategy> => {
    const res = await api.post(`/collections/strategies/${id}/activate`, {});
    return res.data?.data;
  },

  getAnalytics: async (): Promise<{
    summary: any;
    agingBuckets: any[];
    rollForwardMatrix: RollForwardMetric[];
  }> => {
    const res = await api.get('/collections/analytics');
    return res.data?.data;
  },

  getPerformance: async (): Promise<CollectorScorecard[]> => {
    const res = await api.get('/collections/performance');
    return res.data?.data || [];
  },
};
