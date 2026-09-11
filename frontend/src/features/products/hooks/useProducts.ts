import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductPricingSimulationInput,
} from '../types';
import { useToast } from '@/lib/toast';
import { apiErrorMessage } from '@/lib/api';

export const PRODUCTS_QUERY_KEY = ['loan-products'];

export function useProducts(params?: {
  status?: string;
  productType?: string;
  channel?: string;
  search?: string;
  activeOnly?: boolean;
}) {
  return useQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, params],
    queryFn: () => productsApi.getProducts(params),
  });
}

export function useProduct(id: string | null | undefined) {
  return useQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, id],
    queryFn: () => productsApi.getProduct(id!),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (dto: CreateProductDto) => productsApi.createProduct(dto),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast.success(`Product '${product.name}' created as DRAFT.`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProductDto }) =>
      productsApi.updateProduct(id, dto),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast.success(`Product '${product.name}' (v${product.version}) updated successfully.`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}

export function useActivateProduct() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => productsApi.activateProduct(id),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast.success(`Product '${product.name}' successfully activated for originations!`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}

export function useDeactivateProduct() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => productsApi.deactivateProduct(id),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast.success(`Product '${product.name}' deactivated for new applications.`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}

export function useArchiveProduct() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => productsApi.archiveProduct(id),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast.success(`Product '${product.name}' archived safely.`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}

export function useSimulatePricing() {
  const toast = useToast();

  return useMutation({
    mutationFn: (input: ProductPricingSimulationInput) =>
      productsApi.simulatePricing(input),
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });
}
