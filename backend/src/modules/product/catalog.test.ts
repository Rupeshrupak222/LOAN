import { describe, it, expect, beforeEach } from 'vitest';
import { productCatalogService } from './catalog.service';

describe('Step 36: Dynamic Product Catalog & Pricing Engine', () => {
  const tenantId = 'tenant-adyapan-default';
  const superAdmin = { id: 'usr-sa-001', email: 'superadmin@adyapan.dev', roles: ['SUPER_ADMIN'] };
  const underwriter = { id: 'usr-uw-001', email: 'underwriter@adyapan.dev', roles: ['UNDERWRITER'] };

  beforeEach(() => {
    productCatalogService.clearForTesting();
  });

  describe('1. Canonical Product Catalog Initialization', () => {
    it('initializes canonical multi-category products with reducing and floating models', () => {
      const products = productCatalogService.listProducts(tenantId);
      expect(products.length).toBeGreaterThanOrEqual(4);

      const codes = products.map((p) => p.code);
      expect(codes).toContain('PERSONAL_PRIME_SALARIED');
      expect(codes).toContain('SME_GROWTH_BUSINESS');
      expect(codes).toContain('BNPL_INSTANT_CHECKOUT');
      expect(codes).toContain('COMMERCIAL_MCLR_LINKED');
    });
  });

  describe('2. Pricing & EMI Simulation with Statutory RBI KFS', () => {
    it('computes reducing balance EMI, processing fees, net disbursement, and statutory APR', () => {
      const prime = productCatalogService.getProductById(tenantId, 'PERSONAL_PRIME_SALARIED');

      const sim = productCatalogService.simulateProductPricing(tenantId, {
        productId: prime.id,
        loanAmount: 500000, // ₹5,00,000
        tenureMonths: 24, // 24 Months
      });

      expect(sim.loanAmount).toBe(500000);
      expect(sim.tenureMonths).toBe(24);
      expect(sim.appliedInterestRateAnnualPct).toBe(12.5);
      expect(sim.monthlyEmi).toBeGreaterThan(23000);
      expect(sim.monthlyEmi).toBeLessThan(24000); // approx ₹23,656
      expect(sim.processingFee).toBe(10000); // 2.0% of 5L = ₹10,000
      expect(sim.documentationCharges).toBe(500);
      expect(sim.totalFees).toBe(10500);
      expect(sim.netDisbursedAmount).toBe(489500); // 500,000 - 10,500
      expect(sim.annualPercentageRateApr).toBeGreaterThan(12.5); // APR includes fee amortisation

      // Statutory Key Fact Statement (KFS) check
      expect(sim.keyFactStatement.sanctionAmount).toBe(500000);
      expect(sim.keyFactStatement.rateOfInterestType).toBe('REDUCING_BALANCE');
      expect(sim.keyFactStatement.coolingOffPeriodDays).toBe(3);
    });

    it('computes fixed flat rate interest for BNPL products', () => {
      const bnpl = productCatalogService.getProductById(tenantId, 'BNPL_INSTANT_CHECKOUT');

      const sim = productCatalogService.simulateProductPricing(tenantId, {
        productId: bnpl.id,
        loanAmount: 60000,
        tenureMonths: 6,
      });

      expect(sim.interestModel).toBe('FIXED_FLAT');
      expect(sim.totalInterest).toBe(5400); // (60,000 * 18% * 6)/12 = 5,400
      expect(sim.monthlyEmi).toBe(10900); // (60,000 + 5,400) / 6 = 10,900
    });

    it('computes floating MCLR spread rate for commercial credit facilities', () => {
      const comm = productCatalogService.getProductById(tenantId, 'COMMERCIAL_MCLR_LINKED');

      const sim = productCatalogService.simulateProductPricing(tenantId, {
        productId: comm.id,
        loanAmount: 2000000, // ₹20 Lakh
        tenureMonths: 36,
      });

      expect(sim.interestModel).toBe('FLOATING_MCLR_LINKED');
      expect(sim.appliedInterestRateAnnualPct).toBe(13.0); // 8.5% MCLR + 4.5% spread
    });
  });

  describe('3. Immutable Versioning & Retroactive Change Safety', () => {
    it('creates immutable version snapshots preventing retroactive shifts to existing active loans', async () => {
      const prime = productCatalogService.getProductById(tenantId, 'PERSONAL_PRIME_SALARIED');
      expect(prime.version).toBe(1);
      expect(prime.baseInterestRateAnnualPct).toBe(12.5);

      // 1. Update product interest rate to 14.0%
      const updatedV2 = await productCatalogService.updateProductWithVersioning(
        tenantId,
        prime.id,
        { baseInterestRateAnnualPct: 14.0 },
        superAdmin
      );

      expect(updatedV2.version).toBe(2);
      expect(updatedV2.baseInterestRateAnnualPct).toBe(14.0);

      // 2. Active loan referencing version 1 retrieves original 12.5% rate
      const v1Snapshot = productCatalogService.getProductVersionSnapshot(tenantId, prime.id, 1);
      expect(v1Snapshot.version).toBe(1);
      expect(v1Snapshot.baseInterestRateAnnualPct).toBe(12.5);

      // 3. New simulation on current product uses version 2 rate (14.0%)
      const simV2 = productCatalogService.simulateProductPricing(tenantId, {
        productId: prime.id,
        loanAmount: 100000,
        tenureMonths: 12,
      });
      expect(simV2.version).toBe(2);
      expect(simV2.appliedInterestRateAnnualPct).toBe(14.0);
    });
  });

  describe('4. Underwriting Policy Overrides & Eligibility Evaluation', () => {
    it('evaluates applicant eligibility against product-specific policy overrides', () => {
      const prime = productCatalogService.getProductById(tenantId, 'PERSONAL_PRIME_SALARIED');

      // 1. Fails: CIBIL below 680 override
      const failSim = productCatalogService.simulateProductPricing(tenantId, {
        productId: prime.id,
        loanAmount: 200000,
        tenureMonths: 24,
        applicantProfile: {
          cibilScore: 640, // Below 680
          monthlyIncome: 50000,
        },
      });

      expect(failSim.eligibilityCheck.eligible).toBe(false);
      expect(failSim.eligibilityCheck.reasons[0]).toContain('CIBIL bureau score 640 is below minimum product threshold');

      // 2. Passes: CIBIL 740, Income 60k
      const passSim = productCatalogService.simulateProductPricing(tenantId, {
        productId: prime.id,
        loanAmount: 200000,
        tenureMonths: 24,
        applicantProfile: {
          cibilScore: 740,
          monthlyIncome: 60000,
          existingEmis: 5000,
        },
      });

      expect(passSim.eligibilityCheck.eligible).toBe(true);
      expect(passSim.eligibilityCheck.reasons.length).toBe(0);
      expect(passSim.eligibilityCheck.computedFoirPct).toBeLessThan(50);
    });
  });

  describe('5. RBAC Protection', () => {
    it('rejects underwriter attempts to launch new products or modify terms', async () => {
      await expect(
        productCatalogService.createProduct(
          tenantId,
          {
            code: 'ILLEGAL_PROD',
            name: 'Illegal Product',
            description: 'Unauthorized',
            category: 'PERSONAL',
            interestModel: 'REDUCING_BALANCE',
            baseInterestRateAnnualPct: 10,
            minLoanAmountInr: 10000,
            maxLoanAmountInr: 50000,
            minTenureMonths: 3,
            maxTenureMonths: 12,
            feeSchedule: {
              processingFeePct: 1,
              processingFeeMinInr: 100,
              documentationChargesInr: 0,
              foreclosurePenaltyPct: 0,
              lockInMonths: 0,
              latePaymentPenaltyMonthlyPct: 1,
              gracePeriodDays: 3,
            },
          },
          underwriter
        )
      ).rejects.toThrow('Only Administrators can launch new loan products.');
    });
  });
});
