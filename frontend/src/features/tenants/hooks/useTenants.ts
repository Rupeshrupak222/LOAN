import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantsApi } from '../api';
import type {
  CreateTenantDto,
  UpdateTenantDto,
  CreateTenantBranchDto,
  CreateTenantUserDto,
  TenantBrandingConfig,
} from '../types';

export const TENANT_QUERY_KEYS = {
  all: ['tenants'] as const,
  list: () => [...TENANT_QUERY_KEYS.all, 'list'] as const,
  overview: () => [...TENANT_QUERY_KEYS.all, 'overview'] as const,
  current: () => [...TENANT_QUERY_KEYS.all, 'current'] as const,
  detail: (id: string) => [...TENANT_QUERY_KEYS.all, 'detail', id] as const,
  readiness: (id: string) => [...TENANT_QUERY_KEYS.all, 'readiness', id] as const,
  configuration: (id: string) => [...TENANT_QUERY_KEYS.all, 'configuration', id] as const,
  branding: (id: string) => [...TENANT_QUERY_KEYS.all, 'branding', id] as const,
  branches: (id: string) => [...TENANT_QUERY_KEYS.all, 'branches', id] as const,
  users: (id: string) => [...TENANT_QUERY_KEYS.all, 'users', id] as const,
};

export function useTenants() {
  return useQuery({
    queryKey: TENANT_QUERY_KEYS.list(),
    queryFn: () => tenantsApi.listTenants(),
  });
}

export function useTenantOperationsOverview() {
  return useQuery({
    queryKey: TENANT_QUERY_KEYS.overview(),
    queryFn: () => tenantsApi.getOperationsOverview(),
  });
}

export function useCurrentTenant() {
  return useQuery({
    queryKey: TENANT_QUERY_KEYS.current(),
    queryFn: () => tenantsApi.getCurrentTenant(),
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: [...TENANT_QUERY_KEYS.all, id],
    queryFn: () => tenantsApi.getTenantById(id),
    enabled: Boolean(id),
  });
}

export function useTenantDetail(id: string) {
  return useQuery({
    queryKey: TENANT_QUERY_KEYS.detail(id),
    queryFn: () => tenantsApi.getTenantDetail(id),
    enabled: Boolean(id),
  });
}

export function useTenantReadiness(id: string) {
  return useQuery({
    queryKey: TENANT_QUERY_KEYS.readiness(id),
    queryFn: () => tenantsApi.getTenantReadiness(id),
    enabled: Boolean(id),
  });
}

export function useTenantConfiguration(id: string) {
  return useQuery({
    queryKey: TENANT_QUERY_KEYS.configuration(id),
    queryFn: () => tenantsApi.getTenantConfiguration(id),
    enabled: Boolean(id),
  });
}

export function useTenantBranding(id: string) {
  return useQuery({
    queryKey: TENANT_QUERY_KEYS.branding(id),
    queryFn: () => tenantsApi.getTenantBranding(id),
    enabled: Boolean(id),
  });
}

export function useTenantBranches(id: string) {
  return useQuery({
    queryKey: TENANT_QUERY_KEYS.branches(id),
    queryFn: () => tenantsApi.listTenantBranches(id),
    enabled: Boolean(id),
  });
}

export function useTenantUsers(id: string) {
  return useQuery({
    queryKey: TENANT_QUERY_KEYS.users(id),
    queryFn: () => tenantsApi.listTenantUsers(id),
    enabled: Boolean(id),
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTenantDto) => tenantsApi.createTenant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.all });
    },
  });
}

export function useUpdateTenant(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTenantDto) => tenantsApi.updateTenant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.all });
    },
  });
}

export function useUpdateTenantBranding(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TenantBrandingConfig>) => tenantsApi.updateTenantBranding(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.branding(id) });
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.configuration(id) });
    },
  });
}

export function useActivateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsApi.activateTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.all });
    },
  });
}

export function useSuspendTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => tenantsApi.suspendTenant(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.all });
    },
  });
}

export function useReactivateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsApi.reactivateTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.all });
    },
  });
}

export function useCreateTenantBranch(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTenantBranchDto) => tenantsApi.createTenantBranch(tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.branches(tenantId) });
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.configuration(tenantId) });
    },
  });
}

export function useCreateTenantUser(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTenantUserDto) => tenantsApi.createTenantUser(tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.users(tenantId) });
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.configuration(tenantId) });
    },
  });
}
