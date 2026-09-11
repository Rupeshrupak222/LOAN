import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnersApi } from '../api';
import type { PartnerStatus } from '../types';

export function usePartners() {
  const queryClient = useQueryClient();

  const partnersQuery = useQuery({
    queryKey: ['partners'],
    queryFn: () => partnersApi.listPartners(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PartnerStatus }) =>
      partnersApi.updatePartnerStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
  });

  const registerPartnerMutation = useMutation({
    mutationFn: (data: any) => partnersApi.registerPartner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
  });

  return {
    partners: partnersQuery.data || [],
    isLoading: partnersQuery.isLoading,
    isError: partnersQuery.isError,
    refetch: partnersQuery.refetch,
    updateStatus: updateStatusMutation.mutateAsync,
    registerPartner: registerPartnerMutation.mutateAsync,
  };
}

export function usePartnerDetail(partnerId: string) {
  const queryClient = useQueryClient();

  const partnerQuery = useQuery({
    queryKey: ['partner', partnerId],
    queryFn: () => partnersApi.getPartnerById(partnerId),
    enabled: Boolean(partnerId),
  });

  const credentialsQuery = useQuery({
    queryKey: ['partner-credentials', partnerId],
    queryFn: () => partnersApi.listCredentials(partnerId),
    enabled: Boolean(partnerId),
  });

  const webhooksQuery = useQuery({
    queryKey: ['partner-webhooks', partnerId],
    queryFn: () => partnersApi.listWebhooks(partnerId),
    enabled: Boolean(partnerId),
  });

  const payoutQuery = useQuery({
    queryKey: ['partner-payout', partnerId],
    queryFn: () => partnersApi.getPayoutSummary(partnerId),
    enabled: Boolean(partnerId),
  });

  const createCredentialMutation = useMutation({
    mutationFn: (data: any) => partnersApi.createCredential(partnerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-credentials', partnerId] });
    },
  });

  const rotateSecretMutation = useMutation({
    mutationFn: (credentialId: string) => partnersApi.rotateSecret(partnerId, credentialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-credentials', partnerId] });
    },
  });

  const revokeCredentialMutation = useMutation({
    mutationFn: (credentialId: string) => partnersApi.revokeCredential(partnerId, credentialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-credentials', partnerId] });
    },
  });

  const registerWebhookMutation = useMutation({
    mutationFn: (data: any) => partnersApi.registerWebhook(partnerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-webhooks', partnerId] });
    },
  });

  return {
    partner: partnerQuery.data,
    credentials: credentialsQuery.data || [],
    webhooks: webhooksQuery.data || [],
    payout: payoutQuery.data,
    isLoading: partnerQuery.isLoading,
    createCredential: createCredentialMutation.mutateAsync,
    rotateSecret: rotateSecretMutation.mutateAsync,
    revokeCredential: revokeCredentialMutation.mutateAsync,
    registerWebhook: registerWebhookMutation.mutateAsync,
  };
}

export function usePartnerPortal() {
  const queryClient = useQueryClient();

  const applicationsQuery = useQuery({
    queryKey: ['partner-portal-applications'],
    queryFn: () => partnersApi.getPartnerApplications(),
  });

  const reportsSummaryQuery = useQuery({
    queryKey: ['partner-portal-reports'],
    queryFn: () => partnersApi.getPartnerReportsSummary(),
  });

  const webhookDeliveriesQuery = useQuery({
    queryKey: ['partner-portal-webhook-deliveries'],
    queryFn: () => partnersApi.listWebhookDeliveries(),
  });

  const createApplicationMutation = useMutation({
    mutationFn: (data: any) => partnersApi.createPartnerApplication(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-portal-applications'] });
      queryClient.invalidateQueries({ queryKey: ['partner-portal-reports'] });
    },
  });

  const submitApplicationMutation = useMutation({
    mutationFn: (id: string) => partnersApi.submitPartnerApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-portal-applications'] });
      queryClient.invalidateQueries({ queryKey: ['partner-portal-reports'] });
    },
  });

  const triggerTestPingMutation = useMutation({
    mutationFn: () => partnersApi.triggerTestPing(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-portal-webhook-deliveries'] });
    },
  });

  const replayDeliveryMutation = useMutation({
    mutationFn: (deliveryId: string) => partnersApi.replayWebhookDelivery(deliveryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-portal-webhook-deliveries'] });
    },
  });

  return {
    applications: applicationsQuery.data || [],
    reports: reportsSummaryQuery.data,
    deliveries: webhookDeliveriesQuery.data || [],
    isLoading: applicationsQuery.isLoading,
    createApplication: createApplicationMutation.mutateAsync,
    submitApplication: submitApplicationMutation.mutateAsync,
    triggerTestPing: triggerTestPingMutation.mutateAsync,
    replayDelivery: replayDeliveryMutation.mutateAsync,
  };
}
