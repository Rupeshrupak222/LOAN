// Banking Segregation of Duties (SoD) & Maker-Checker Separation Engine
import { ForbiddenError } from '../../common/errors';

export interface SodSeparationCheckOptions {
  actionName: string;
  makerUserId?: string;
  checkerUserId?: string;
  entityType?: string;
  entityId?: string;
  tenantId?: string;
}

export class SodValidator {
  /**
   * Enforces that the maker/proposer of a financial transaction or critical change
   * CANNOT be the same user who acts as the checker/approver.
   *
   * @throws ForbiddenError if makerUserId === checkerUserId
   */
  public static assertMakerCheckerSeparation(
    makerUserId: string | undefined | null,
    checkerUserId: string | undefined | null,
    actionName: string
  ): void {
    if (!makerUserId || !checkerUserId) {
      // If either ID is missing, caller must ensure valid identity contexts
      return;
    }

    if (makerUserId.trim().toLowerCase() === checkerUserId.trim().toLowerCase()) {
      throw new ForbiddenError(
        `[SOD_VIOLATION] Maker-Checker conflict: User '${checkerUserId}' cannot approve or sign off on their own transaction for '${actionName}'. Segregation of Duties (SoD) strictly prohibits self-approval.`
      );
    }
  }

  /**
   * Enforces that dual-control is maintained on financial payout releases.
   * Initiator and Releaser must be separate authorized staff members.
   */
  public static assertDualControlPayout(
    initiatorUserId: string | undefined | null,
    releaserUserId: string | undefined | null
  ): void {
    if (!initiatorUserId || !releaserUserId) return;
    if (initiatorUserId.trim().toLowerCase() === releaserUserId.trim().toLowerCase()) {
      throw new ForbiddenError(
        `[SOD_VIOLATION] Dual-control payout violation: Payout initiator '${initiatorUserId}' cannot also authorize or release disbursement.`
      );
    }
  }

  /**
   * Enforces that compliance and audit roles cannot perform state-changing operational mutations.
   *
   * @throws ForbiddenError if an auditor-only actor attempts an operational write action
   */
  public static assertAuditorReadOnly(userOrRoles: string[] | { roles?: string[] }, actionName: string): void {
    const rawRoles = Array.isArray(userOrRoles) ? userOrRoles : userOrRoles?.roles || [];
    const normalizedRoles = rawRoles.map((r) => r.toUpperCase());
    const isAuditorOnly = normalizedRoles.length === 1 && normalizedRoles.includes('AUDITOR');

    if (isAuditorOnly) {
      throw new ForbiddenError(
        `[SOD_VIOLATION] Auditor role is strictly read-only. User cannot execute state-changing operational mutation '${actionName}'.`
      );
    }
  }

  /**
   * Enforces that customer borrowers cannot access internal staff permissions.
   *
   * @throws ForbiddenError if borrower attempts staff operations
   */
  public static assertBorrowerInternalRestriction(userOrRoles: string[] | { roles?: string[] }, attemptedDomain: string): void {
    const rawRoles = Array.isArray(userOrRoles) ? userOrRoles : userOrRoles?.roles || [];
    const normalizedRoles = rawRoles.map((r) => r.toUpperCase());
    const isCustomer = normalizedRoles.includes('CUSTOMER') || normalizedRoles.includes('BORROWER');
    const isStaff = normalizedRoles.some((r) => r !== 'CUSTOMER' && r !== 'BORROWER');

    if (isCustomer && !isStaff) {
      const internalDomains = [
        'credit',
        'underwriting',
        'approval',
        'payout',
        'accounting',
        'risk',
        'fraud',
        'audit',
        'tenant',
        'user',
        'role',
        'bre',
        'config',
        'system',
      ];

      const domain = attemptedDomain.toLowerCase().split('.')[0];
      if (internalDomains.includes(domain)) {
        throw new ForbiddenError(
          `[ACCESS_DENIED] Borrower identities are strictly restricted to customer-facing self-service portals. Access to internal domain '${attemptedDomain}' is forbidden.`
        );
      }
    }
  }

  /**
   * Enforces operational separation of duties based on specific rule codes.
   */
  public static assertOperationalSeparation(
    context: { userId: string; sanctionedBy?: string; action: string },
    ruleCode: string
  ): void {
    if (ruleCode === 'SOD_SANCTION_DISBURSER' && context.userId && context.sanctionedBy) {
      if (context.userId.trim().toLowerCase() === context.sanctionedBy.trim().toLowerCase()) {
        throw new ForbiddenError(
          `[SOD_VIOLATION] Separation of Duties violation: Sanctioning underwriter cannot execute disbursement release.`
        );
      }
    }
  }

  /**
   * Enforces that the loan officer who sourced/originated the application
   * cannot act as the credit analyst, underwriter, or disbursement officer on that proposal.
   */
  public static assertLoanOfficerSeparation(
    originatorUserId: string | undefined | null,
    approverUserId: string | undefined | null,
    actionName: string
  ): void {
    if (!originatorUserId || !approverUserId) return;
    if (originatorUserId.trim().toLowerCase() === approverUserId.trim().toLowerCase()) {
      throw new ForbiddenError(
        `[SOD_VIOLATION] Sourcing vs Approval conflict: Loan Officer '${approverUserId}' who originated or submitted the application cannot approve, sanction, or disburse it for '${actionName}'.`
      );
    }
  }
  /**
   * Enforces that Super Admin cannot perform operational lending transactions.
   * Super Admin is strictly a platform control-plane role.
   *
   * @throws ForbiddenError if user only has SUPER_ADMIN or attempts an operational lending transaction under platform authority
   */
  public static assertSuperAdminOperationalSeparation(userOrRoles: string[] | { roles?: string[] }, actionName: string): void {
    const rawRoles = Array.isArray(userOrRoles) ? userOrRoles : userOrRoles?.roles || [];
    const normalizedRoles = rawRoles.map((r) => r.toUpperCase());
    const isSuperAdmin = normalizedRoles.includes('SUPER_ADMIN');

    // Operational roles that would be needed to execute operational transactions
    const operationalLendingRoles = [
      'UNDERWRITER',
      'CREDIT_HEAD',
      'CREDIT_ANALYST',
      'LOAN_OFFICER',
      'DISBURSEMENT_OFFICER',
      'FINANCE_OFFICER',
      'COLLECTION_OFFICER',
      'COLLECTION_AGENT',
      'BRANCH_MANAGER',
    ];

    const hasOperationalRole = normalizedRoles.some((r) => operationalLendingRoles.includes(r));

    if (isSuperAdmin && !hasOperationalRole) {
      throw new ForbiddenError(
        `[SOD_VIOLATION] Platform Admin vs Lending Operative conflict: SUPER_ADMIN is a platform control-plane role and cannot perform operational lending action '${actionName}'. Operational lending actions require an authorized business or credit role.`
      );
    }
  }
}

export const assertMakerCheckerSeparation = SodValidator.assertMakerCheckerSeparation;
export const assertDualControlPayout = SodValidator.assertDualControlPayout;
export const assertAuditorReadOnly = SodValidator.assertAuditorReadOnly;
export const assertBorrowerInternalRestriction = SodValidator.assertBorrowerInternalRestriction;
export const assertOperationalSeparation = SodValidator.assertOperationalSeparation;
export const assertLoanOfficerSeparation = SodValidator.assertLoanOfficerSeparation;
export const assertSuperAdminOperationalSeparation = SodValidator.assertSuperAdminOperationalSeparation;
