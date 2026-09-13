'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  operationsApi,
  OperationsOverviewMetrics,
  ListApplicationsQuery,
  CreateApplicationPayload,
  DocumentVerificationPayload,
} from '../api/operations';

export function useOperationsOverview() {
  const [data, setData] = useState<OperationsOverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await operationsApi.getOverview();
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load operations metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return { data, loading, error, refetch: fetchOverview };
}

export function useOperationsApplications(initialQuery?: ListApplicationsQuery) {
  const [query, setQuery] = useState<ListApplicationsQuery>(initialQuery || { page: 1, pageSize: 20 });
  const [applications, setApplications] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async (q?: ListApplicationsQuery) => {
    try {
      setLoading(true);
      setError(null);
      const currentQ = q || query;
      const res = await operationsApi.listApplications(currentQ);
      setApplications(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchApplications(query);
  }, [query, fetchApplications]);

  const updateFilters = (newFilters: Partial<ListApplicationsQuery>) => {
    setQuery((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const changePage = (page: number) => {
    setQuery((prev) => ({ ...prev, page }));
  };

  return {
    applications,
    meta,
    loading,
    error,
    query,
    updateFilters,
    changePage,
    refetch: () => fetchApplications(query),
  };
}

export function useOperationsApplicationDetail(applicationId: string) {
  const [application, setApplication] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!applicationId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await operationsApi.getApplicationDetails(applicationId);
      setApplication(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load application details');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const transitionStage = async (stage: string, status?: string, reason?: string) => {
    if (!application) return;
    try {
      setSubmitting(true);
      await operationsApi.transitionStage(
        application.id,
        stage,
        status,
        reason,
        application.updatedAt
      );
      await fetchDetail();
    } finally {
      setSubmitting(false);
    }
  };

  const assign = async (payload: { userId?: string; queueKey?: string; notes?: string; priority?: string }) => {
    if (!application) return;
    try {
      setSubmitting(true);
      await operationsApi.assignApplication(application.id, payload);
      await fetchDetail();
    } finally {
      setSubmitting(false);
    }
  };

  const updatePriority = async (priority: string) => {
    if (!application) return;
    try {
      setSubmitting(true);
      await operationsApi.updatePriority(application.id, priority);
      await fetchDetail();
    } finally {
      setSubmitting(false);
    }
  };

  const verifyDoc = async (documentId: string, payload: DocumentVerificationPayload) => {
    try {
      setSubmitting(true);
      await operationsApi.verifyDocument(documentId, payload);
      await fetchDetail();
    } finally {
      setSubmitting(false);
    }
  };

  const addNote = async (message: string, title?: string) => {
    if (!application) return;
    try {
      setSubmitting(true);
      await operationsApi.addActivityNote(application.id, message, title);
      await fetchDetail();
    } finally {
      setSubmitting(false);
    }
  };

  return {
    application,
    loading,
    error,
    submitting,
    refetch: fetchDetail,
    transitionStage,
    assign,
    updatePriority,
    verifyDoc,
    addNote,
  };
}

export function useTeamQueue(initialParams?: { queueKey?: string; priority?: string; page?: number }) {
  const [params, setParams] = useState(initialParams || { page: 1, pageSize: 20 });
  const [items, setItems] = useState<any[]>([]);
  const [queues, setQueues] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await operationsApi.getTeamQueue(params);
      setItems(res.data);
      setMeta(res.meta);
      setQueues(res.queues);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load team queue');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const claim = async (id: string) => {
    await operationsApi.claimQueueItem(id);
    await fetchQueue();
  };

  return {
    items,
    queues,
    meta,
    loading,
    error,
    params,
    setParams,
    claim,
    refetch: fetchQueue,
  };
}

export function useMyTasks(initialParams?: { status?: string; priority?: string; page?: number }) {
  const [params, setParams] = useState(initialParams || { page: 1 });
  const [tasks, setTasks] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await operationsApi.listMyTasks(params);
      setTasks(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const completeTask = async (taskId: string) => {
    await operationsApi.updateTaskStatus(taskId, 'COMPLETED');
    await fetchTasks();
  };

  return {
    tasks,
    pagination,
    loading,
    error,
    params,
    setParams,
    completeTask,
    refetch: fetchTasks,
  };
}

export function useCustomerDirectory(initialParams?: { search?: string; page?: number }) {
  const [params, setParams] = useState(initialParams || { page: 1, pageSize: 20 });
  const [customers, setCustomers] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await operationsApi.listCustomers(params);
      setCustomers(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    meta,
    loading,
    error,
    params,
    setParams,
    refetch: fetchCustomers,
  };
}

export function useCustomer360(customerId: string) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomer = useCallback(async () => {
    if (!customerId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await operationsApi.getCustomer360(customerId);
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  return {
    customerData: data,
    loading,
    error,
    refetch: fetchCustomer,
  };
}
