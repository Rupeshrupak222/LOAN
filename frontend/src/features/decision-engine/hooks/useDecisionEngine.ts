import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { decisionEngineApi } from '../api';
import {
  CreateDecisionPolicyDto,
  UpdateDecisionPolicyDto,
  DecisionSimulationInput,
  DecisionOutcome,
} from '../types';
import { useToast } from '@/lib/toast';
import { apiErrorMessage } from '@/lib/api';

export const POLICIES_QUERY_KEY = ['decision-policies'];
export const DECISIONS_QUERY_KEY = ['application-decisions'];

export function useDecisionPolicies(params?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: [...POLICIES_QUERY_KEY, params],
    queryFn: () => decisionEngineApi.getPolicies(params),
  });
}

export function useDecisionPolicy(id: string | null | undefined) {
  return useQuery({
    queryKey: [...POLICIES_QUERY_KEY, id],
    queryFn: () => decisionEngineApi.getPolicy(id!),
    enabled: !!id,
  });
}

export function useCreateDecisionPolicy() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (dto: CreateDecisionPolicyDto) => decisionEngineApi.createPolicy(dto),
    onSuccess: (policy) => {
      queryClient.invalidateQueries({ queryKey: POLICIES_QUERY_KEY });
      toast.success(`Decision Policy '${policy.name}' created as DRAFT.`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}

export function useUpdateDecisionPolicy() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDecisionPolicyDto }) =>
      decisionEngineApi.updatePolicy(id, dto),
    onSuccess: (policy) => {
      queryClient.invalidateQueries({ queryKey: POLICIES_QUERY_KEY });
      toast.success(`Decision Policy '${policy.name}' (v${policy.version}) updated.`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}

export function useActivateDecisionPolicy() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => decisionEngineApi.activatePolicy(id),
    onSuccess: (policy) => {
      queryClient.invalidateQueries({ queryKey: POLICIES_QUERY_KEY });
      toast.success(`Decision Policy '${policy.name}' activated!`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}
export const useActivatePolicy = useActivateDecisionPolicy;

export function useArchiveDecisionPolicy() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => decisionEngineApi.archivePolicy(id),
    onSuccess: (policy) => {
      queryClient.invalidateQueries({ queryKey: POLICIES_QUERY_KEY });
      toast.success(`Decision Policy '${policy.name}' archived.`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}
export const useArchivePolicy = useArchiveDecisionPolicy;

export function useCreatePolicyVersion() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => decisionEngineApi.createPolicyVersion(id),
    onSuccess: (policy) => {
      queryClient.invalidateQueries({ queryKey: POLICIES_QUERY_KEY });
      toast.success(`New version v${policy.version} created for '${policy.name}'.`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}

export function useSimulateDecision() {
  const toast = useToast();

  return useMutation({
    mutationFn: (input: DecisionSimulationInput) => decisionEngineApi.simulateDecision(input),
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}

export function useEvaluateApplication() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (applicationId: string) => decisionEngineApi.evaluateApplication(applicationId),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: DECISIONS_QUERY_KEY });
      toast.success(`BRE Decision: ${record.finalDecision}`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}

export function useApplicationDecisions(applicationId: string | null | undefined) {
  return useQuery({
    queryKey: [...DECISIONS_QUERY_KEY, applicationId],
    queryFn: () => decisionEngineApi.getApplicationDecisions(applicationId!),
    enabled: !!applicationId,
  });
}

export function useOverrideDecision() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      decisionId,
      payload,
    }: {
      decisionId: string;
      payload: { newDecision: DecisionOutcome; reason: string; comments?: string };
    }) => decisionEngineApi.overrideDecision(decisionId, payload),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: DECISIONS_QUERY_KEY });
      toast.success(`Decision manually overridden to: ${record.finalDecision}`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}
