import { api } from '@/lib/api';
import {
  LendingProduct,
  CreateProductDto,
  UpdateProductDto,
  ProductPricingSimulationInput,
  ProductPricingSimulationResult,
} from './types';

export const productsApi = {
  getProducts: async (params?: {
    status?: string;
    productType?: string;
    channel?: string;
    search?: string;
    activeOnly?: boolean;
  }): Promise<LendingProduct[]> => {
    const res = await api.get('/loan-products', { params });
    // Support data unwrapping
    return res.data?.data || res.data || [];
  },

  getProduct: async (id: string): Promise<LendingProduct> => {
    const res = await api.get(`/loan-products/${id}`);
    return res.data?.data || res.data;
  },

  createProduct: async (dto: CreateProductDto): Promise<LendingProduct> => {
    const res = await api.post('/loan-products', dto);
    return res.data?.data || res.data;
  },

  updateProduct: async (id: string, dto: UpdateProductDto): Promise<LendingProduct> => {
    const res = await api.put(`/loan-products/${id}`, dto);
    return res.data?.data || res.data;
  },

  activateProduct: async (id: string): Promise<LendingProduct> => {
    const res = await api.post(`/loan-products/${id}/activate`);
    return res.data?.data || res.data;
  },

  deactivateProduct: async (id: string): Promise<LendingProduct> => {
    const res = await api.post(`/loan-products/${id}/deactivate`);
    return res.data?.data || res.data;
  },

  archiveProduct: async (id: string): Promise<LendingProduct> => {
    const res = await api.post(`/loan-products/${id}/archive`);
    return res.data?.data || res.data;
  },

  simulatePricing: async (
    input: ProductPricingSimulationInput
  ): Promise<ProductPricingSimulationResult> => {
    const res = await api.post('/loan-products/simulate-pricing', input);
    return res.data?.data || res.data;
  },
};
