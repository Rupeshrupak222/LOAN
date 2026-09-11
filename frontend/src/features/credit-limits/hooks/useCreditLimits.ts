import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditLimitsApi } from '../api';
import type {
  CreateCreditLimitPolicyDto,
  RequestDrawdownDto,
  LimitAdjustmentDto,
  CreditLimitSimulationInput,
} from '../types';

export const CREDIT_LIMIT_KEYS = {
  all: ['credit-facilities'] as const,
  list: (params?: { status?: string; search?: string; customerId?: string }) =>
    [...CREDIT_LIMIT_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...CREDIT_LIMIT_KEYS.all, 'detail', id] as const,
  exposure: (customerId: string) => [...CREDIT_LIMIT_KEYS.all, 'exposure', customerId] as const,
  transactions: (id: string) => [...CREDIT_LIMIT_KEYS.all, 'transactions', id] as const,
  adjustments: (id: string) => [...CREDIT_LIMIT_KEYS.all, 'adjustments', id] as const,
  policies: ['credit-policies'] as const,
  policyList: (tenantId?: string) => [...CREDIT_LIMIT_KEYS.policies, 'list', tenantId] as const,
  policyDetail: (id: string) => [...CREDIT_LIMIT_KEYS.policies, 'detail', id] as const,
};

export function useCreditFacilities(params?: { status?: string; search?: string; customerId?: string }) {
  return useQuery({
    queryKey: CREDIT_LIMIT_KEYS.list(params),
    queryFn: () => creditLimitsApi.listFacilities(params),
  });
}

export function useCreditFacility(id: string) {
  return useQuery({
    queryKey: CREDIT_LIMIT_KEYS.detail(id),
    queryFn: () => creditLimitsApi.getFacilityById(id),
    enabled: !!id,
  });
}

export function useCustomerExposure(customerId: string) {
  return useQuery({
    queryKey: CREDIT_LIMIT_KEYS.exposure(customerId),
    queryFn: () => creditLimitsApi.getCustomerExposure(customerId),
    enabled: !!customerId,
  });
}

export function useFacilityTransactions(facilityId: string) {
  return useQuery({
    queryKey: CREDIT_LIMIT_KEYS.transactions(facilityId),
    queryFn: () => creditLimitsApi.getTransactions(facilityId),
    enabled: !!facilityId,
  });
}

export function useFacilityAdjustments(facilityId: string) {
  return useQuery({
    queryKey: CREDIT_LIMIT_KEYS.adjustments(facilityId),
    queryFn: () => creditLimitsApi.getAdjustments(facilityId),
    enabled: !!facilityId,
  });
}

export function useRequestDrawdown() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ facilityId, data }: { facilityId: string; data: RequestDrawdownDto }) =>
      creditLimitsApi.requestDrawdown(facilityId, data),
    onSuccess: (_, { facilityId }) => {
      queryClient.invalidateQueries({ queryKey: CREDIT_LIMIT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CREDIT_LIMIT_KEYS.detail(facilityId) });
      queryClient.invalidateQueries({ queryKey: CREDIT_LIMIT_KEYS.transactions(facilityId) });
    },
  });
}

export function useAdjustLimit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ facilityId, data }: { facilityId: string; data: LimitAdjustmentDto }) =>
      creditLimitsApi.adjustLimit(facilityId, data),
    onSuccess: (_, { facilityId }) => {
      queryClient.invalidateQueries({ queryKey: CREDIT_LIMIT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CREDIT_LIMIT_KEYS.detail(facilityId) });
      queryClient.invalidateQueries({ queryKey: CREDIT_LIMIT_KEYS.transactions(facilityId) });
      queryClient.invalidateQueries({ queryKey: CREDIT_LIMIT_KEYS.adjustments(facilityId) });
    },
  });
}

export function useFacilityActions() {
  const queryClient = useQueryClient();

  const suspend = useMutation({
    mutationFn: ({ facilityId, reason }: { facilityId: string; reason: string }) =>
      creditLimitsApi.suspendFacility(facilityId, reason),
    onSuccess: (_, { facilityId }) => {
      queryClient.invalidateQueries({ queryKey: CREDIT_LIMIT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CREDIT_LIMIT_KEYS.detail(facilityId) });
    },
  });

  const freeze = useMutation({
    mutationFn: ({ facilityId, reason }: { facilityId: string; reason: string }) =>
      creditLimitsApi.freezeFacility(facilityId, reason),
    onSuccess: (_, { facilityId }) => {
      queryClient.invalidateQueries({ queryKey: CREDIT_LIMIT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CREDIT_LIMIT_KEYS.detail(facilityId) });
    },
  });

  const resume = useMutation({
    mutationFn: ({ facilityId, reason }: { facilityId: string; reason: string }) =>
      creditLimitsApi.resumeFacility(facilityId, reason),
    onSuccess: (_, { facilityId }) => {
      queryClient.invalidateQueries({ queryKey: CREDIT_LIMIT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CREDIT_LIMIT_KEYS.detail(facilityId) });
    },
  });

  const close = useMutation({
    mutationFn: ({ facilityId, reason }: { facilityId: string; reason: string }) =>
      creditLimitsApi.closeFacility(facilityId, reason),
    onSuccess: (_, { facilityId }) => {
      queryClient.invalidateQueries({ queryKey: CREDIT_LIMIT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CREDIT_LIMIT_KEYS.detail(facilityId) });
    },
  });

  return { suspend, freeze, resume, close };
}

export function useCreditLimitSimulation() {
  return useMutation({
    mutationFn: (input: CreditLimitSimulationInput) => creditLimitsApi.simulateLimit(input),
  });
}

export function useCreditPolicies(tenantId?: string) {
  return useQuery({
    queryKey: CREDIT_LIMIT_KEYS.policyList(tenantId),
    queryFn: () => creditLimitsApi.listPolicies(tenantId),
  });
}

export function useCreateCreditPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCreditLimitPolicyDto) => creditLimitsApi.createPolicy(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CREDIT_LIMIT_KEYS.policies });
    },
  });
}
