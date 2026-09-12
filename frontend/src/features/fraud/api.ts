import { api } from '@/lib/api';
import {
  FraudEvaluationResult,
  FraudRule,
  IdentityGraphCluster,
  FraudCase,
  FraudCaseStatus,
  FraudOutcome,
} from './types';

export async function evaluateFraud(applicationId: string, overrides?: Record<string, any>): Promise<FraudEvaluationResult> {
  const res = await api.post<any>('/api/v1/fraud/evaluate', { applicationId, overrides });
  return (res as any).data || res;
}

export async function getFraudEvaluation(applicationId: string): Promise<{ latest: FraudEvaluationResult; history: FraudEvaluationResult[] }> {
  const res = await api.get<any>(`/api/v1/fraud/evaluations/application/${applicationId}`);
  return (res as any).data || res;
}

export async function getIdentityGraph(customerId: string): Promise<IdentityGraphCluster> {
  const res = await api.get<any>(`/api/v1/fraud/graph/${customerId}`);
  return (res as any).data || res;
}

export async function getFraudRules(category?: string): Promise<{ rules: FraudRule[]; count: number }> {
  const res = await api.get<any>(`/api/v1/fraud/rules${category ? `?category=${category}` : ''}`);
  return (res as any).data || res;
}

export async function createFraudRule(rule: Partial<FraudRule>): Promise<FraudRule> {
  const res = await api.post<any>('/api/v1/fraud/rules', rule);
  return (res as any).data || res;
}

export async function updateFraudRule(ruleId: string, updates: Partial<FraudRule>): Promise<FraudRule> {
  const res = await api.put<any>(`/api/v1/fraud/rules/${ruleId}`, updates);
  return (res as any).data || res;
}

export async function getFraudCases(filter?: { status?: FraudCaseStatus; assignedToUserId?: string }): Promise<{ cases: FraudCase[]; count: number }> {
  const params = new URLSearchParams();
  if (filter?.status) params.append('status', filter.status);
  if (filter?.assignedToUserId) params.append('assignedToUserId', filter.assignedToUserId);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await api.get<any>(`/api/v1/fraud/cases${qs}`);
  return (res as any).data || res;
}

export async function getFraudCaseById(caseId: string): Promise<FraudCase> {
  const res = await api.get<any>(`/api/v1/fraud/cases/${caseId}`);
  return (res as any).data || res;
}

export async function createFraudCase(payload: { applicationId: string; notes?: string; assignedToUserId?: string }): Promise<FraudCase> {
  const res = await api.post<any>('/api/v1/fraud/cases', payload);
  return (res as any).data || res;
}

export async function assignFraudCase(caseId: string, assignedToUserId: string, assignedToName: string): Promise<FraudCase> {
  const res = await api.post<any>(`/api/v1/fraud/cases/${caseId}/assign`, { assignedToUserId, assignedToName });
  return (res as any).data || res;
}

export async function addFraudCaseEvidence(caseId: string, evidence: { type: string; title: string; description: string; uri?: string }): Promise<FraudCase> {
  const res = await api.post<any>(`/api/v1/fraud/cases/${caseId}/evidence`, evidence);
  return (res as any).data || res;
}

export async function addFraudCaseNote(caseId: string, note: string): Promise<FraudCase> {
  const res = await api.post<any>(`/api/v1/fraud/cases/${caseId}/notes`, { note });
  return (res as any).data || res;
}

export async function resolveFraudCase(caseId: string, payload: { resolution: string; reason: string }): Promise<FraudCase> {
  const res = await api.post<any>(`/api/v1/fraud/cases/${caseId}/resolve`, payload);
  return (res as any).data || res;
}

export async function overrideFraudOutcome(payload: {
  applicationId: string;
  newOutcome: FraudOutcome;
  newScore?: number;
  reason: string;
  comments?: string;
}): Promise<FraudEvaluationResult> {
  const res = await api.post<any>('/api/v1/fraud/override', payload);
  return (res as any).data || res;
}
