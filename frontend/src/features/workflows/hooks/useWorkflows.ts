import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsApi } from '../api';
import {
  WorkflowType,
  CreateWorkflowDto,
  WorkflowStage,
  EvaluateTransitionDto,
} from '../types';
import { useToast } from '@/lib/toast';
import { apiErrorMessage } from '@/lib/api';

export const WORKFLOWS_QUERY_KEY = ['workflows'];

export function useWorkflows() {
  return useQuery({
    queryKey: WORKFLOWS_QUERY_KEY,
    queryFn: () => workflowsApi.getWorkflows(),
  });
}

export function useWorkflow(type: WorkflowType) {
  return useQuery({
    queryKey: [...WORKFLOWS_QUERY_KEY, type],
    queryFn: () => workflowsApi.getWorkflowByType(type),
    enabled: !!type,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (dto: CreateWorkflowDto) => workflowsApi.createWorkflow(dto),
    onSuccess: (wf) => {
      queryClient.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY });
      toast.success(`Workflow '${wf.name}' created.`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}

export function useUpdateWorkflowStages() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, stages }: { id: string; stages: WorkflowStage[] }) =>
      workflowsApi.updateWorkflowStages(id, stages),
    onSuccess: (wf) => {
      queryClient.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY });
      toast.success(`Workflow stages for '${wf.name}' updated.`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}

export function useEvaluateWorkflowTransition() {
  const toast = useToast();

  return useMutation({
    mutationFn: (dto: EvaluateTransitionDto) =>
      workflowsApi.evaluateTransition(dto),
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}
