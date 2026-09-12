import { api } from '@/lib/api';
import { RiskEvaluationResult, RiskPolicy, RiskOverrideRecord } from './types';

export async function evaluateRisk(applicationId: string, overrides?: Record<string, any>): Promise<RiskEvaluationResult> {
  const res = await api.post<any>('/api/v1/risk/evaluate', { applicationId, overrides });
  return (res as any).data || res;
}

export async function simulateRisk(payload: {
  applicantAge: number;
  monthlyIncome: number;
  existingObligations: number;
  workExperienceMonths: number;
  bureauScore: number;
  averageMonthlyBalance: number;
  chequeBouncesLast90d: number;
  requestedAmount: number;
  requestedTenureMonths: number;
  applicationVelocity24h: number;
}): Promise<RiskEvaluationResult> {
  const res = await api.post<any>('/api/v1/risk/simulate', payload);
  return (res as any).data || res;
}

export async function getRiskEvaluation(applicationId: string): Promise<{ latest: RiskEvaluationResult; history: RiskEvaluationResult[] }> {
  const res = await api.get<any>(`/api/v1/risk/evaluations/application/${applicationId}`);
  return (res as any).data || res;
}

export async function getRiskPolicies(status?: string): Promise<{ policies: RiskPolicy[]; count: number }> {
  const res = await api.get<any>(`/api/v1/risk/policies${status ? `?status=${status}` : ''}`);
  return (res as any).data || res;
}

export async function createRiskPolicy(policy: Partial<RiskPolicy>): Promise<RiskPolicy> {
  const res = await api.post<any>('/api/v1/risk/policies', policy);
  return (res as any).data || res;
}

export async function publishRiskPolicy(policyId: string): Promise<RiskPolicy> {
  const res = await api.post<any>(`/api/v1/risk/policies/${policyId}/publish`, {});
  return (res as any).data || res;
}

export async function overrideRiskScore(payload: {
  applicationId: string;
  newScore: number;
  newGrade: 'A' | 'B' | 'C' | 'D' | 'E';
  reason: string;
  comments?: string;
}): Promise<RiskEvaluationResult> {
  const res = await api.post<any>('/api/v1/risk/override', payload);
  return (res as any).data || res;
}
