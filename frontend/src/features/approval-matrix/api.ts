import { api } from '@/lib/api';
import {
  ApprovalAuthorityPolicy,
  CreateAuthorityPolicyDto,
  UpdateAuthorityPolicyDto,
  ApprovalTask,
  AuthorityDelegation,
  CreateDelegationDto,
  ResolvedAuthorityResult,
  ApprovalSnapshotRecord,
  SubmitApprovalActionDto,
} from './types';

export const approvalAuthorityApi = {
  // Policy Management
  getPolicies: async (params?: { status?: string; search?: string }): Promise<ApprovalAuthorityPolicy[]> => {
    const res = await api.get('/approval-authorities/policies', { params });
    return res.data?.data || res.data || [];
  },

  getPolicy: async (id: string): Promise<ApprovalAuthorityPolicy> => {
    const res = await api.get(`/approval-authorities/policies/${id}`);
    return res.data?.data || res.data;
  },

  createPolicy: async (dto: CreateAuthorityPolicyDto): Promise<ApprovalAuthorityPolicy> => {
    const res = await api.post('/approval-authorities/policies', dto);
    return res.data?.data || res.data;
  },

  updatePolicy: async (id: string, dto: UpdateAuthorityPolicyDto): Promise<ApprovalAuthorityPolicy> => {
    const res = await api.put(`/approval-authorities/policies/${id}`, dto);
    return res.data?.data || res.data;
  },

  createPolicyVersion: async (id: string): Promise<ApprovalAuthorityPolicy> => {
    const res = await api.post(`/approval-authorities/policies/${id}/versions`);
    return res.data?.data || res.data;
  },

  activatePolicy: async (id: string): Promise<ApprovalAuthorityPolicy> => {
    const res = await api.post(`/approval-authorities/policies/${id}/activate`);
    return res.data?.data || res.data;
  },

  archivePolicy: async (id: string): Promise<ApprovalAuthorityPolicy> => {
    const res = await api.post(`/approval-authorities/policies/${id}/archive`);
    return res.data?.data || res.data;
  },

  // Authority Resolution & Tasks
  resolveAuthority: async (applicationId: string): Promise<ResolvedAuthorityResult> => {
    const res = await api.post(`/approval-authorities/applications/${applicationId}/resolve-authority`);
    return res.data?.data || res.data;
  },

  getApprovalQueue: async (params?: { tab?: string; search?: string }): Promise<ApprovalTask[]> => {
    const res = await api.get('/approval-queue/queue', { params });
    return res.data?.data || res.data || [];
  },

  getApprovalTask: async (taskId: string): Promise<ApprovalTask> => {
    const res = await api.get(`/approval-tasks/tasks/${taskId}`);
    return res.data?.data || res.data;
  },

  submitTaskAction: async (taskId: string, dto: SubmitApprovalActionDto): Promise<ApprovalTask> => {
    const res = await api.post(`/approval-tasks/tasks/${taskId}/action`, dto);
    return res.data?.data || res.data;
  },

  getApplicationApprovalHistory: async (applicationId: string): Promise<ApprovalSnapshotRecord[]> => {
    const res = await api.get(`/approval-authorities/applications/${applicationId}/history`);
    return res.data?.data || res.data || [];
  },

  // Delegations
  getDelegations: async (): Promise<AuthorityDelegation[]> => {
    const res = await api.get('/delegations/delegations');
    return res.data?.data || res.data || [];
  },

  createDelegation: async (dto: CreateDelegationDto): Promise<AuthorityDelegation> => {
    const res = await api.post('/delegations/delegations', dto);
    return res.data?.data || res.data;
  },

  revokeDelegation: async (delegationId: string): Promise<AuthorityDelegation> => {
    const res = await api.post(`/delegations/delegations/${delegationId}/revoke`);
    return res.data?.data || res.data;
  },
};
