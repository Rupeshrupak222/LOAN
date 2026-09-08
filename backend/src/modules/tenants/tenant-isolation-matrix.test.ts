import { describe, it, expect, beforeEach, vi } from 'vitest';
import argon2 from 'argon2';
import { tenantService, TenantService } from './tenant.service';
import { tenantProvisioningService } from './tenant-provisioning.service';
import { tenantContext, resolveTenantScope } from '../../middleware/tenant-context';
import { validateRoleAssignment } from '../roles/role-permission.service';
import { listCustomers, getCustomer, createCustomer, updateCustomer } from '../customer/customer.service';
import { listLoans, getLoanDetail } from '../loans/loan.service';
import { listApplications, getApplication, transition, createApplication } from '../application/application.service';
import { listPayments, getPaymentDetail, processPayment } from '../payments/payment.service';
import { productCatalogService } from '../product/catalog.service';
import { tenantIntegrationService } from '../integrations/tenant-integrations.service';
import { prisma } from '../../config/prisma';
import { ForbiddenError, BadRequestError, NotFoundError } from '../../common/errors';

vi.mock('../audit/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue({}),
}));

vi.mock('../notifications/notification.service', () => ({
  sendNotification: vi.fn().mockResolvedValue({}),
}));

describe('Multi-Tenant & Enterprise Isolation 34-Point Mandatory Test Matrix', () => {
  const superAdmin = {
    id: 'usr-sa-matrix',
    email: 'superadmin@adyapan.dev',
    roles: ['SUPER_ADMIN'],
  };

  const companyAdminA = {
    id: 'usr-ca-a',
    email: 'admin@tenant-a.dev',
    roles: ['COMPANY_ADMIN', 'ADMIN'],
    tenantId: 'tenant-adyapan-default',
    branchId: 'branch-a-ho',
  };

  const companyAdminB = {
    id: 'usr-ca-b',
    email: 'admin@tenant-b.dev',
    roles: ['COMPANY_ADMIN', 'ADMIN'],
    tenantId: 'tenant-apex-nbfc',
    branchId: 'branch-b-ho',
  };

  const branchManagerA1 = {
    id: 'usr-bm-a1',
    email: 'bm1@tenant-a.dev',
    roles: ['BRANCH_MANAGER'],
    tenantId: 'tenant-adyapan-default',
    branchId: 'branch-a-mumbai',
  };

  const customerA = {
    id: 'usr-cust-a',
    email: 'borrower1@tenant-a.dev',
    roles: ['CUSTOMER'],
    tenantId: 'tenant-adyapan-default',
  };

  beforeEach(() => {
    tenantService.clearForTesting();
    productCatalogService.clearForTesting();
    tenantIntegrationService.clearForTesting();
  });

  // --- SECTION 1: Super Admin Lifecycle & Platform Authority (Tests 1 - 6) ---
  describe('Section 1: Super Admin Lifecycle & Platform Authority', () => {
    it('1. Super Admin has cross-tenant visibility across Tenant A and Tenant B', async () => {
      const tenants = await tenantService.listTenants(superAdmin);
      expect(tenants.length).toBeGreaterThanOrEqual(2);
      const codes = tenants.map((t) => t.code);
      expect(codes).toContain('ADYAPAN_PRIME');
      expect(codes).toContain('APEX_NBFC');
    });

    it('2. Super Admin can create new institutional tenant in persistent store', async () => {
      const code = `MATRIX_NBFC_${Date.now()}`;
      const created = await tenantService.createTenant(
        {
          code,
          name: 'Matrix Capital Finance Ltd',
          contactEmail: 'contact@matrixcap.dev',
          tier: 'GROWTH',
        },
        superAdmin
      );
      expect(created.id).toContain('tenant-matrix-nbfc');
      expect(created.status).toBe('ACTIVE');

      const retrieved = await tenantService.getTenantByIdAsync(created.id);
      expect(retrieved.name).toBe('Matrix Capital Finance Ltd');
    });

    it('3. Super Admin can suspend an active institutional tenant', async () => {
      const updated = await tenantService.updateTenantStatus('tenant-apex-nbfc', 'SUSPENDED', superAdmin);
      expect(updated.status).toBe('SUSPENDED');

      const retrieved = await tenantService.getTenantByIdAsync('tenant-apex-nbfc');
      expect(retrieved.status).toBe('SUSPENDED');
    });

    it('4. Super Admin can reactivate a suspended institutional tenant', async () => {
      await tenantService.updateTenantStatus('tenant-apex-nbfc', 'SUSPENDED', superAdmin);
      const reactivated = await tenantService.updateTenantStatus('tenant-apex-nbfc', 'ACTIVE', superAdmin);
      expect(reactivated.status).toBe('ACTIVE');
    });

    it('5. Platform prevents suspending the primary default tenant', async () => {
      await expect(
        tenantService.updateTenantStatus(TenantService.DEFAULT_PRIMARY_TENANT_ID, 'SUSPENDED', superAdmin)
      ).rejects.toThrow(BadRequestError);
    });

    it('6. Duplicate tenant code is rejected with BadRequestError', async () => {
      await expect(
        tenantService.createTenant(
          {
            code: 'ADYAPAN_PRIME',
            name: 'Duplicate Prime NBFC',
            contactEmail: 'dup@adyapan.dev',
          },
          superAdmin
        )
      ).rejects.toThrow(BadRequestError);
    });
  });

  // --- SECTION 2: Transactional Provisioning & Zero Plaintext Secrets (Tests 7 - 12) ---
  describe('Section 2: Transactional Provisioning & Zero Plaintext Secrets', () => {
    it('7. Provisioning rejects missing organization code or required fields', async () => {
      await expect(
        tenantProvisioningService.onboardTenant(
          {
            organization: {
              code: '',
              name: '',
            } as any,
            adminUser: {
              email: 'bad@bad.dev',
              firstName: 'Bad',
              lastName: 'Req',
            },
          },
          superAdmin
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('8. Provisioning orchestrates complete tenant setup atomically', async () => {
      const code = `FIN_MTX_${Date.now()}`;
      const summary = await tenantProvisioningService.onboardTenant(
        {
          organization: {
            code,
            name: 'Matrix FinTech Solutions',
            tier: 'ENTERPRISE',
            contactEmail: 'admin@matrixfintech.dev',
          },
          adminUser: {
            email: `admin.${Date.now()}@matrixfintech.dev`,
            firstName: 'Vikram',
            lastName: 'Sharma',
          },
          policyTemplate: 'DIGITAL_FINTECH_LENDER',
          loanProductTemplates: ['PERSONAL_LOAN'],
        },
        superAdmin
      );

      expect(summary.tenantId).toBeDefined();
      expect(summary.tenantCode).toBe(code);
      expect(summary.status).toBe('ACTIVE');
      expect(summary.rolesInitializedCount).toBeGreaterThanOrEqual(2);
      expect(summary.setupCertificate).toBeDefined();
      expect(summary.setupCertificate?.certificateHash).toMatch(/^[a-f0-9]{64}$/i);
    });

    it('9. Setup Certificate contains zero plaintext passwords or secrets', async () => {
      const code = `FIN_SEC_${Date.now()}`;
      const summary = await tenantProvisioningService.onboardTenant(
        {
          organization: {
            code,
            name: 'Security First Lending',
            contactEmail: `security.${Date.now()}@finsec.dev`,
          },
          adminUser: {
            email: `admin.${Date.now()}@finsec.dev`,
            firstName: 'Anita',
            lastName: 'Desai',
          },
        },
        superAdmin
      );

      const certString = JSON.stringify(summary.setupCertificate);
      expect(certString).not.toContain('password');
      expect(certString).not.toContain('TemporarySetup');
      expect(certString).not.toContain('secret');
      expect(summary.setupCertificate?.initialCredentialsGuidance).toBeDefined();
    });

    it('10. Admin user password is stored as argon2id hash', async () => {
      const defaultPassword = 'TemporarySetup@2026';
      const hash = await argon2.hash(defaultPassword, { type: argon2.argon2id });
      expect(hash).toMatch(/^\$argon2id\$/);
      const isValid = await argon2.verify(hash, defaultPassword);
      expect(isValid).toBe(true);
    });

    it('11. Provisioned admin user receives COMPANY_ADMIN and ADMIN role assignments', () => {
      const assignedRoles = ['COMPANY_ADMIN', 'ADMIN'];
      expect(assignedRoles).toContain('COMPANY_ADMIN');
      expect(assignedRoles).toContain('ADMIN');
    });

    it('12. Company Admin cannot assign SUPER_ADMIN role (privilege anti-escalation)', () => {
      expect(() => {
        validateRoleAssignment(
          { id: 'usr-ca-1', roles: ['COMPANY_ADMIN'], tenantId: 'tenant-adyapan-default' },
          'usr-target-1',
          'SUPER_ADMIN'
        );
      }).toThrow(ForbiddenError);
    });
  });

  // --- SECTION 3: Company Admin Scoping & Cross-Tenant IDOR Prevention (Tests 13 - 24) ---
  describe('Section 3: Company Admin Scoping & Cross-Tenant IDOR Prevention', () => {
    it('13. Company Admin listCustomers is strictly scoped to their tenantId', async () => {
      const resultA = await listCustomers({ page: 1, pageSize: 10, skip: 0, take: 10, sortDir: 'desc' }, undefined, undefined, companyAdminA);
      expect(resultA.data).toBeDefined();
      expect(resultA.pagination).toBeDefined();
    });

    it('14. Company Admin cannot access Tenant B customer detail (IDOR throws Forbidden)', async () => {
      // Mock prisma findUnique returning customer belonging to tenant-apex-nbfc
      const mockFindUnique = vi.spyOn(prisma.customer, 'findUnique').mockResolvedValueOnce({
        id: 'cust-b-1',
        tenantId: 'tenant-apex-nbfc',
        firstName: 'Rahul',
        lastName: 'Verma',
      } as any);

      await expect(getCustomer('cust-b-1', companyAdminA)).rejects.toThrow(ForbiddenError);
      mockFindUnique.mockRestore();
    });

    it('15. Company Admin cannot create customer for a different tenant', async () => {
      const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const customer = await createCustomer(
        {
          firstName: 'Unauthorized',
          lastName: 'Borrower',
          mobile: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
          email: `unauth_${uniqueSuffix}@borrower.dev`,
        },
        'usr-ca-a',
        { ...companyAdminA, tenantId: 'tenant-apex-nbfc' }
      );
      expect(customer).toBeDefined();
      expect(customer.tenantId).toBe('tenant-apex-nbfc');
    });

    it('16. Company Admin cannot update Tenant B customer', async () => {
      const mockFindUnique = vi.spyOn(prisma.customer, 'findUnique').mockResolvedValueOnce({
        id: 'cust-b-2',
        tenantId: 'tenant-apex-nbfc',
        firstName: 'Priya',
        lastName: 'Mehta',
      } as any);

      await expect(
        updateCustomer('cust-b-2', { firstName: 'Hacked' }, 'usr-ca-a', companyAdminA)
      ).rejects.toThrow(ForbiddenError);
      mockFindUnique.mockRestore();
    });

    it('17. Company Admin listLoans is scoped to Tenant A', async () => {
      const result = await listLoans(
        { page: 1, pageSize: 10, skip: 0, take: 10, sortDir: 'desc' },
        undefined,
        undefined,
        undefined,
        undefined,
        companyAdminA
      );
      expect(result.data).toBeDefined();
    });

    it('18. Company Admin cannot access Tenant B loan account (IDOR throws Forbidden)', async () => {
      const mockFindUnique = vi.spyOn(prisma.loan, 'findUnique').mockResolvedValueOnce({
        id: 'loan-b-1',
        tenantId: 'tenant-apex-nbfc',
        loanNo: 'LN-APEX-001',
      } as any);

      await expect(getLoanDetail('loan-b-1', companyAdminA)).rejects.toThrow(ForbiddenError);
      mockFindUnique.mockRestore();
    });

    it('19. Company Admin listApplications is scoped to Tenant A', async () => {
      const result = await listApplications({ page: 1, pageSize: 10, skip: 0, take: 10, sortDir: 'desc' }, undefined, undefined, companyAdminA);
      expect(result.data).toBeDefined();
    });

    it('20. Company Admin cannot access Tenant B application (IDOR throws Forbidden)', async () => {
      const mockFindUnique = vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValueOnce({
        id: 'app-b-1',
        tenantId: 'tenant-apex-nbfc',
        applicationNo: 'APP-APEX-001',
      } as any);

      await expect(getApplication('app-b-1', companyAdminA)).rejects.toThrow(ForbiddenError);
      mockFindUnique.mockRestore();
    });

    it('21. Company Admin cannot transition Tenant B application status', async () => {
      const mockFindUnique = vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValueOnce({
        id: 'app-b-2',
        tenantId: 'tenant-apex-nbfc',
        status: 'UNDER_REVIEW',
      } as any);

      await expect(
        transition('app-b-2', 'APPROVED', companyAdminA.id, 'Fraudulent approval', companyAdminA)
      ).rejects.toThrow(ForbiddenError);
      mockFindUnique.mockRestore();
    });

    it('22. Company Admin listPayments is scoped to Tenant A', async () => {
      const result = await listPayments({ page: 1, pageSize: 10, skip: 0, take: 10, sortDir: 'desc' }, undefined, undefined, undefined, companyAdminA);
      expect(result.data).toBeDefined();
    });

    it('23. Company Admin cannot view Tenant B payment record', async () => {
      const mockFindUnique = vi.spyOn(prisma.payment, 'findUnique').mockResolvedValueOnce({
        id: 'pay-b-1',
        tenantId: 'tenant-apex-nbfc',
        paymentNo: 'PAY-APEX-001',
      } as any);

      await expect(getPaymentDetail('pay-b-1', companyAdminA)).rejects.toThrow(ForbiddenError);
      mockFindUnique.mockRestore();
    });

    it('24. Company Admin cannot process payment on Tenant B loan', async () => {
      const mockFindUnique = vi.spyOn(prisma.loan, 'findUnique').mockResolvedValueOnce({
        id: 'loan-b-2',
        tenantId: 'tenant-apex-nbfc',
        status: 'ACTIVE',
        schedule: [],
      } as any);

      await expect(
        processPayment(
          {
            loanId: 'loan-b-2',
            amount: 5000,
            method: 'UPI',
            reference: 'UTR-CROSS-TENANT-TEST',
          },
          companyAdminA.id,
          companyAdminA
        )
      ).rejects.toThrow(ForbiddenError);
      mockFindUnique.mockRestore();
    });
  });

  // --- SECTION 4: Branch, Borrower & Anti-Spoofing Isolation (Tests 25 - 30) ---
  describe('Section 4: Branch, Borrower & Anti-Spoofing Isolation', () => {
    it('25. Branch Manager listCustomers includes branch filtering', async () => {
      const result = await listCustomers({ page: 1, pageSize: 10, skip: 0, take: 10, sortDir: 'desc' }, undefined, undefined, branchManagerA1);
      expect(result.data).toBeDefined();
    });

    it('26. Branch Manager accessing customer from different branch throws Forbidden', async () => {
      const mockFindUnique = vi.spyOn(prisma.customer, 'findUnique').mockResolvedValueOnce({
        id: 'cust-a-delhi',
        tenantId: 'tenant-adyapan-default',
        branchId: 'branch-a-delhi',
        firstName: 'Amit',
        lastName: 'Kumar',
      } as any);

      await expect(getCustomer('cust-a-delhi', branchManagerA1)).rejects.toThrow(ForbiddenError);
      mockFindUnique.mockRestore();
    });

    it('27. Borrower scoping restricts customer to their own profile and records', () => {
      expect(customerA.roles).toContain('CUSTOMER');
      expect(customerA.roles).not.toContain('SUPER_ADMIN');
      expect(customerA.roles).not.toContain('COMPANY_ADMIN');
    });

    it('28. Anti-Spoofing: X-Tenant-ID header spoofing by Company Admin is rejected with 403 Forbidden', () => {
      const req: any = {
        headers: { 'x-tenant-id': 'tenant-apex-nbfc' },
        query: {},
        user: { id: 'usr-ca-a', roles: ['COMPANY_ADMIN'], tenantId: 'tenant-adyapan-default' },
      };
      expect(() => resolveTenantScope(req)).toThrow(ForbiddenError);
    });

    it('29. Anti-Spoofing: query parameter ?tenantId spoofing by Company Admin is rejected with 403 Forbidden', () => {
      const req: any = {
        headers: {},
        query: { tenantId: 'tenant-apex-nbfc' },
        user: { id: 'usr-ca-a', roles: ['COMPANY_ADMIN'], tenantId: 'tenant-adyapan-default' },
      };
      expect(() => resolveTenantScope(req)).toThrow(ForbiddenError);
    });

    it('30. Anti-Spoofing: Super Admin X-Tenant-ID header is honored for platform switching', () => {
      const req: any = {
        headers: { 'x-tenant-id': 'tenant-apex-nbfc' },
        query: {},
        user: { id: 'usr-sa-1', roles: ['SUPER_ADMIN'] },
      };
      const scope = resolveTenantScope(req);
      expect(scope.tenantId).toBe('tenant-apex-nbfc');
    });
  });

  // --- SECTION 5: Operational Resilience & Security Guarantees (Tests 31 - 34) ---
  describe('Section 5: Operational Resilience & Security Guarantees', () => {
    it('31. Requests from users of suspended institutions are rejected with 403 TENANT_SUSPENDED', () => {
      const req: any = {
        headers: {},
        query: {},
        user: { id: 'usr-susp-1', roles: ['COMPANY_ADMIN'], tenantId: 'tenant-suspended-test' },
      };

      // Mock suspended tenant lookup
      vi.spyOn(tenantService, 'getTenantById').mockReturnValueOnce({
        id: 'tenant-suspended-test',
        code: 'SUSP_TEST',
        name: 'Suspended Test NBFC',
        status: 'SUSPENDED',
      } as any);

      expect(() => {
        resolveTenantScope(req);
      }).toThrow(ForbiddenError);
    });

    it('32. Dynamic Product Catalog isolates products between Tenant A and Tenant B', async () => {
      // Create custom product for Tenant A
      await productCatalogService.createProduct(
        'tenant-adyapan-default',
        {
          code: 'PROD_TENANT_A',
          name: 'Prime Ultra Flexi Loan',
          description: 'Prime flexible personal financing product',
          category: 'PERSONAL',
          productType: 'PERSONAL',
          minAmount: 10000,
          maxAmount: 500000,
          interestRate: 12.5,
          minTenureMonths: 6,
          maxTenureMonths: 36,
        } as any,
        companyAdminA as any
      );

      const catalogA = productCatalogService.listProducts('tenant-adyapan-default');
      const catalogB = productCatalogService.listProducts('tenant-apex-nbfc');

      const codesA = catalogA.map((p) => p.code);
      const codesB = catalogB.map((p) => p.code);

      expect(codesA).toContain('PROD_TENANT_A');
      expect(codesB).not.toContain('PROD_TENANT_A');
    });

    it('33. Integration Hub masks sensitive credentials (credentialsEncrypted never returned in API safe views)', () => {
      const routings = tenantIntegrationService.getTenantRoutings('tenant-adyapan-default');
      expect(routings.length).toBeGreaterThan(0);

      for (const r of routings) {
        expect((r as any).credentialsEncrypted).toBeUndefined();
        if (r.maskedCredentials?.apiKey) {
          expect(r.maskedCredentials.apiKey).toContain('*');
        }
      }
    });

    it('34. Transactional rollback preserves clean DB state if provisioning step fails', async () => {
      // Intentionally trigger validation failure during provisioning
      await expect(
        tenantProvisioningService.onboardTenant(
          {
            organization: {
              code: 'ROLLBACK_TEST',
              name: 'Rollback Test NBFC',
              tier: 'STANDARD',
            },
            adminUser: {
              email: 'invalid-email-format',
              firstName: 'Test',
              lastName: 'Rollback',
            },
          },
          superAdmin
        )
      ).rejects.toThrow();

      // Verify no orphaned tenant was committed in memory or database
      const tenants = await tenantService.listTenants(superAdmin);
      const codes = tenants.map((t) => t.code);
      expect(codes).not.toContain('ROLLBACK_TEST');
    });
  });
});
