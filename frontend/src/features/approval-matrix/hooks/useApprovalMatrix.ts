import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalAuthorityApi } from '../api';
import {
  CreateAuthorityPolicyDto,
  UpdateAuthorityPolicyDto,
  SubmitApprovalActionDto,
  CreateDelegationDto,
} from '../types';
import { useToast } from '@/lib/toast';
import { apiErrorMessage } from '@/lib/api';

export const AUTHORITY_POLICIES_QUERY_KEY = ['approval-authority-policies'];
export const APPROVAL_QUEUE_QUERY_KEY = ['approval-queue'];
export const APPROVAL_TASK_QUERY_KEY = ['approval-task'];
export const DELEGATIONS_QUERY_KEY = ['authority-delegations'];
export const APPROVAL_HISTORY_QUERY_KEY = ['approval-history'];

export function useApprovalPolicies(params?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: [...AUTHORITY_POLICIES_QUERY_KEY, params],
    queryFn: () => approvalAuthorityApi.getPolicies(params),
  });
}

export function useApprovalPolicy(id: string | null | undefined) {
  return useQuery({
    queryKey: [...AUTHORITY_POLICIES_QUERY_KEY, id],
    queryFn: () => approvalAuthorityApi.getPolicy(id!),
    enabled: !!id,
  });
}

export function useCreateApprovalPolicy() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (dto: CreateAuthorityPolicyDto) => approvalAuthorityApi.createPolicy(dto),
    onSuccess: (policy) => {
      queryClient.invalidateQueries({ queryKey: AUTHORITY_POLICIES_QUERY_KEY });
      toast.success(`Authority Policy '${policy.name}' created as DRAFT.`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}

export function useUpdateApprovalPolicy() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAuthorityPolicyDto }) =>
      approvalAuthorityApi.updatePolicy(id, dto),
    onSuccess: (policy) => {
      queryClient.invalidateQueries({ queryKey: AUTHORITY_POLICIES_QUERY_KEY });
      toast.success(`Authority Policy '${policy.name}' (v${policy.version}) updated.`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}

export function useCreatePolicyVersion() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => approvalAuthorityApi.createPolicyVersion(id),
    onSuccess: (policy) => {
      queryClient.invalidateQueries({ queryKey: AUTHORITY_POLICIES_QUERY_KEY });
      toast.success(`New version v${policy.version} created for '${policy.name}'.`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}

export function useActivateApprovalPolicy() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => approvalAuthorityApi.activatePolicy(id),
    onSuccess: (policy) => {
      queryClient.invalidateQueries({ queryKey: AUTHORITY_POLICIES_QUERY_KEY });
      toast.success(`Authority Policy '${policy.name}' activated!`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}

export function useArchiveApprovalPolicy() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => approvalAuthorityApi.archivePolicy(id),
    onSuccess: (policy) => {
      queryClient.invalidateQueries({ queryKey: AUTHORITY_POLICIES_QUERY_KEY });
      toast.success(`Authority Policy '${policy.name}' archived.`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}

export function useApprovalQueue(params?: { tab?: string; search?: string }) {
  return useQuery({
    queryKey: [...APPROVAL_QUEUE_QUERY_KEY, params],
    queryFn: () => approvalAuthorityApi.getApprovalQueue(params),
  });
}

export function useApprovalTask(taskId: string | null | undefined) {
  return useQuery({
    queryKey: [...APPROVAL_TASK_QUERY_KEY, taskId],
    queryFn: () => approvalAuthorityApi.getApprovalTask(taskId!),
    enabled: !!taskId,
  });
}

export function useSubmitApprovalAction() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ taskId, dto }: { taskId: string; dto: SubmitApprovalActionDto }) =>
      approvalAuthorityApi.submitTaskAction(taskId, dto),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: APPROVAL_QUEUE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: APPROVAL_TASK_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: APPROVAL_HISTORY_QUERY_KEY });
      toast.success(`Proposal action recorded: ${task.status}`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}

export function useResolveApprovalAuthority() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (applicationId: string) => approvalAuthorityApi.resolveAuthority(applicationId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: APPROVAL_QUEUE_QUERY_KEY });
      toast.success(`Approval authority resolved: Level ${res.currentLevel?.level} (${res.currentLevel?.name})`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}

export function useApplicationApprovalHistory(applicationId: string | null | undefined) {
  return useQuery({
    queryKey: [...APPROVAL_HISTORY_QUERY_KEY, applicationId],
    queryFn: () => approvalAuthorityApi.getApplicationApprovalHistory(applicationId!),
    enabled: !!applicationId,
  });
}

export function useAuthorityDelegations() {
  return useQuery({
    queryKey: DELEGATIONS_QUERY_KEY,
    queryFn: () => approvalAuthorityApi.getDelegations(),
  });
}

export function useCreateDelegation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (dto: CreateDelegationDto) => approvalAuthorityApi.createDelegation(dto),
    onSuccess: (del) => {
      queryClient.invalidateQueries({ queryKey: DELEGATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: APPROVAL_QUEUE_QUERY_KEY });
      toast.success(`Temporary authority delegation created for ${del.delegateName}.`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}

export function useRevokeDelegation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => approvalAuthorityApi.revokeDelegation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DELEGATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: APPROVAL_QUEUE_QUERY_KEY });
      toast.success('Delegation revoked.');
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}
