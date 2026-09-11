import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offersApi } from '../api';
import type {
  CreatePricingPolicyDto,
  OfferSimulationInput,
  GenerateOfferDto,
  AcceptOfferDto,
  DeclineOfferDto,
} from '../types';

export const OFFER_KEYS = {
  all: ['offers'] as const,
  list: (params?: { status?: string; search?: string; customerId?: string }) =>
    [...OFFER_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...OFFER_KEYS.all, 'detail', id] as const,
  applicationOffers: (applicationId: string) =>
    [...OFFER_KEYS.all, 'app', applicationId] as const,
  policies: ['pricing-policies'] as const,
  policyList: (params?: { status?: string; search?: string }) =>
    [...OFFER_KEYS.policies, 'list', params] as const,
  policyDetail: (id: string) => [...OFFER_KEYS.policies, 'detail', id] as const,
};

export function useOffers(params?: { status?: string; search?: string; customerId?: string }) {
  return useQuery({
    queryKey: OFFER_KEYS.list(params),
    queryFn: () => offersApi.listOffers(params),
  });
}

export function useOfferDetail(id: string) {
  return useQuery({
    queryKey: OFFER_KEYS.detail(id),
    queryFn: () => offersApi.getOfferById(id),
    enabled: !!id,
  });
}

export function useApplicationOffers(applicationId: string) {
  return useQuery({
    queryKey: OFFER_KEYS.applicationOffers(applicationId),
    queryFn: () => offersApi.getApplicationOffers(applicationId),
    enabled: !!applicationId,
  });
}

export function useOfferSimulation() {
  return useMutation({
    mutationFn: (input: OfferSimulationInput) => offersApi.simulateOffer(input),
  });
}

export function useGenerateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, data }: { applicationId: string; data?: GenerateOfferDto }) =>
      offersApi.generateOffer(applicationId, data),
    onSuccess: (_, { applicationId }) => {
      queryClient.invalidateQueries({ queryKey: OFFER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: OFFER_KEYS.applicationOffers(applicationId) });
    },
  });
}

export function useAcceptOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId, data }: { offerId: string; data: AcceptOfferDto }) =>
      offersApi.acceptOffer(offerId, data),
    onSuccess: (offer) => {
      queryClient.invalidateQueries({ queryKey: OFFER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: OFFER_KEYS.detail(offer.id) });
      queryClient.invalidateQueries({ queryKey: OFFER_KEYS.applicationOffers(offer.applicationId) });
    },
  });
}

export function useDeclineOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId, data }: { offerId: string; data: DeclineOfferDto }) =>
      offersApi.declineOffer(offerId, data),
    onSuccess: (offer) => {
      queryClient.invalidateQueries({ queryKey: OFFER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: OFFER_KEYS.detail(offer.id) });
    },
  });
}

export function useCancelOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId, reason }: { offerId: string; reason: string }) =>
      offersApi.cancelOffer(offerId, reason),
    onSuccess: (offer) => {
      queryClient.invalidateQueries({ queryKey: OFFER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: OFFER_KEYS.detail(offer.id) });
    },
  });
}

export function usePricingPolicies(params?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: OFFER_KEYS.policyList(params),
    queryFn: () => offersApi.listPricingPolicies(params),
  });
}

export function usePricingPolicyDetail(id: string) {
  return useQuery({
    queryKey: OFFER_KEYS.policyDetail(id),
    queryFn: () => offersApi.getPricingPolicyById(id),
    enabled: !!id,
  });
}

export function useCreatePricingPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePricingPolicyDto) => offersApi.createPricingPolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OFFER_KEYS.policies });
    },
  });
}

export function useCreatePolicyVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => offersApi.createPolicyVersion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OFFER_KEYS.policies });
    },
  });
}

export function useActivatePricingPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => offersApi.activatePricingPolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OFFER_KEYS.policies });
    },
  });
}
