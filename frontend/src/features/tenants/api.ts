import { api } from '@/lib/api';
import type {
  Tenant,
  TenantDetail,
  TenantOperationsOverview,
  TenantReadinessResult,
  TenantConfigurationBundle,
  TenantBrandingConfig,
  TenantBranch,
  TenantUser,
  CreateTenantDto,
  UpdateTenantDto,
  CreateTenantBranchDto,
  CreateTenantUserDto,
} from './types';

export const tenantsApi = {
  async listTenants(): Promise<Tenant[]> {
    const res = await api.get('/tenants');
    return res.data?.data || res.data || [];
  },

  async getOperationsOverview(): Promise<TenantOperationsOverview> {
    const res = await api.get('/tenants/operations-overview');
    return res.data?.data || res.data;
  },

  async getCurrentTenant(): Promise<any> {
    const res = await api.get('/tenants/current');
    return res.data?.data || res.data;
  },

  async getTenantById(id: string): Promise<Tenant> {
    const res = await api.get(`/tenants/${id}`);
    return res.data?.data || res.data;
  },

  async getTenantDetail(id: string): Promise<TenantDetail> {
    const res = await api.get(`/tenants/${id}/detail`);
    return res.data?.data || res.data;
  },

  async getTenantReadiness(id: string): Promise<TenantReadinessResult> {
    const res = await api.get(`/tenants/${id}/readiness`);
    return res.data?.data || res.data;
  },

  async getTenantConfiguration(id: string): Promise<TenantConfigurationBundle> {
    const res = await api.get(`/tenants/${id}/configuration`);
    return res.data?.data || res.data;
  },

  async getTenantBranding(id: string): Promise<TenantBrandingConfig> {
    const res = await api.get(`/tenants/${id}/branding`);
    return res.data?.data || res.data;
  },

  async updateTenantBranding(id: string, data: Partial<TenantBrandingConfig>): Promise<TenantBrandingConfig> {
    const res = await api.put(`/tenants/${id}/branding`, data);
    return res.data?.data || res.data;
  },

  async createTenant(data: CreateTenantDto): Promise<Tenant> {
    const res = await api.post('/tenants', data);
    return res.data?.data || res.data;
  },

  async updateTenant(id: string, data: UpdateTenantDto): Promise<Tenant> {
    const res = await api.patch(`/tenants/${id}`, data);
    return res.data?.data || res.data;
  },

  async activateTenant(id: string): Promise<Tenant> {
    const res = await api.post(`/tenants/${id}/activate`);
    return res.data?.data || res.data;
  },

  async suspendTenant(id: string, reason: string): Promise<Tenant> {
    const res = await api.post(`/tenants/${id}/suspend`, { reason });
    return res.data?.data || res.data;
  },

  async reactivateTenant(id: string): Promise<Tenant> {
    const res = await api.post(`/tenants/${id}/reactivate`);
    return res.data?.data || res.data;
  },

  async listTenantBranches(id: string): Promise<TenantBranch[]> {
    const res = await api.get(`/tenants/${id}/branches`);
    return res.data?.data || res.data || [];
  },

  async createTenantBranch(id: string, data: CreateTenantBranchDto): Promise<TenantBranch> {
    const res = await api.post(`/tenants/${id}/branches`, data);
    return res.data?.data || res.data;
  },

  async listTenantUsers(id: string): Promise<TenantUser[]> {
    const res = await api.get(`/tenants/${id}/users`);
    return res.data?.data || res.data || [];
  },

  async createTenantUser(id: string, data: CreateTenantUserDto): Promise<TenantUser> {
    const res = await api.post(`/tenants/${id}/users`, data);
    return res.data?.data || res.data;
  },

  async getSetupCertificate(id: string): Promise<any> {
    const res = await api.get(`/tenants/${id}/setup-certificate`);
    return res.data?.data || res.data;
  },
};
