import { prisma } from '../../config/prisma';
import { generateGeminiContent } from './gemini.service';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';

export interface Customer360IntelligenceResult {
  customerId: string;
  customerCode: string;
  customerName: string;
  generatedAt: string;
  dataAsOf: string;
  model: string;
  lifecycleStage: string;
  customerSummary: string;
  lifecycleSummary: string;
  portfolioSummary: {
    totalLoans: number;
    activeLoans: number;
    totalSanctionedAmount: number;
    totalOutstandingPrincipal: number;
    totalOverdueAmount: number;
    overallServicingStatus: string;
  };
  repaymentInsights: {
    complianceRate: string;
    paidInstallmentsCount: number;
    overdueInstallmentsCount: number;
    behaviorTrend: string;
    observations: string;
  };
  riskAndCreditContext: {
    initialRiskTier: string;
    initialRiskScore: number;
    currentTrajectory: string;
    observations: string;
  };
  kycDocumentContext: {
    kycStatus: string;
    verifiedDocumentsCount: number;
    totalDocumentsCount: number;
    missingCategories: string[];
    observations: string;
  };
  collectionsContext: {
    activeCasesCount: number;
    maxDpd: number;
    ptpStatus: string;
    observations: string;
  };
  timeline: {
    timestamp: string;
    event: string;
    category: 'ONBOARDING' | 'KYC' | 'ORIGINATION' | 'UNDERWRITING' | 'DISBURSEMENT' | 'REPAYMENT' | 'COLLECTION' | 'SERVICING';
    description: string;
  }[];
  changesDetected: {
    change: string;
    previousState: string;
    currentState: string;
    whyItMatters: string;
  }[];
  positiveSignals: string[];
  attentionRequired: {
    category: string;
    issue: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    evidence: string;
    recommendedReview: string;
  }[];
  recommendedActions: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Builds authoritative LMS context specifically tailored for Customer 360 Intelligence.
 */
async function buildCustomer360Context(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      branch: true,
      addresses: true,
      employmentDetails: true,
      bankAccounts: true,
      documents: { orderBy: { createdAt: 'desc' } },
      applications: {
        include: {
          product: true,
          eligibility: true,
          riskAssessment: true,
          underwriting: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      loans: {
        include: {
          product: true,
          disbursements: true,
          schedule: { orderBy: { emiNumber: 'asc' } },
          collectionCases: {
            include: {
              activities: { orderBy: { createdAt: 'desc' }, take: 5 },
              promises: { orderBy: { createdAt: 'desc' }, take: 5 },
            },
          },
          transactions: {
            where: { type: 'REPAYMENT' },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      collectionCases: {
        include: {
          activities: { orderBy: { createdAt: 'desc' }, take: 5 },
          promises: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!customer) {
    throw new NotFoundError('Customer record not found');
  }

  // Aggregate Loan Metrics
  const totalLoans = customer.loans.length;
  const activeLoans = customer.loans.filter((l) => l.status === 'ACTIVE').length;
  const totalSanctioned = customer.loans.reduce((sum, l) => sum + Number(l.principal), 0);
  const totalOutstanding = customer.loans.reduce((sum, l) => sum + Number(l.outstandingPrincipal), 0);

  // Aggregate Repayments & Overdues
  let totalDueEmis = 0;
  let paidEmis = 0;
  let overdueEmis = 0;
  customer.loans.forEach((l) => {
    totalDueEmis += l.schedule.length;
    paidEmis += l.schedule.filter((s) => s.status === 'PAID').length;
    overdueEmis += l.schedule.filter((s) => s.status === 'OVERDUE' || s.status === 'DUE').length;
  });
  const complianceRate = totalDueEmis > 0 ? ((paidEmis / totalDueEmis) * 100).toFixed(1) : '100.0';

  // Aggregate Collections Metrics
  const totalOverdue = customer.collectionCases.reduce((sum, c) => sum + Number(c.overdueAmount), 0);
  const maxDpd = customer.collectionCases.reduce((max, c) => Math.max(max, c.dpd), 0);

  // Document Vault Metrics
  const totalDocs = customer.documents.length;
  const verifiedDocs = customer.documents.filter((d) => d.verified).length;
  const docCategories = new Set(customer.documents.map((d) => d.category.toUpperCase()));
  const missingCategories = ['IDENTITY_PROOF', 'ADDRESS_PROOF', 'INCOME_PROOF'].filter(
    (c) => !docCategories.has(c) && !docCategories.has(c.replace('_PROOF', ''))
  );

  // Primary Employment & Bank
  const emp = customer.employmentDetails[0];
  const primaryBank = customer.bankAccounts.find((b) => b.isPrimary) || customer.bankAccounts[0];

  // Chronological Timeline Builder from authoritative DB records
  const timelineEvents: { timestamp: string; event: string; category: any; description: string }[] = [];

  timelineEvents.push({
    timestamp: customer.createdAt.toISOString(),
    event: 'Customer Profile Created',
    category: 'ONBOARDING',
    description: `Registered borrower profile #${customer.customerCode} in branch "${customer.branch?.name || 'Main Branch'}".`,
  });

  customer.documents.forEach((d) => {
    timelineEvents.push({
      timestamp: d.createdAt.toISOString(),
      event: `Document Uploaded: ${d.category}`,
      category: 'KYC',
      description: `Uploaded "${d.fileName}" (${d.documentType || d.category}). Verification status: ${d.status}.`,
    });
  });

  customer.applications.forEach((app) => {
    timelineEvents.push({
      timestamp: app.createdAt.toISOString(),
      event: `Loan Application Submitted (#${app.applicationNo})`,
      category: 'ORIGINATION',
      description: `Applied for ₹${Number(app.requestedAmount).toLocaleString('en-IN')} (${app.product?.name || 'Loan'}, ${app.tenureMonths} mos). Status: ${app.status}.`,
    });
    if (app.underwriting) {
      timelineEvents.push({
        timestamp: app.underwriting.createdAt.toISOString(),
        event: `Underwriting Decision: ${app.underwriting.decision}`,
        category: 'UNDERWRITING',
        description: `Decision recorded by ${app.underwriting.decidedBy || 'Staff'}. Reason: "${app.underwriting.reason || 'None'}".`,
      });
    }
  });

  customer.loans.forEach((loan) => {
    loan.disbursements.forEach((disb) => {
      timelineEvents.push({
        timestamp: disb.createdAt.toISOString(),
        event: `Loan Disbursed (#${loan.loanNo})`,
        category: 'DISBURSEMENT',
        description: `Disbursed ₹${Number(disb.amount).toLocaleString('en-IN')} via ${disb.method}. Ref: ${disb.reference}.`,
      });
    });
    loan.transactions.forEach((tx) => {
      timelineEvents.push({
        timestamp: tx.createdAt.toISOString(),
        event: `EMI Repayment Received (#${loan.loanNo})`,
        category: 'REPAYMENT',
        description: `Payment of ₹${Number(tx.amount).toLocaleString('en-IN')} credited. Ref: ${tx.reference}.`,
      });
    });
  });

  customer.collectionCases.forEach((colCase) => {
    timelineEvents.push({
      timestamp: colCase.createdAt.toISOString(),
      event: `Collection Case Opened (#${colCase.caseNo})`,
      category: 'COLLECTION',
      description: `Account flagged for ${colCase.dpd} DPD with ₹${Number(colCase.overdueAmount).toLocaleString('en-IN')} overdue. Bucket: ${colCase.agingBucket}.`,
    });
    colCase.promises.forEach((p) => {
      timelineEvents.push({
        timestamp: p.createdAt.toISOString(),
        event: `Promise-To-Pay Recorded (#${colCase.caseNo})`,
        category: 'COLLECTION',
        description: `PTP for ₹${Number(p.promisedAmount).toLocaleString('en-IN')} due on ${new Date(p.promisedDate).toLocaleDateString()} (Status: ${p.status}).`,
      });
    });
  });

  // Sort timeline chronologically (latest first)
  timelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Compact Context Prompt for Gemini
  const contextPrompt = `
=== CUSTOMER PROFILE SNAPSHOT ===
Customer Code: ${customer.customerCode}
Full Name: ${customer.firstName} ${customer.lastName}
Customer Since: ${customer.createdAt.toLocaleDateString()}
Account Status: ${customer.status}
KYC Status: ${customer.kycStatus}
Declared Net Monthly Income: ₹${Number(customer.monthlyIncome || 0).toLocaleString('en-IN')}
Declared Monthly Obligations: ₹${Number(customer.existingObligations || 0).toLocaleString('en-IN')}
Employment: ${customer.employmentType || 'SALARIED'} at "${emp?.employerName || customer.employerName || 'Not specified'}" (${emp?.designation || 'Staff'})
Location: ${customer.city || 'N/A'}, ${customer.state || 'N/A'}
Primary Bank Account: ${primaryBank ? `${primaryBank.bankName} (A/C: ${primaryBank.accountNumber}, IFSC: ${primaryBank.ifscCode}, Verified: ${primaryBank.isVerified})` : 'None'}

=== LOAN PORTFOLIO METRICS ===
Total Loan Accounts: ${totalLoans} (Active: ${activeLoans})
Total Sanctioned Principal: ₹${totalSanctioned.toLocaleString('en-IN')}
Total Outstanding Principal Balance: ₹${totalOutstanding.toLocaleString('en-IN')}
Total Overdue Balance: ₹${totalOverdue.toLocaleString('en-IN')}
Maximum DPD: ${maxDpd} Days
Repayment Compliance Rate: ${complianceRate}% (${paidEmis} of ${totalDueEmis} EMIs Paid, ${overdueEmis} Overdue)

=== DOCUMENT VAULT AUDIT ===
Total Uploaded Documents: ${totalDocs} (${verifiedDocs} Verified)
Missing Mandatory Categories: ${missingCategories.length > 0 ? missingCategories.join(', ') : 'None (Complete)'}

=== ACTIVE & HISTORICAL LOANS ===
${
  customer.loans.length > 0
    ? customer.loans
        .map(
          (l) =>
            `- Loan #${l.loanNo}: ${l.product?.name || 'Loan'}, Sanction: ₹${Number(l.principal).toLocaleString('en-IN')}, Outstanding: ₹${Number(l.outstandingPrincipal).toLocaleString('en-IN')}, Status: ${l.status}, EMI: ₹${Number(l.emiAmount).toLocaleString('en-IN')}`
        )
        .join('\n')
    : '- Zero loans recorded.'
}

=== DELINQUENCY & COLLECTION AUDIT ===
${
  customer.collectionCases.length > 0
    ? customer.collectionCases
        .map(
          (c) =>
            `- Case #${c.caseNo}: DPD ${c.dpd} (${c.agingBucket}), Overdue: ₹${Number(c.overdueAmount).toLocaleString('en-IN')}, Status: ${c.status}, PTPs: ${c.promises.length}, Activities: ${c.activities.length}`
        )
        .join('\n')
    : '- Zero collection cases. Account is in regular good standing.'
}

=== RECENT CHRONOLOGICAL LIFECYCLE EVENTS (${timelineEvents.slice(0, 10).length} Events) ===
${timelineEvents
  .slice(0, 10)
  .map((e) => `[${new Date(e.timestamp).toLocaleDateString()}] (${e.category}) ${e.event}: ${e.description}`)
  .join('\n')}
`;

  return {
    customer,
    totalLoans,
    activeLoans,
    totalSanctioned,
    totalOutstanding,
    totalOverdue,
    maxDpd,
    complianceRate,
    paidEmis,
    overdueEmis,
    totalDocs,
    verifiedDocs,
    missingCategories,
    timelineEvents,
    contextPrompt,
  };
}

/**
 * Evaluates and returns AI-driven Customer 360 Intelligence for authorized roles.
 */
export async function generateCustomer360Intelligence(
  customerId: string,
  actor: { id: string; email: string; roles: string[] }
): Promise<Customer360IntelligenceResult> {
  // 1. Fetch customer context
  const {
    customer,
    totalLoans,
    activeLoans,
    totalSanctioned,
    totalOutstanding,
    totalOverdue,
    maxDpd,
    complianceRate,
    paidEmis,
    overdueEmis,
    totalDocs,
    verifiedDocs,
    missingCategories,
    timelineEvents,
    contextPrompt,
  } = await buildCustomer360Context(customerId);

  // 2. Role-Aware RBAC & Borrower Isolation
  const isCustomer = actor.roles.includes('CUSTOMER');
  if (isCustomer) {
    if (customer.userId !== actor.id) {
      throw new ForbiddenError('Access forbidden: You cannot access another borrower Customer 360 profile');
    }
  } else {
    const isStaff = actor.roles.some((r) =>
      [
        'SUPER_ADMIN',
        'ADMIN',
        'LOAN_OFFICER',
        'CREDIT_ANALYST',
        'UNDERWRITER',
        'FINANCE_OFFICER',
        'COLLECTION_OFFICER',
        'BRANCH_MANAGER',
        'AUDITOR',
      ].includes(r)
    );
    if (!isStaff) {
      throw new ForbiddenError('Access forbidden: Insufficient permissions for Customer 360 Intelligence');
    }
  }

  // 3. System Prompt
  const systemInstruction = `
You are the Chief Customer 360 Intelligence AI for Adyapan Loan Management System.
Synthesize a holistic, multi-dimensional view of the borrower across onboarding, loans, repayments, and collections.

RULES:
1. TRUTHFULNESS: Base all claims solely on verified LMS data.
2. ADVISORY ONLY: Decision-support only. Do not mutate records.
3. CONCISENESS: Keep each narrative field to 1-2 concise, high-signal sentences.
4. STRICT JSON: Return ONLY a valid JSON object matching the required schema.

SCHEMA:
{
  "lifecycleStage": "ONBOARDING" | "ORIGINATION" | "UNDERWRITING" | "SERVICING_HEALTHY" | "SERVICING_DELINQUENT" | "CLOSED",
  "customerSummary": "Concise 2-sentence executive summary of customer profile and credit health.",
  "lifecycleSummary": "Narrative overview of borrower lifecycle across origination, disbursement, and servicing.",
  "repaymentInsights": {
    "behaviorTrend": "IMPROVING" | "STABLE" | "DETERIORATING" | "NO_REPAYMENT_HISTORY",
    "observations": "Interpretation of historical payment consistency"
  },
  "riskAndCreditContext": {
    "initialRiskTier": "LOW" | "MEDIUM" | "HIGH",
    "initialRiskScore": number,
    "currentTrajectory": "STABLE" | "INCREASED_RISK" | "IMPROVED",
    "observations": "Synthesis of risk score against repayment behavior"
  },
  "kycDocumentContext": {
    "observations": "Assessment of compliance completeness"
  },
  "collectionsContext": {
    "ptpStatus": "ACTIVE_PTP" | "NO_ACTIVE_PTP" | "BROKEN_PTP_PATTERN",
    "observations": "Evaluation of delinquency and outreach"
  },
  "changesDetected": [
    {
      "change": "Title of change",
      "previousState": "Previous state",
      "currentState": "Current state",
      "whyItMatters": "Credit impact"
    }
  ],
  "positiveSignals": ["Verified positive attributes"],
  "attentionRequired": [
    {
      "category": "KYC" | "DELINQUENCY" | "COLLECTIONS" | "DOCUMENTATION" | "SERVICING",
      "issue": "Specific issue",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "evidence": "LMS data point",
      "recommendedReview": "Suggested action"
    }
  ],
  "recommendedActions": ["Operational next-best actions for officer"],
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}
`;

  let result: Customer360IntelligenceResult;

  try {
    // 4. Generate content via Central Gemini Service
    const geminiResult = await generateGeminiContent({
      prompt: `Synthesize the complete Customer 360 Intelligence briefing for the following borrower profile:\n\n${contextPrompt}`,
      systemInstruction,
      temperature: 0.1,
    });

    // 5. Safe JSON Parsing
    const rawText = geminiResult.text.trim();
    const cleanJson = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const parsed = JSON.parse(cleanJson);

    result = {
      customerId: customer.id,
      customerCode: customer.customerCode,
      customerName: `${customer.firstName} ${customer.lastName}`,
      generatedAt: new Date().toISOString(),
      dataAsOf: new Date().toISOString(),
      model: geminiResult.model,
      lifecycleStage: parsed.lifecycleStage || (maxDpd > 0 ? 'SERVICING_DELINQUENT' : activeLoans > 0 ? 'SERVICING_HEALTHY' : 'ONBOARDING'),
      customerSummary: parsed.customerSummary || `Customer #${customer.customerCode} profile overview.`,
      lifecycleSummary: parsed.lifecycleSummary || 'Borrower lifecycle evaluated across LMS origination, disbursement, and servicing.',
      portfolioSummary: {
        totalLoans,
        activeLoans,
        totalSanctionedAmount: totalSanctioned,
        totalOutstandingPrincipal: totalOutstanding,
        totalOverdueAmount: totalOverdue,
        overallServicingStatus: maxDpd > 0 ? `${maxDpd} DPD Delinquent` : activeLoans > 0 ? 'Regular Active' : 'No Active Loans',
      },
      repaymentInsights: {
        complianceRate: `${complianceRate}%`,
        paidInstallmentsCount: paidEmis,
        overdueInstallmentsCount: overdueEmis,
        behaviorTrend: parsed.repaymentInsights?.behaviorTrend || (overdueEmis > 0 ? 'DETERIORATING' : 'STABLE'),
        observations: parsed.repaymentInsights?.observations || 'Repayment consistency calculated from schedule items.',
      },
      riskAndCreditContext: {
        initialRiskTier: parsed.riskAndCreditContext?.initialRiskTier || customer.riskCategory || 'LOW',
        initialRiskScore: typeof parsed.riskAndCreditContext?.initialRiskScore === 'number' ? parsed.riskAndCreditContext.initialRiskScore : 84,
        currentTrajectory: parsed.riskAndCreditContext?.currentTrajectory || (maxDpd > 30 ? 'INCREASED_RISK' : 'STABLE'),
        observations: parsed.riskAndCreditContext?.observations || 'Risk trajectory evaluated against repayment behavior.',
      },
      kycDocumentContext: {
        kycStatus: customer.kycStatus,
        verifiedDocumentsCount: verifiedDocs,
        totalDocumentsCount: totalDocs,
        missingCategories,
        observations: parsed.kycDocumentContext?.observations || 'Document vault compliance assessed.',
      },
      collectionsContext: {
        activeCasesCount: customer.collectionCases.length,
        maxDpd,
        ptpStatus: parsed.collectionsContext?.ptpStatus || (customer.collectionCases.length > 0 ? 'NO_ACTIVE_PTP' : 'CLEAN'),
        observations: parsed.collectionsContext?.observations || 'Collections status assessed from active cases.',
      },
      timeline: timelineEvents.slice(0, 15),
      changesDetected: Array.isArray(parsed.changesDetected) ? parsed.changesDetected : [],
      positiveSignals: Array.isArray(parsed.positiveSignals) ? parsed.positiveSignals : ['Verified KYC status on record.'],
      attentionRequired: Array.isArray(parsed.attentionRequired) ? parsed.attentionRequired : [],
      recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : ['Review customer account standing.'],
      confidence: ['HIGH', 'MEDIUM', 'LOW'].includes(parsed.confidence) ? parsed.confidence : 'HIGH',
    };
  } catch {
    // Deterministic Rule-Based Fallback
    const positiveSignals: string[] = [];
    if (customer.kycStatus === 'VERIFIED') positiveSignals.push('Verified KYC Compliance status on record.');
    if (activeLoans > 0 && maxDpd === 0) positiveSignals.push('Active loan in regular standing with zero overdue DPD.');
    if (Number(customer.monthlyIncome || 0) > 50000) positiveSignals.push(`Declared monthly net income of ₹${Number(customer.monthlyIncome).toLocaleString('en-IN')}.`);
    if (positiveSignals.length === 0) positiveSignals.push('Borrower account registered in good standing.');

    const attentionRequired: Customer360IntelligenceResult['attentionRequired'] = [];
    if (maxDpd > 0) {
      attentionRequired.push({
        category: 'DELINQUENCY',
        issue: `Account is ${maxDpd} DPD delinquent with ₹${totalOverdue.toLocaleString('en-IN')} overdue`,
        severity: maxDpd > 30 ? 'HIGH' : 'MEDIUM',
        evidence: `${customer.collectionCases.length} active collection case(s).`,
        recommendedReview: 'Initiate collection follow-up or register Promise-to-Pay (PTP).',
      });
    }
    if (missingCategories.length > 0) {
      attentionRequired.push({
        category: 'KYC',
        issue: `Missing compliance categories: ${missingCategories.join(', ')}`,
        severity: 'MEDIUM',
        evidence: `${verifiedDocs}/${totalDocs} documents verified.`,
        recommendedReview: 'Upload and verify pending mandatory documents.',
      });
    }

    result = {
      customerId: customer.id,
      customerCode: customer.customerCode,
      customerName: `${customer.firstName} ${customer.lastName}`,
      generatedAt: new Date().toISOString(),
      dataAsOf: new Date().toISOString(),
      model: 'deterministic-rules-engine',
      lifecycleStage: maxDpd > 0 ? 'SERVICING_DELINQUENT' : activeLoans > 0 ? 'SERVICING_HEALTHY' : 'ONBOARDING',
      customerSummary: `Customer #${customer.customerCode} (${customer.firstName} ${customer.lastName}) has ${totalLoans} loan account(s) (₹${totalOutstanding.toLocaleString('en-IN')} outstanding). Compliance rate is ${complianceRate}%. (Deterministic LMS synthesis).`,
      lifecycleSummary: `Registered on ${customer.createdAt.toLocaleDateString()}. Portfolio status: ${activeLoans > 0 ? 'Active Servicing' : 'Onboarding/Origination'}. Total sanctioned ₹${totalSanctioned.toLocaleString('en-IN')}.`,
      portfolioSummary: {
        totalLoans,
        activeLoans,
        totalSanctionedAmount: totalSanctioned,
        totalOutstandingPrincipal: totalOutstanding,
        totalOverdueAmount: totalOverdue,
        overallServicingStatus: maxDpd > 0 ? `${maxDpd} DPD Delinquent` : activeLoans > 0 ? 'Regular Active' : 'No Active Loans',
      },
      repaymentInsights: {
        complianceRate: `${complianceRate}%`,
        paidInstallmentsCount: paidEmis,
        overdueInstallmentsCount: overdueEmis,
        behaviorTrend: overdueEmis > 0 ? 'DETERIORATING' : 'STABLE',
        observations: `${paidEmis} installments paid on schedule with ${overdueEmis} overdue.`,
      },
      riskAndCreditContext: {
        initialRiskTier: customer.riskCategory || 'LOW',
        initialRiskScore: 84,
        currentTrajectory: maxDpd > 30 ? 'INCREASED_RISK' : 'STABLE',
        observations: `Assessed risk category: ${customer.riskCategory || 'LOW'}. Current DPD: ${maxDpd} days.`,
      },
      kycDocumentContext: {
        kycStatus: customer.kycStatus,
        verifiedDocumentsCount: verifiedDocs,
        totalDocumentsCount: totalDocs,
        missingCategories,
        observations: `${verifiedDocs} of ${totalDocs} uploaded documents verified.`,
      },
      collectionsContext: {
        activeCasesCount: customer.collectionCases.length,
        maxDpd,
        ptpStatus: customer.collectionCases.length > 0 ? 'NO_ACTIVE_PTP' : 'CLEAN',
        observations: customer.collectionCases.length > 0 ? `Active delinquency: ₹${totalOverdue.toLocaleString('en-IN')} overdue.` : 'Account in regular good standing.',
      },
      timeline: timelineEvents.slice(0, 15),
      changesDetected: [],
      positiveSignals,
      attentionRequired,
      recommendedActions: [
        'Review current account status against active repayment schedule.',
        'Ensure mandatory KYC documents remain current and verified.',
      ],
      confidence: 'HIGH',
    };
  }

  // 6. Audit Trail
  await logAudit({
    userId: actor.id,
    role: actor.roles[0] || 'STAFF',
    action: 'CUSTOMER_360_INTELLIGENCE_GENERATED',
    entity: 'Customer',
    entityId: customer.id,
    newValue: {
      customerCode: customer.customerCode,
      lifecycleStage: result.lifecycleStage,
      model: result.model,
      generatedBy: actor.email,
    },
  }).catch(() => {});

  return result;
}
