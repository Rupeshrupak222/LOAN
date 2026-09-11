import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { borrowerApi } from '../api';
import type { CreateBorrowerApplicationDto } from '../types';

export const BORROWER_QUERY_KEYS = {
  all: ['borrower'] as const,
  profile: () => [...BORROWER_QUERY_KEYS.all, 'profile'] as const,
  products: () => [...BORROWER_QUERY_KEYS.all, 'products'] as const,
  product: (id: string) => [...BORROWER_QUERY_KEYS.all, 'product', id] as const,
  application: (id: string) => [...BORROWER_QUERY_KEYS.all, 'application', id] as const,
  offers: (appId: string) => [...BORROWER_QUERY_KEYS.all, 'offers', appId] as const,
  offer: (id: string) => [...BORROWER_QUERY_KEYS.all, 'offer', id] as const,
  kfs: (appId: string) => [...BORROWER_QUERY_KEYS.all, 'kfs', appId] as const,
  loans: () => [...BORROWER_QUERY_KEYS.all, 'loans'] as const,
  loan: (id: string) => [...BORROWER_QUERY_KEYS.all, 'loan', id] as const,
  creditFacilities: () => [...BORROWER_QUERY_KEYS.all, 'creditFacilities'] as const,
  documents: () => [...BORROWER_QUERY_KEYS.all, 'documents'] as const,
};

export function useBorrowerProfile() {
  return useQuery({
    queryKey: BORROWER_QUERY_KEYS.profile(),
    queryFn: () => borrowerApi.getMyProfile(),
  });
}

export function useBorrowerProducts() {
  return useQuery({
    queryKey: BORROWER_QUERY_KEYS.products(),
    queryFn: () => borrowerApi.getAvailableProducts(),
  });
}

export function useBorrowerApplication(id: string) {
  return useQuery({
    queryKey: BORROWER_QUERY_KEYS.application(id),
    queryFn: () => borrowerApi.getApplicationById(id),
    enabled: Boolean(id),
  });
}

export function useBorrowerOffers(applicationId: string) {
  return useQuery({
    queryKey: BORROWER_QUERY_KEYS.offers(applicationId),
    queryFn: () => borrowerApi.getOffersByApplication(applicationId),
    enabled: Boolean(applicationId),
  });
}

export function useBorrowerKfs(applicationId: string) {
  return useQuery({
    queryKey: BORROWER_QUERY_KEYS.kfs(applicationId),
    queryFn: () => borrowerApi.getKfs(applicationId),
    enabled: Boolean(applicationId),
  });
}

export function useBorrowerCreditFacilities() {
  return useQuery({
    queryKey: BORROWER_QUERY_KEYS.creditFacilities(),
    queryFn: () => borrowerApi.getCreditFacilities(),
  });
}

export function useCreateBorrowerApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBorrowerApplicationDto) => borrowerApi.createApplication(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BORROWER_QUERY_KEYS.profile() });
    },
  });
}

export function useSubmitBorrowerApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => borrowerApi.submitApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BORROWER_QUERY_KEYS.all });
    },
  });
}

export function useAcceptLoanOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId, kfsAcknowledged }: { offerId: string; kfsAcknowledged?: boolean }) =>
      borrowerApi.acceptOffer(offerId, kfsAcknowledged),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BORROWER_QUERY_KEYS.all });
    },
  });
}

export function useDeclineLoanOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId, reason }: { offerId: string; reason?: string }) =>
      borrowerApi.declineOffer(offerId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BORROWER_QUERY_KEYS.all });
    },
  });
}

export function useGenerateAgreement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) => borrowerApi.generateDigitalAgreement(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BORROWER_QUERY_KEYS.all });
    },
  });
}

export function useInitiateESign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, provider }: { applicationId: string; provider?: string }) =>
      borrowerApi.initiateESign(applicationId, provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BORROWER_QUERY_KEYS.all });
    },
  });
}

export function useCompleteESign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => borrowerApi.completeESign(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BORROWER_QUERY_KEYS.all });
    },
  });
}

export function useInitiateMandate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, bankAccountId }: { applicationId: string; bankAccountId?: string }) =>
      borrowerApi.initiateMandate(applicationId, bankAccountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BORROWER_QUERY_KEYS.all });
    },
  });
}

export function useVerifyMandate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mandateId: string) => borrowerApi.verifyMandate(mandateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BORROWER_QUERY_KEYS.all });
    },
  });
}

export function usePayLoanEmi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, data }: { loanId: string; data: { amount: number; method: string; reference?: string } }) =>
      borrowerApi.payEmi(loanId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BORROWER_QUERY_KEYS.profile() });
      queryClient.invalidateQueries({ queryKey: BORROWER_QUERY_KEYS.loans() });
    },
  });
}

export function useRequestDrawdown() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ facilityId, amount, tenureMonths }: { facilityId: string; amount: number; tenureMonths?: number }) =>
      borrowerApi.requestDrawdown(facilityId, amount, tenureMonths),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BORROWER_QUERY_KEYS.creditFacilities() });
      queryClient.invalidateQueries({ queryKey: BORROWER_QUERY_KEYS.profile() });
    },
  });
}
