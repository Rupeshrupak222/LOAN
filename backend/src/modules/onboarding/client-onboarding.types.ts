// Step 42: Commercial Client Onboarding & Provisioning Types

export type ClientLifecycleStage =
  | 'PROSPECT'
  | 'ONBOARDING'
  | 'CONFIGURATION'
  | 'VALIDATION'
  | 'APPROVAL'
  | 'PROVISIONING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'OFFBOARDING'
  | 'DEACTIVATED';

export type ChecklistCategory =
  | 'ORGANIZATION'
  | 'SECURITY_RBAC'
  | 'PRODUCT_WORKFLOW'
  | 'COMPLIANCE_PRIVACY'
  | 'INTEGRATIONS'
  | 'GO_LIVE_APPROVAL';

export type ChecklistItemCode =
  | 'ORGANIZATION_PROFILE'
  | 'ADMIN_ACCOUNT'
  | 'BRANCH_TOPOLOGY'
  | 'ROLE_SOD_RULES'
  | 'PERMISSION_MAPPINGS'
  | 'PRODUCT_CATALOG'
  | 'WORKFLOW_GATES'
  | 'COMPLIANCE_POLICIES'
  | 'PRIVACY_DPDP'
  | 'BRANDING_ASSETS'
  | 'INTEGRATION_GATEWAYS'
  | 'COMMUNICATION_CHANNELS'
  | 'SECURITY_HARDENING'
  | 'STAFF_USER_SETUP'
  | 'TESTING_VERIFICATION'
  | 'GOLIVE_SIGN_OFF';

export interface ChecklistTask {
  code: ChecklistItemCode;
  name: string;
  category: ChecklistCategory;
  description: string;
  isMandatory: boolean;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  completedAt?: string;
  completedBy?: string;
  blockerReason?: string;
}

export interface CommercialOnboardingRecord {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  tier: 'ENTERPRISE' | 'GROWTH' | 'STANDARD';
  stage: ClientLifecycleStage;
  primaryContact: {
    name: string;
    email: string;
    phone: string;
  };
  organizationDetails: {
    cinNumber?: string;
    rbiRegistrationNo?: string;
    registeredAddress?: string;
    domain?: string;
  };
  checklist: ChecklistTask[];
  completionPercentage: number;
  assignedOwnerEmail: string;
  approvalDetails?: {
    approvedBy: string;
    approvedAt: string;
    notes: string;
  };
  retentionPolicy: {
    financialRecordsRetentionYears: number; // statutory 8 years
    auditTrailImmutable: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface InitiateClientOnboardingDto {
  code: string;
  name: string;
  tier?: 'ENTERPRISE' | 'GROWTH' | 'STANDARD';
  primaryContact: {
    name: string;
    email: string;
    phone: string;
  };
  organizationDetails?: {
    cinNumber?: string;
    rbiRegistrationNo?: string;
    registeredAddress?: string;
    domain?: string;
  };
  assignedOwnerEmail?: string;
}

export interface GoLiveValidationResult {
  readyForActivation: boolean;
  stage: ClientLifecycleStage;
  totalChecklistItems: number;
  completedItemsCount: number;
  pendingMandatoryCount: number;
  blockedCount: number;
  validationIssues: string[];
  recommendedActions: string[];
}
