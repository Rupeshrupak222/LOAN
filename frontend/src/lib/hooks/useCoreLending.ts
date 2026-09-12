'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  taskType: string;
  entityType: string;
  entityId: string;
  applicationId?: string;
  assignedToUserId?: string;
  assignedTeam?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
  dueAt?: string;
  isOverdue?: boolean;
  createdAt: string;
}

export interface WorkQueueItem {
  id: string;
  key: string;
  name: string;
  department: string;
  workspace: string;
  description?: string;
  activeAssignmentsCount: number;
  activeTasksCount: number;
}

export interface ApprovalItem {
  id: string;
  entityType: string;
  entityId: string;
  approvalType: string;
  level: number;
  approverRole?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  comments?: string;
  requestedAt: string;
  decidedAt?: string;
}

export interface ActivityItem {
  id: string;
  entityType: string;
  entityId: string;
  activityType: string;
  title?: string;
  message: string;
  createdByUserId?: string;
  createdAt: string;
}

export function useTasks(initialFilters: Record<string, any> = {}) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchTasks = useCallback(async (filters: Record<string, any> = {}) => {
    try {
      setLoading(true);
      const res = await api.get('/core-lending/tasks', { params: { ...initialFilters, ...filters } });
      setTasks(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [initialFilters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const updateStatus = async (taskId: string, status: string) => {
    await api.patch(`/core-lending/tasks/${taskId}/status`, { status });
    await fetchTasks();
  };

  const assignTask = async (taskId: string, targetUserId: string) => {
    await api.post(`/core-lending/tasks/${taskId}/assign`, { targetUserId });
    await fetchTasks();
  };

  return { tasks, loading, error, total, refresh: fetchTasks, updateStatus, assignTask };
}

export function useWorkQueues(department?: string) {
  const [queues, setQueues] = useState<WorkQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueues = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/core-lending/queues', { params: { department } });
      setQueues(res.data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load queues');
    } finally {
      setLoading(false);
    }
  }, [department]);

  useEffect(() => {
    fetchQueues();
  }, [fetchQueues]);

  const routeApplication = async (applicationId: string, queueKey: string, notes?: string) => {
    await api.post(`/core-lending/applications/${applicationId}/route-queue`, { queueKey, notes });
    await fetchQueues();
  };

  return { queues, loading, error, refresh: fetchQueues, routeApplication };
}

export function useApprovals(filters: Record<string, any> = {}) {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/core-lending/approvals', { params: filters });
      setApprovals(res.data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch approvals');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const decide = async (approvalId: string, decision: 'APPROVED' | 'REJECTED' | 'CANCELLED', comments?: string) => {
    await api.post(`/core-lending/approvals/${approvalId}/decide`, { decision, comments });
    await fetchApprovals();
  };

  return { approvals, loading, error, refresh: fetchApprovals, decide };
}

export function useActivityTimeline(entityType: string, entityId: string) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!entityType || !entityId) return;
    try {
      setLoading(true);
      const res = await api.get('/core-lending/activities', { params: { entityType, entityId } });
      setActivities(res.data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const addNote = async (message: string, title?: string, activityType: string = 'NOTE') => {
    await api.post('/core-lending/activities', { entityType, entityId, message, title, activityType });
    await fetchActivities();
  };

  return { activities, loading, error, refresh: fetchActivities, addNote };
}
