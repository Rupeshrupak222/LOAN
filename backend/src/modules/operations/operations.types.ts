import { ApplicationStage, TaskPriority } from '../core-lending/core-lending.types';

export interface OperationsOverviewMetrics {
  applicationsToday: number;
  pendingApplications: number;
  assignedToMe: number;
  overdueTasks: number;
  pendingDocuments: number;
  requiresAction: number;
  stageDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
}

export interface ListApplicationsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  stage?: ApplicationStage | string;
  status?: string;
  priority?: TaskPriority | string;
  assignedToUserId?: string;
  queueId?: string;
  productId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface CreateApplicationDto {
  customerId: string;
  productId: string;
  requestedAmount: number;
  tenureMonths: number;
  branchId?: string;
  purpose?: string;
  priority?: TaskPriority;
  metadata?: Record<string, any>;
  autoSubmit?: boolean;
}

export interface ClaimQueueItemDto {
  applicationId: string;
  notes?: string;
}

export interface DocumentVerificationDto {
  notes?: string;
  status: 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
}

export interface Customer360Dto {
  customer: any;
  identifiers: any[];
  applications: any[];
  loans: any[];
  documents: any[];
  tasks: any[];
  activities: any[];
  stats: {
    totalApplications: number;
    activeLoansCount: number;
    totalSanctionedAmount: number;
    totalOutstandingAmount: number;
    kycVerified: boolean;
  };
}
