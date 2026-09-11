import { api } from '@/lib/api';
import {
  WorkflowDefinition,
  WorkflowType,
  CreateWorkflowDto,
  WorkflowStage,
  EvaluateTransitionDto,
  WorkflowTransitionEvaluationResult,
} from './types';

export const workflowsApi = {
  getWorkflows: async (): Promise<WorkflowDefinition[]> => {
    const res = await api.get('/workflows');
    return res.data?.data || res.data || [];
  },

  getWorkflowByType: async (type: WorkflowType): Promise<WorkflowDefinition> => {
    const res = await api.get(`/workflows/${type}`);
    return res.data?.data || res.data;
  },

  createWorkflow: async (dto: CreateWorkflowDto): Promise<WorkflowDefinition> => {
    const res = await api.post('/workflows', dto);
    return res.data?.data || res.data;
  },

  updateWorkflowStages: async (
    id: string,
    stages: WorkflowStage[]
  ): Promise<WorkflowDefinition> => {
    const res = await api.put(`/workflows/${id}/stages`, { stages });
    return res.data?.data || res.data;
  },

  evaluateTransition: async (
    dto: EvaluateTransitionDto
  ): Promise<WorkflowTransitionEvaluationResult> => {
    const res = await api.post('/workflows/evaluate-transition', dto);
    return res.data?.data || res.data;
  },
};
