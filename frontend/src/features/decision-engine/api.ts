import { api } from '@/lib/api';
import {
  DecisionPolicy,
  CreateDecisionPolicyDto,
  UpdateDecisionPolicyDto,
  DecisionResult,
  DecisionSnapshotRecord,
  DecisionSimulationInput,
  DecisionOutcome,
} from './types';

export const decisionEngineApi = {
  getPolicies: async (params?: { status?: string; search?: string }): Promise<DecisionPolicy[]> => {
    const res = await api.get('/decision-policies/policies', { params });
    return res.data?.data || res.data || [];
  },

  getPolicy: async (id: string): Promise<DecisionPolicy> => {
    const res = await api.get(`/decision-policies/policies/${id}`);
    return res.data?.data || res.data;
  },

  createPolicy: async (dto: CreateDecisionPolicyDto): Promise<DecisionPolicy> => {
    const res = await api.post('/decision-policies/policies', dto);
    return res.data?.data || res.data;
  },

  updatePolicy: async (id: string, dto: UpdateDecisionPolicyDto): Promise<DecisionPolicy> => {
    const res = await api.put(`/decision-policies/policies/${id}`, dto);
    return res.data?.data || res.data;
  },

  activatePolicy: async (id: string): Promise<DecisionPolicy> => {
    const res = await api.post(`/decision-policies/policies/${id}/activate`);
    return res.data?.data || res.data;
  },

  archivePolicy: async (id: string): Promise<DecisionPolicy> => {
    const res = await api.post(`/decision-policies/policies/${id}/archive`);
    return res.data?.data || res.data;
  },

  createPolicyVersion: async (id: string): Promise<DecisionPolicy> => {
    const res = await api.post(`/decision-policies/policies/${id}/versions`);
    return res.data?.data || res.data;
  },

  simulateDecision: async (input: DecisionSimulationInput): Promise<DecisionResult> => {
    const res = await api.post('/decision-engine/simulate', input);
    return res.data?.data || res.data;
  },

  evaluateApplication: async (applicationId: string): Promise<DecisionSnapshotRecord> => {
    const res = await api.post(`/decision-engine/evaluate/${applicationId}`);
    return res.data?.data || res.data;
  },

  getApplicationDecisions: async (applicationId: string): Promise<DecisionSnapshotRecord[]> => {
    const res = await api.get(`/decision-engine/applications/${applicationId}/decisions`);
    return res.data?.data || res.data || [];
  },

  getDecisionSnapshot: async (decisionId: string): Promise<DecisionSnapshotRecord> => {
    const res = await api.get(`/decision-engine/decisions/${decisionId}`);
    return res.data?.data || res.data;
  },

  overrideDecision: async (
    decisionId: string,
    payload: { newDecision: DecisionOutcome; reason: string; comments?: string }
  ): Promise<DecisionSnapshotRecord> => {
    const res = await api.post(`/decision-engine/decisions/${decisionId}/override`, payload);
    return res.data?.data || res.data;
  },
};
