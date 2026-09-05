// Step 22: Lender Configuration Engine Canonical Types

export type ConfigArea =
  | 'FOIR_DTI'
  | 'ELIGIBILITY'
  | 'RISK'
  | 'UNDERWRITING'
  | 'DOCUMENTS'
  | 'COLLECTIONS'
  | 'NOTIFICATIONS';

export type ConfigState = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface FoirDtiParameters {
  maxDtiRatio: number; // e.g. 0.45 (45%) or 0.55 (55%)
  warningDtiRatio: number; // e.g. 0.35 (35%) or 0.45 (45%)
  allowCoApplicantIncome: boolean;
  rentalIncomeHaircutPct: number; // e.g. 20 (20% haircut)
}

export interface EligibilityParameters {
  minAge: number;
  maxAge: number;
  minSalariedIncome: number;
  minBusinessIncome: number;
  allowedEmploymentTypes: string[];
  restrictedPinCodes?: string[];
}

export interface RiskParameters {
  minBureauScore: number;
  maxRiskScoreThreshold: number;
  highRiskCutoff: number;
  maxFoirDeviationAllowed: number;
  requireFieldVerificationAboveAmount: number;
}

export interface UnderwritingParameters {
  singleSignoffLimit: number; // e.g. ₹50,000 vs ₹1,00,000
  committeeSignoffLimit: number; // e.g. ₹5,00,000 vs ₹10,00,000
  mandatoryExceptionSignoff: boolean;
  maxTurnaroundHours: number;
}

export interface DocumentParameters {
  requiredCategories: string[];
  optionalCategories: string[];
  mandatoryBankStatementMonths: number;
}

export interface CollectionsParameters {
  gracePeriodDays: number;
  softCollectionDpdCutoff: number; // e.g. 30
  hardCollectionDpdCutoff: number; // e.g. 60
  legalEscalationDpd: number; // e.g. 90
  maxPtpHours: number;
}

export interface NotificationConfigParameters {
  sendSanctionEmail: boolean;
  sendEmiReminderSms: boolean;
  sendDisbursementWhatsapp: boolean;
  quietHoursStart: string; // e.g. "19:00"
  quietHoursEnd: string; // e.g. "08:00"
}

export type PolicyParameters =
  | FoirDtiParameters
  | EligibilityParameters
  | RiskParameters
  | UnderwritingParameters
  | DocumentParameters
  | CollectionsParameters
  | NotificationConfigParameters
  | Record<string, any>;

export interface TenantPolicyConfig {
  id: string;
  tenantId: string;
  area: ConfigArea;
  version: number;
  state: ConfigState;
  effectiveFrom: string;
  effectiveTo?: string;
  parameters: Record<string, any>;
  changelog: string;
  createdBy: string;
  publishedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDraftConfigDto {
  area: ConfigArea;
  parameters: Record<string, any>;
  changelog: string;
}

export interface PublishConfigDto {
  effectiveFrom?: string;
}

export interface RollbackConfigDto {
  area: ConfigArea;
  targetVersion: number;
  reason: string;
}
