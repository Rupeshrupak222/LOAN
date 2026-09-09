// Step 41: Commercial Deployment Models & Architecture Types

export type DeploymentModel =
  | 'SHARED_MULTI_TENANT_SAAS'
  | 'DEDICATED_TENANT'
  | 'ENTERPRISE_PRIVATE_CLOUD'
  | 'AIRGAPPED_SELF_HOSTED';

export type EnvironmentTier = 'DEVELOPMENT' | 'TESTING' | 'STAGING' | 'PRODUCTION';

export type StorageDriver = 'CLOUDINARY' | 'AWS_S3' | 'AZURE_BLOB' | 'MINIO_LOCAL' | 'LOCAL_FS';

export type SecretProvider = 'ENV_INJECTION' | 'AWS_SECRETS_MANAGER' | 'HASHICORP_VAULT' | 'AZURE_KEY_VAULT';

export type AiInferenceMode = 'CLOUD_GEMINI' | 'ON_PREM_LLM' | 'LOCAL_RULE_ONLY';

export interface DeploymentProfile {
  deploymentModel: DeploymentModel;
  environmentTier: EnvironmentTier;
  version: string;
  releaseDate: string;
  dedicatedTenantId?: string;
  storageDriver: StorageDriver;
  secretProvider: SecretProvider;
  aiInferenceMode: AiInferenceMode;
  cacheEnabled: boolean;
  strictTenantIsolationEnforced: boolean;
  sslEnforced: boolean;
  features: {
    multiTenantOnboarding: boolean;
    whiteLabelPortals: boolean;
    accountAggregatorHub: boolean;
    realTimeEmiCalculator: boolean;
    evidenceAuditLedger: boolean;
    aiUnderwritingCopilot: boolean;
  };
}

export interface PreflightCheckItem {
  name: string;
  category: 'DATABASE' | 'SECURITY_SECRETS' | 'STORAGE' | 'INTEGRATION' | 'ENVIRONMENT';
  status: 'PASSED' | 'WARNING' | 'FAILED';
  message: string;
  details?: Record<string, any>;
}

export interface PreflightValidationReport {
  passed: boolean;
  deploymentModel: DeploymentModel;
  environmentTier: EnvironmentTier;
  totalChecks: number;
  passedCount: number;
  warningCount: number;
  failedCount: number;
  checks: PreflightCheckItem[];
  timestamp: string;
}

export interface RollbackPlan {
  planId: string;
  targetVersion: string;
  currentVersion: string;
  databaseStrategy: 'FORWARD_FIX_ONLY' | 'SAFE_DOWN_MIGRATION' | 'POINT_IN_TIME_RECOVERY';
  financialLedgerProtection: {
    preserveRepayments: boolean;
    preserveAuditTrail: boolean;
    zeroBalanceDiscrepancyGuaranteed: boolean;
  };
  steps: Array<{
    stepNumber: number;
    action: string;
    responsibleRole: string;
    verificationCommand: string;
    rollbackTimeoutMinutes: number;
  }>;
  safetyChecklist: string[];
}
