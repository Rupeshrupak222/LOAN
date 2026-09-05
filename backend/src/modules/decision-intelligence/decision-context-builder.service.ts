import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../common/errors';
import { bankIntelligenceService } from '../bank-intelligence/bank-intelligence.service';
import { scanDeterministicSignals } from '../ai/fraud-intelligence.service';
import { DecisionContext, DataFreshness } from './decision-intelligence.types';

export class DecisionContextBuilderService {
  /**
   * Constructs the unified DecisionContext across application, customer, risk, credit, banking, and fraud.
   */
  public static async build(
    applicationId: string,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<{ context: DecisionContext; extraData: any }> {
    const app = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        customer: {
          include: {
            bankAccounts: true,
            employmentDetails: true,
            documents: true,
            loans: {
              include: {
                schedule: { where: { status: { not: 'PAID' } } },
              },
            },
            collectionCases: true,
          },
        },
        product: true,
        eligibility: true,
        riskAssessment: true,
        underwriting: true,
        documents: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!app) {
      throw new NotFoundError(`Loan application with ID '${applicationId}' not found.`);
    }

    const { customer, product, eligibility, riskAssessment, underwriting } = app;

    // 1. Identity & KYC
    const docs = customer.documents || [];
    const verifiedDocs = docs.filter((d) => d.verified || d.status === 'VERIFIED');
    const docCategories = new Set(docs.map((d) => d.category.toUpperCase()));
    const missingMandatory = ['IDENTITY_PROOF', 'ADDRESS_PROOF'].filter(
      (c) => !docCategories.has(c) && !docCategories.has(c.replace('_PROOF', ''))
    );
    const hasPan = docs.some((d) => (d.documentType || d.category).toUpperCase().includes('PAN'));
    const hasAadhaar = docs.some((d) => (d.documentType || d.category).toUpperCase().includes('AADHAAR'));

    // 2. Application & Product
    const requestedAmount = Number(app.requestedAmount);
    const tenureMonths = app.tenureMonths;
    const appAgeDays = Math.round((Date.now() - app.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    // 3 & 4. Bank Statement & Fraud Intelligence (Executed concurrently for optimal performance)
    const [bankIntelRes, fraudScanRes] = await Promise.allSettled([
      bankIntelligenceService.analyzeCustomerStatement(
        customer.id,
        { forceRefresh: false },
        actor
      ),
      scanDeterministicSignals({
        scope: 'CUSTOMER',
        customerId: customer.id,
      }),
    ]);

    const bankIntel: any = bankIntelRes.status === 'fulfilled' ? bankIntelRes.value : null;
    const fraudSignals: any[] = fraudScanRes.status === 'fulfilled' ? (fraudScanRes.value as any)?.signals || [] : [];
    const highRiskFraudCount = fraudSignals.filter((s) => s.severity === 'Critical' || s.severity === 'High').length;

    // 5. Credit & Historical Servicing
    const activeLoans = customer.loans.filter((l) => l.status === 'ACTIVE');
    const totalSanctioned = activeLoans.reduce((sum, l) => sum + Number(l.principal), 0);
    const totalOutstanding = activeLoans.reduce((sum, l) => sum + Number(l.outstandingPrincipal), 0);

    const maxDpd = customer.collectionCases.reduce((max, c) => Math.max(max, c.dpd), 0);
    const totalOverdue = customer.collectionCases.reduce((sum, c) => sum + Number(c.overdueAmount), 0);

    // 6. Financial Numbers
    const declaredMonthlyIncome = Number(customer.monthlyIncome || customer.employmentDetails[0]?.monthlyIncome || 0);
    const declaredMonthlyObligations = Number(customer.existingObligations || 0);
    const foirPercent = (eligibility?.factors as any)?.foirPercent
      ? Number((eligibility?.factors as any).foirPercent)
      : undefined;

    // 7. Freshness Tracking
    const now = new Date().toISOString();
    const freshness: DataFreshness[] = [
      {
        source: 'Application Record',
        analyzedAt: now,
        dataAsOf: app.updatedAt.toISOString(),
        status: 'CURRENT',
      },
      {
        source: 'Eligibility Engine',
        analyzedAt: eligibility?.createdAt?.toISOString() || now,
        dataAsOf: eligibility?.createdAt?.toISOString() || now,
        status: eligibility ? 'CURRENT' : 'NOT_AVAILABLE',
      },
      {
        source: 'Risk Model',
        analyzedAt: riskAssessment?.createdAt?.toISOString() || now,
        dataAsOf: riskAssessment?.createdAt?.toISOString() || now,
        status: riskAssessment ? 'CURRENT' : 'NOT_AVAILABLE',
      },
      {
        source: 'Bank Statement Intelligence',
        analyzedAt: bankIntel?.analyzedAt || now,
        dataAsOf: bankIntel?.statementPeriod?.toDate || now,
        status: bankIntel && bankIntel.transactionsCount > 0 ? 'CURRENT' : 'NOT_AVAILABLE',
      },
      {
        source: 'Fraud & Anomaly Intelligence',
        analyzedAt: now,
        dataAsOf: now,
        status: 'CURRENT',
      },
    ];

    // Primary Bank Account
    const primaryBank = customer.bankAccounts.find((b) => b.isPrimary) || customer.bankAccounts[0];

    const context: DecisionContext = {
      applicationId: app.id,
      applicationNo: app.applicationNo,
      customerId: customer.id,
      customerCode: customer.customerCode,
      customerName: `${customer.firstName} ${customer.lastName}`,
      generatedAt: now,
      model: 'gemma-4-31b-it',

      identity: {
        kycStatus: customer.kycStatus,
        verifiedDocumentsCount: verifiedDocs.length,
        totalDocumentsCount: docs.length,
        missingMandatoryCategories: missingMandatory,
        hasPan,
        hasAadhaar,
      },

      application: {
        requestedAmount,
        tenureMonths,
        productName: product?.name || 'Standard Retail Loan',
        productCode: product?.code || 'PL-001',
        interestRate: Number(product?.interestRate || 12.0),
        applicationAgeDays: appAgeDays,
        workflowStage: app.status,
        applicationStatus: app.status,
      },

      financial: {
        declaredMonthlyIncome,
        observedBankIncome: bankIntel?.incomeIntelligence?.averageMonthlyIncome,
        incomeStabilityScore: bankIntel?.incomeIntelligence?.incomeStabilityScore,
        salaryFrequency: bankIntel?.incomeIntelligence?.salaryFrequency,
        foirPercent,
        declaredMonthlyObligations,
        detectedMonthlyObligations: bankIntel?.obligationIntelligence?.estimatedTotalMonthlyObligations,
        averageBankBalance: bankIntel?.cashFlowIntelligence?.averageBankBalance,
        netMonthlyCashFlow: bankIntel?.cashFlowIntelligence?.netCashFlow,
        liquidityRiskTier: bankIntel?.cashFlowIntelligence?.liquidityRiskTier,
      },

      credit: {
        activeLoansCount: activeLoans.length,
        totalSanctionedAmount: totalSanctioned,
        totalOutstandingPrincipal: totalOutstanding,
        totalOverdueAmount: totalOverdue,
        maxDpdHistorical: maxDpd,
        repaymentComplianceRate: activeLoans.length > 0 ? '100%' : 'N/A',
      },

      risk: {
        score: riskAssessment?.score || 0,
        category: (riskAssessment?.category as any) || (riskAssessment ? 'MEDIUM' : 'UNASSESSED'),
        factors: Array.isArray(riskAssessment?.factors)
          ? (riskAssessment.factors as any[]).map((f) => ({
              name: f.name || f.pillar || 'Risk Factor',
              score: Number(f.score || 0),
              remarks: f.remarks || '',
            }))
          : [],
      },

      fraudAndAnomalies: {
        fraudSignalsCount: fraudSignals.length,
        highRiskFraudSignalsCount: highRiskFraudCount,
        bankAnomaliesCount: bankIntel?.anomalySignals?.length || 0,
        summary:
          highRiskFraudCount > 0
            ? `${highRiskFraudCount} high-risk anomaly signal(s) detected.`
            : 'Zero material identity fraud signals detected.',
      },

      underwriting: {
        currentDecision: underwriting?.decision,
        decidedBy: underwriting?.decidedBy,
        decidedAt: underwriting?.createdAt?.toISOString(),
        conditions: underwriting?.reason ? [underwriting.reason] : [],
        reviewerNotes: underwriting?.reason || undefined,
      },

      disbursementReadiness: {
        isBankVerified: primaryBank?.isVerified || false,
        isSanctioned: underwriting?.decision === 'APPROVE' || underwriting?.decision === 'APPROVE_WITH_CONDITIONS',
        hasUnresolvedExceptions: Boolean(underwriting?.reason),
        status:
          underwriting?.decision === 'APPROVE' && primaryBank?.isVerified
            ? 'READY'
            : underwriting?.decision === 'APPROVE_WITH_CONDITIONS'
            ? 'CONDITIONAL'
            : 'BLOCKED',
      },

      freshness,
    };

    const extraData = {
      employerNameDeclared: customer.employerName || customer.employmentDetails[0]?.employerName,
      primaryEmployerBank: bankIntel?.incomeIntelligence?.primaryEmployerName,
      detectedEmisCount: bankIntel?.obligationIntelligence?.detectedEmis?.length,
    };

    return { context, extraData };
  }
}
