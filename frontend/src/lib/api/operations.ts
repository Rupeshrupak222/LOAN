import { api } from '../api';

export interface OperationsOverviewMetrics {
  applicationsToday: number;
  pendingApplications: number;
  assignedToMe: number;
  overdueTasks: number;
  pendingDocuments: number;
  requiresAction: number;
  stageDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
}

export interface ListApplicationsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  stage?: string;
  status?: string;
  priority?: string;
  assignedToUserId?: string;
  queueId?: string;
  productId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface CreateApplicationPayload {
  customerId: string;
  productId: string;
  requestedAmount: number;
  tenureMonths: number;
  branchId?: string;
  purpose?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  autoSubmit?: boolean;
}

export interface DocumentVerificationPayload {
  status: 'VERIFIED' | 'REJECTED';
  notes?: string;
  rejectionReason?: string;
}

export const operationsApi = {
  // 1. Overview
  getOverview: async () => {
    const res = await api.get('/operations/overview');
    return res.data?.data as OperationsOverviewMetrics;
  },

  // 2. Applications Directory
  listApplications: async (params?: ListApplicationsQuery) => {
    const res = await api.get('/operations/applications', { params });
    return {
      data: res.data?.data || [],
      meta: res.data?.meta || { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    };
  },

  // 3. Application Detail
  getApplicationDetails: async (id: string) => {
    const res = await api.get(`/operations/applications/${id}`);
    return res.data?.data;
  },

  // 4. Create Application
  createApplication: async (payload: CreateApplicationPayload) => {
    const res = await api.post('/operations/applications', payload);
    return res.data?.data;
  },

  // 5. Submit Application
  submitApplication: async (id: string) => {
    const res = await api.post(`/operations/applications/${id}/submit`);
    return res.data?.data;
  },

  // 6. Transition Stage
  transitionStage: async (id: string, stage: string, status?: string, reason?: string, expectedUpdatedAt?: string) => {
    const res = await api.post(`/operations/applications/${id}/stage`, {
      stage,
      status,
      reason,
      expectedUpdatedAt,
    });
    return res.data?.data;
  },

  // 7. Assign Application
  assignApplication: async (
    id: string,
    payload: { userId?: string; queueKey?: string; notes?: string; priority?: string }
  ) => {
    const res = await api.post(`/operations/applications/${id}/assign`, payload);
    return res.data?.data;
  },

  // 8. Update Priority
  updatePriority: async (id: string, priority: string) => {
    const res = await api.post(`/operations/applications/${id}/priority`, { priority });
    return res.data?.data;
  },

  // 9. Team Queue & Claiming
  getTeamQueue: async (params?: { queueKey?: string; priority?: string; page?: number; pageSize?: number }) => {
    const res = await api.get('/operations/queue', { params });
    return {
      data: res.data?.data || [],
      meta: res.data?.meta || { page: 1, pageSize: 20, total: 0, totalPages: 1 },
      queues: res.data?.queues || [],
    };
  },

  claimQueueItem: async (id: string) => {
    const res = await api.post(`/operations/queue/${id}/claim`);
    return res.data?.data;
  },

  // 10. Documents
  verifyDocument: async (documentId: string, payload: DocumentVerificationPayload) => {
    const res = await api.post(`/operations/documents/${documentId}/verify`, payload);
    return res.data?.data;
  },

  // 11. Customer Directory & 360
  listCustomers: async (params?: { search?: string; page?: number; pageSize?: number }) => {
    const res = await api.get('/operations/customers', { params });
    return {
      data: res.data?.data || [],
      meta: res.data?.meta || { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    };
  },

  getCustomer360: async (customerId: string) => {
    const res = await api.get(`/operations/customers/${customerId}`);
    return res.data?.data;
  },

  // 12. Tasks
  listMyTasks: async (params?: { status?: string; priority?: string; isOverdue?: boolean; page?: number }) => {
    const res = await api.get('/operations/tasks/my', { params });
    return {
      data: res.data?.data || [],
      pagination: res.data?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    };
  },

  createTask: async (payload: {
    title: string;
    description?: string;
    taskType: string;
    entityType: string;
    entityId: string;
    assignedToUserId?: string;
    priority?: string;
    dueAt?: string;
  }) => {
    const res = await api.post('/operations/tasks', payload);
    return res.data?.data;
  },

  updateTaskStatus: async (taskId: string, status: string) => {
    const res = await api.patch(`/operations/tasks/${taskId}/status`, { status });
    return res.data?.data;
  },

  // 13. Activity Timeline
  addActivityNote: async (applicationId: string, message: string, title?: string) => {
    const res = await api.post(`/operations/applications/${applicationId}/activity`, { message, title });
    return res.data?.data;
  },
};
