// Centralized Resource Scope Resolver — Server-Derived Scoping & Zero-Trust IDOR Defense
import { ForbiddenError, UnauthorizedError } from '../../common/errors';
import { AuthUser } from '../../middleware/auth';

export interface ScopeResolutionOptions {
  requestedTenantId?: string;
  requestedBranchId?: string;
  requestedCustomerId?: string;
  requestedPartnerId?: string;
  partnerId?: string;
  allowCrossBranchRoles?: string[];
}

export interface AuthorizedScope {
  tenantId: string;
  branchId?: string;
  customerId?: string;
  partnerId?: string;
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
  isAuditor: boolean;
  isReadOnly: boolean;
  isPartnerUser: boolean;
}

export class ScopeResolver {
  public static readonly DEFAULT_PRIMARY_TENANT_ID = 'tenant-adyapan-default';

  public static readonly PARTNER_ROLES = [
    'PARTNER_ADMIN',
    'PARTNER_OPERATIONS',
    'PARTNER_AGENT',
    'PARTNER_FINANCE',
    'PARTNER_SUPPORT',
    'PARTNER_API_CLIENT',
  ];

  /**
   * Resolves and enforces verified server-side scope from the authenticated session.
   * Client-supplied identifiers are strictly validated against verified session boundaries.
   *
   * @throws UnauthorizedError if user is not authenticated
   * @throws ForbiddenError if client attempts cross-tenant, cross-branch, cross-customer, or cross-partner access
   */
  public static resolveAuthorizedScope(
    user: AuthUser | undefined,
    options?: ScopeResolutionOptions
  ): AuthorizedScope {
    if (!user) {
      throw new UnauthorizedError('Authentication required to resolve resource scope.');
    }

    const roles = (user.roles || []).map((r) => r.toUpperCase());
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    const isTenantAdmin = roles.includes('ADMIN') || roles.includes('COMPANY_ADMIN') || roles.includes('TENANT_ADMIN');
    const isAuditor = roles.includes('AUDITOR');
    const isCustomer = roles.includes('CUSTOMER') || roles.includes('BORROWER');
    const isPartnerUser = roles.some((r) => ScopeResolver.PARTNER_ROLES.includes(r)) || Boolean(user.partnerId);

    // 1. TENANT SCOPING
    const sessionTenantId = user.tenantId || ScopeResolver.DEFAULT_PRIMARY_TENANT_ID;
    let effectiveTenantId = sessionTenantId;

    if (options?.requestedTenantId) {
      ScopeResolver.validateTenantAccess(user, options.requestedTenantId);
      if (isSuperAdmin) {
        effectiveTenantId = options.requestedTenantId;
      }
    }

    // 2. BRANCH SCOPING
    let effectiveBranchId = user.branchId;
    const branchScopedRoles = ['BRANCH_MANAGER', 'LOAN_OFFICER', 'COLLECTION_OFFICER'];
    const isBranchRestricted = roles.some((r) => branchScopedRoles.includes(r)) && !isSuperAdmin && !isTenantAdmin;

    if (options?.requestedBranchId) {
      if (isBranchRestricted && user.branchId && options.requestedBranchId !== user.branchId) {
        ScopeResolver.validateBranchAccess(user, options.requestedBranchId);
      }
      if (!isBranchRestricted || !user.branchId) {
        effectiveBranchId = options.requestedBranchId;
      }
    }

    // 3. CUSTOMER OWNERSHIP SCOPING
    let effectiveCustomerId: string | undefined;
    if (isCustomer) {
      effectiveCustomerId = user.id;
      if (options?.requestedCustomerId && options.requestedCustomerId !== user.id) {
        ScopeResolver.validateCustomerAccess(user, options.requestedCustomerId);
      }
    } else if (options?.requestedCustomerId) {
      effectiveCustomerId = options.requestedCustomerId;
    }

    // 4. PARTNER SCOPING (ZERO-TRUST IDOR DEFENSE)
    let effectivePartnerId: string | undefined = user.partnerId;

    if (isPartnerUser && user.partnerId) {
      // Partner users are strictly bound to their authenticated partner
      // Client-supplied partnerId parameter cannot override authenticated partner
      if (options?.requestedPartnerId && options.requestedPartnerId !== user.partnerId) {
        ScopeResolver.validatePartnerAccess(user, options.requestedPartnerId);
      }
      effectivePartnerId = user.partnerId;
    } else if (options?.requestedPartnerId || options?.partnerId) {
      // Internal staff requesting specific partner
      const targetPartner = options.requestedPartnerId || options.partnerId;
      if (targetPartner) {
        ScopeResolver.validatePartnerAccess(user, targetPartner);
        effectivePartnerId = targetPartner;
      }
    }

    return {
      tenantId: effectiveTenantId,
      branchId: effectiveBranchId,
      customerId: effectiveCustomerId,
      partnerId: effectivePartnerId,
      isSuperAdmin,
      isTenantAdmin,
      isAuditor,
      isReadOnly: isAuditor,
      isPartnerUser,
    };
  }

  public static validateTenantAccess(user: AuthUser | undefined, requestedTenantId: string): void {
    if (!user) throw new UnauthorizedError('Authentication required.');
    const roles = (user.roles || []).map((r) => r.toUpperCase());
    if (roles.includes('SUPER_ADMIN')) return;

    const sessionTenantId = user.tenantId || ScopeResolver.DEFAULT_PRIMARY_TENANT_ID;
    if (requestedTenantId !== sessionTenantId) {
      throw new ForbiddenError(
        `[IDOR_BLOCKED] Cross-tenant access denied: Authenticated tenant is '${sessionTenantId}', but requested tenant is '${requestedTenantId}'.`
      );
    }
  }

  public static validateBranchAccess(user: AuthUser | undefined, requestedBranchId: string): void {
    if (!user) throw new UnauthorizedError('Authentication required.');
    const roles = (user.roles || []).map((r) => r.toUpperCase());
    if (roles.includes('SUPER_ADMIN') || roles.includes('ADMIN') || roles.includes('TENANT_ADMIN')) return;

    if (user.branchId && requestedBranchId !== user.branchId) {
      throw new ForbiddenError(
        `[IDOR_BLOCKED] Cross-branch access denied: User is assigned to branch '${user.branchId}', but requested branch '${requestedBranchId}'.`
      );
    }
  }

  public static validateCustomerAccess(user: AuthUser | undefined, requestedCustomerId: string): void {
    if (!user) throw new UnauthorizedError('Authentication required.');
    const roles = (user.roles || []).map((r) => r.toUpperCase());
    const isCustomer = roles.includes('CUSTOMER') || roles.includes('BORROWER');
    const isStaff = roles.some((r) => r !== 'CUSTOMER' && r !== 'BORROWER');

    if (isCustomer && !isStaff) {
      if (requestedCustomerId !== user.id && requestedCustomerId !== user.customerId) {
        throw new ForbiddenError(
          `[IDOR_BLOCKED] Customer access violation: Borrower cannot access records belonging to customer '${requestedCustomerId}'.`
        );
      }
    }
  }

  public static validatePartnerAccess(user: AuthUser | undefined, requestedPartnerId: string): void {
    if (!user) throw new UnauthorizedError('Authentication required.');
    const roles = (user.roles || []).map((r) => r.toUpperCase());
    if (roles.includes('SUPER_ADMIN')) return;

    // Internal staff (non-partner roles) can access partner resources within their tenant
    const isPartnerUser = roles.some((r) => ScopeResolver.PARTNER_ROLES.includes(r)) || Boolean(user.partnerId);
    if (isPartnerUser && user.partnerId && requestedPartnerId !== user.partnerId) {
      throw new ForbiddenError(
        `[IDOR_BLOCKED] Cross-partner access denied: Authenticated partner is '${user.partnerId}', but requested partner is '${requestedPartnerId}'.`
      );
    }
  }
}

export const resolveAuthorizedScope = ScopeResolver.resolveAuthorizedScope;
export const validateTenantAccess = ScopeResolver.validateTenantAccess;
export const validateBranchAccess = ScopeResolver.validateBranchAccess;
export const validateCustomerAccess = ScopeResolver.validateCustomerAccess;
export const validatePartnerAccess = ScopeResolver.validatePartnerAccess;
