import { prisma } from '../../config/prisma';
import { generateGeminiContent } from './gemini.service';

export type RoleName =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'LOAN_OFFICER'
  | 'CREDIT_ANALYST'
  | 'UNDERWRITER'
  | 'FINANCE_OFFICER'
  | 'COLLECTION_OFFICER'
  | 'BRANCH_MANAGER'
  | 'AUDITOR'
  | 'CUSTOMER';

export interface CopilotMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CopilotChatOptions {
  userId: string;
  userEmail: string;
  roles: string[];
  tenantId?: string;
  branchId?: string;
  message: string;
  history?: CopilotMessage[];
  currentPath?: string;
}

export interface CopilotChatResponse {
  answer: string;
  model: string;
  contextSummary?: string;
}

/**
 * Builds authorized, live database-synced LMS context for the LLM based on user question, role, and real records.
 */
export async function buildAuthorizedContext(
  userOrParams: any,
  query: string = '',
  _currentPath?: string
): Promise<{ contextText: string; summary: string; actorRole?: string }> {
  const user = {
    id: userOrParams.id || userOrParams.userId || '',
    email: userOrParams.email || userOrParams.userEmail || '',
    roles: userOrParams.roles || ['CUSTOMER'],
    tenantId: userOrParams.tenantId,
    branchId: userOrParams.branchId,
  };
  const isCustomer = user.roles.includes('CUSTOMER');
  const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
  const primaryRole = (user.roles[0] || 'CUSTOMER') as RoleName;

  let effectiveTenantId = user.tenantId;
  let effectiveBranchId = user.branchId;

  if ((!effectiveTenantId || !effectiveBranchId) && user.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { tenantId: true, branchId: true },
    }).catch(() => null);
    if (dbUser) {
      if (!effectiveTenantId && dbUser.tenantId) effectiveTenantId = dbUser.tenantId;
      if (!effectiveBranchId && dbUser.branchId) effectiveBranchId = dbUser.branchId;
    }
  }

  const isBranchScoped =
    user.roles.includes('LOAN_OFFICER') ||
    user.roles.includes('BRANCH_MANAGER') ||
    user.roles.includes('COLLECTION_OFFICER') ||
    user.roles.includes('COLLECTION_AGENT');

  const staffTenantFilter = effectiveTenantId && !isSuperAdmin ? { tenantId: effectiveTenantId } : {};
  const staffBranchFilter =
    effectiveBranchId && isBranchScoped && user.roles.includes('BRANCH_MANAGER')
      ? { OR: [{ branchId: effectiveBranchId }, { branchId: null }] }
      : {};

  const safeQuery = query || userOrParams.message || userOrParams.query || '';
  const contextBlocks: string[] = [];
  let summary = '';

  // 1. Identify specific entity references in the prompt (e.g. LN-1234, CUST-1234, APP-1234)
  const loanNoMatch = safeQuery.match(/LN-?[0-9]+/i);
  const custCodeMatch = safeQuery.match(/CUST-?[0-9]+/i);
  const appNoMatch = safeQuery.match(/APP-?[0-9]+/i);

  // --- Specific Loan Lookup ---
  if (loanNoMatch) {
    const searchNo = loanNoMatch[0].toUpperCase();
    const loanWhere: any = {
      OR: [
        { loanNo: { contains: searchNo, mode: 'insensitive' } },
        { loanNo: searchNo },
      ],
    };
    if (isCustomer) {
      loanWhere.customer = { userId: user.id };
    } else {
      if (effectiveTenantId && !isSuperAdmin) {
        loanWhere.tenantId = effectiveTenantId;
      }
      if (effectiveBranchId && isBranchScoped) {
        loanWhere.branchId = effectiveBranchId;
      }
    }

    const loan = await prisma.loan.findFirst({
      where: loanWhere,
      include: {
        customer: true,
        product: true,
        schedule: {
          where: { status: { not: 'PAID' } },
          orderBy: { emiNumber: 'asc' },
          take: 3,
        },
        collectionCases: { take: 1 },
        disbursements: { take: 1, orderBy: { createdAt: 'desc' } },
        application: {
          include: {
            eligibility: true,
            riskAssessment: true,
            underwriting: true,
          },
        },
      },
    });

    if (loan) {
      const unpaidEmi = loan.schedule[0];
      const riskPillars = loan.application?.riskAssessment?.factors as any[];
      const riskText = Array.isArray(riskPillars)
        ? riskPillars.map((p) => `${p.name}: ${p.score}/100 (${p.remarks || ''})`).join('; ')
        : 'N/A';

      contextBlocks.push(`
=== SPECIFIC LOAN RECORD (#${loan.loanNo}) ===
- Borrower Name: ${loan.customer.firstName} ${loan.customer.lastName} (Customer Code: ${loan.customer.customerCode})
- Product: ${loan.product.name} (Interest Rate: ${loan.interestRate}% p.a.)
- Principal Amount: ₹${Number(loan.principal).toLocaleString('en-IN')}
- Outstanding Principal: ₹${Number(loan.outstandingPrincipal).toLocaleString('en-IN')}
- Monthly EMI: ₹${Number(loan.emiAmount).toLocaleString('en-IN')}
- Status: ${loan.status}
- Next Due Date: ${loan.nextDueDate ? new Date(loan.nextDueDate).toLocaleDateString() : 'None (Closed/Paid)'}
- Next Installment Total Due: ${unpaidEmi ? `₹${Number(unpaidEmi.totalDue).toLocaleString('en-IN')} (EMI #${unpaidEmi.emiNumber})` : 'Fully Paid'}
- Risk Category: ${loan.customer.riskCategory || 'LOW'} (Risk Score: ${loan.application?.riskAssessment?.score || 'N/A'}/100)
- Risk Pillar Breakdown: ${riskText}
- Underwriting Decision: ${loan.application?.underwriting?.decision || 'APPROVED'} (Reason: ${loan.application?.underwriting?.reason || 'Standard'})
- Delinquency Case: ${loan.collectionCases.length > 0 ? `DPD: ${loan.collectionCases[0].dpd} days, Overdue: ₹${loan.collectionCases[0].overdueAmount}, Bucket: ${loan.collectionCases[0].agingBucket}` : 'Zero overdue cases'}
      `);
      summary = `Retrieved details for Loan #${loan.loanNo}`;
    }
  }

  // --- Specific Application Lookup ---
  if (appNoMatch) {
    const searchApp = appNoMatch[0].toUpperCase();
    const appWhere: any = {
      OR: [
        { applicationNo: { contains: searchApp, mode: 'insensitive' } },
        { applicationNo: searchApp },
      ],
    };
    if (isCustomer) {
      appWhere.customer = { userId: user.id };
    } else {
      if (effectiveTenantId && !isSuperAdmin) {
        appWhere.tenantId = effectiveTenantId;
      }
      if (effectiveBranchId && isBranchScoped) {
        appWhere.branchId = effectiveBranchId;
      }
    }

    const app = await prisma.loanApplication.findFirst({
      where: appWhere,
      include: {
        customer: true,
        product: true,
        eligibility: true,
        riskAssessment: true,
        underwriting: true,
      },
    });

    if (app) {
      contextBlocks.push(`
=== SPECIFIC LOAN APPLICATION (#${app.applicationNo}) ===
- Applicant: ${app.customer.firstName} ${app.customer.lastName} (${app.customer.customerCode})
- Product: ${app.product.name}
- Requested Amount: ₹${Number(app.requestedAmount).toLocaleString('en-IN')}
- Tenure: ${app.tenureMonths} months
- Status: ${app.status}
- Monthly Income: ₹${Number(app.customer.monthlyIncome || 0).toLocaleString('en-IN')}
- KYC Status: ${app.customer.kycStatus}
- Eligibility Result: ${app.eligibility?.result || 'PENDING'}
- Risk Score: ${app.riskAssessment ? `${app.riskAssessment.score}/100 (${app.riskAssessment.category})` : 'PENDING'}
- Underwriting Decision: ${app.underwriting?.decision || 'PENDING'} (Remarks: ${app.underwriting?.reason || 'None'})
      `);
      summary = `Retrieved application #${app.applicationNo}`;
    }
  }

  // --- Specific Customer or Keyword Name Lookup ---
  if (!isCustomer) {
    const candidateKeywords = safeQuery
      .split(/[\s,?.!]+/)
      .filter((w: string) => w.length >= 3 && !['what', 'show', 'list', 'status', 'loan', 'user', 'this', 'that', 'from', 'with', 'kaise', 'batao', 'dikhao', 'karein', 'kya'].includes(w.toLowerCase()));

    if (candidateKeywords.length > 0 || custCodeMatch) {
      const orClauses: any[] = [];
      if (custCodeMatch) {
        orClauses.push({ customerCode: { contains: custCodeMatch[0], mode: 'insensitive' } });
      }
      for (const kw of candidateKeywords) {
        orClauses.push(
          { firstName: { contains: kw, mode: 'insensitive' } },
          { lastName: { contains: kw, mode: 'insensitive' } },
          { email: { contains: kw, mode: 'insensitive' } },
          { mobile: { contains: kw } },
          { customerCode: { contains: kw, mode: 'insensitive' } }
        );
      }

      const matchedCustomers = await prisma.customer.findMany({
        where: {
          OR: orClauses,
          ...staffTenantFilter,
          ...staffBranchFilter,
        },
        include: {
          loans: { include: { product: true } },
          applications: { include: { product: true, underwriting: true, riskAssessment: true } },
        },
        take: 3,
      });

      for (const customer of matchedCustomers) {
        contextBlocks.push(`
=== MATCHED CUSTOMER RECORD (#${customer.customerCode}) ===
- Name: ${customer.firstName} ${customer.lastName}
- Email: ${customer.email || 'N/A'}, Mobile: ${customer.mobile}
- KYC Status: ${customer.kycStatus}, Risk Category: ${customer.riskCategory || 'LOW'}
- Monthly Income: ₹${Number(customer.monthlyIncome || 0).toLocaleString('en-IN')}
- Applications (${customer.applications.length}): ${
          customer.applications.length > 0
            ? customer.applications
                .map(
                  (a) =>
                    `#${a.applicationNo} (₹${Number(a.requestedAmount).toLocaleString('en-IN')}, Status: ${a.status}, Decision: ${
                      a.underwriting?.decision || 'PENDING'
                    })`
                )
                .join('; ')
            : 'None'
        }
- Loans (${customer.loans.length}): ${
          customer.loans.length > 0
            ? customer.loans
                .map(
                  (l) =>
                    `#${l.loanNo} (${l.product.name}, Principal: ₹${Number(l.principal).toLocaleString(
                      'en-IN'
                    )}, Outstanding: ₹${Number(l.outstandingPrincipal).toLocaleString('en-IN')}, Status: ${l.status})`
                )
                .join('; ')
            : 'None'
        }
        `);
        if (!summary) summary = `Retrieved profile for ${customer.firstName} ${customer.lastName}`;
      }
    }
  }

  // --- Role-Based Action Items & Live Database Sync ---
  if (isCustomer && user.id) {
    // Borrower sees ONLY their own active loan & payment status
    const customerRecord = await prisma.customer.findUnique({
      where: { userId: user.id },
      include: {
        loans: {
          include: {
            product: true,
            schedule: { where: { status: { not: 'PAID' } }, orderBy: { emiNumber: 'asc' }, take: 1 },
          },
        },
        paymentSubmissions: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
    }).catch(() => null);

    if (customerRecord) {
      const activeLoan = customerRecord.loans.find((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE');
      contextBlocks.push(`
=== BORROWER ACCOUNT OVERVIEW ===
- Customer: ${customerRecord.firstName} ${customerRecord.lastName} (${customerRecord.customerCode})
- KYC Status: ${customerRecord.kycStatus}
${
  activeLoan
    ? `- Active Loan Account: #${activeLoan.loanNo} (${activeLoan.product.name})
- Sanction Principal: ₹${Number(activeLoan.principal).toLocaleString('en-IN')}
- Outstanding Principal Balance: ₹${Number(activeLoan.outstandingPrincipal).toLocaleString('en-IN')}
- Monthly EMI: ₹${Number(activeLoan.emiAmount).toLocaleString('en-IN')}
- Next Due Date: ${activeLoan.nextDueDate ? new Date(activeLoan.nextDueDate).toLocaleDateString() : 'N/A'}
- Loan Status: ${activeLoan.status}`
    : '- Active Loans: None'
}
- Recent Payment Submissions: ${
        customerRecord.paymentSubmissions.length > 0
          ? customerRecord.paymentSubmissions
              .map(
                (p) =>
                  `#${p.submissionNo} (₹${p.amount} via ${p.method}, Ref: ${p.reference}, Status: ${p.status})`
              )
              .join('; ')
          : 'None'
      }
      `);
    }
  } else {
    // Staff & Admin Roles: ALWAYS inject real-time live database state so Copilot is 100% accurate with DB!
    try {
      const [allCustomers, allActiveLoans, allApplications, readyForDisbursement, pendingSubmissions, collectionCases] =
        await Promise.all([
          // 1. Live Customers in Database
          prisma.customer.findMany({
            where: { ...staffTenantFilter, ...staffBranchFilter },
            select: {
              id: true,
              customerCode: true,
              firstName: true,
              lastName: true,
              email: true,
              mobile: true,
              kycStatus: true,
              riskCategory: true,
            },
            take: 10,
            orderBy: { createdAt: 'desc' },
          }).catch(() => []),

          // 2. Live Loans in Database
          prisma.loan.findMany({
            where: { ...staffTenantFilter, ...staffBranchFilter },
            include: { customer: true, product: true },
            take: 10,
            orderBy: { updatedAt: 'desc' },
          }).catch(() => []),

          // 3. Live Applications in Database
          prisma.loanApplication.findMany({
            where: { ...staffTenantFilter, ...staffBranchFilter },
            include: { customer: true, product: true, underwriting: true, riskAssessment: true },
            take: 10,
            orderBy: { createdAt: 'desc' },
          }).catch(() => []),

          // 4. Ready for Disbursement Payout
          prisma.loanApplication.findMany({
            where: {
              status: { in: ['APPROVED', 'READY_FOR_DISBURSEMENT'] },
              ...staffTenantFilter,
              ...staffBranchFilter,
            },
            include: { customer: true, product: true },
            take: 5,
          }).catch(() => []),

          // 5. Unsettled Payment Submissions (relational customer tenant filter)
          prisma.paymentSubmission.findMany({
            where: {
              status: 'PENDING_VERIFICATION',
              ...(effectiveTenantId && !isSuperAdmin ? { customer: { tenantId: effectiveTenantId } } : {}),
            },
            include: { customer: true, loan: true },
            take: 5,
          }).catch(() => []),

          // 6. Delinquency Cases (relational customer tenant filter)
          prisma.collectionCase.findMany({
            where: {
              status: { in: ['OPEN', 'IN_PROGRESS', 'PROMISED'] },
              ...(effectiveTenantId && !isSuperAdmin ? { customer: { tenantId: effectiveTenantId } } : {}),
            },
            include: { customer: true, loan: true },
            take: 5,
          }).catch(() => []),
        ]);

      contextBlocks.push(`
=== LIVE LMS DATABASE SYNCHRONIZATION ===
- Total Registered Customers in Scope: ${allCustomers.length}
${
  allCustomers.length > 0
    ? allCustomers
        .map(
          (c) =>
            `  * ${c.firstName} ${c.lastName} (Code: ${c.customerCode}, KYC: ${c.kycStatus}, Mobile: ${c.mobile}, Email: ${c.email || 'N/A'})`
        )
        .join('\n')
    : '  * No customers found.'
}

- Live Active Loans in Database: ${allActiveLoans.length}
${
  allActiveLoans.length > 0
    ? allActiveLoans
        .map(
          (l) =>
            `  * Loan #${l.loanNo} (${l.customer.firstName} ${l.customer.lastName}): Principal ₹${Number(
              l.principal
            ).toLocaleString('en-IN')}, Outstanding ₹${Number(l.outstandingPrincipal).toLocaleString(
              'en-IN'
            )}, Status: ${l.status}, EMI: ₹${Number(l.emiAmount).toLocaleString('en-IN')}`
        )
        .join('\n')
    : '  * No active loans currently recorded in database.'
}

- Live Loan Applications in Pipeline: ${allApplications.length}
${
  allApplications.length > 0
    ? allApplications
        .map(
          (a) =>
            `  * App #${a.applicationNo} (${a.customer.firstName} ${a.customer.lastName}): ₹${Number(
              a.requestedAmount
            ).toLocaleString('en-IN')} (${a.product.name}), Status: ${a.status}, Underwriting: ${
              a.underwriting?.decision || 'PENDING'
            }`
        )
        .join('\n')
    : '  * No loan applications in pipeline.'
}

- Pending Payout Disbursements Queue: ${readyForDisbursement.length}
${
  readyForDisbursement.length > 0
    ? readyForDisbursement
        .map((d) => `  * App #${d.applicationNo} for ${d.customer.firstName} ${d.customer.lastName}: ₹${Number(d.requestedAmount).toLocaleString('en-IN')}`)
        .join('\n')
    : '  * Zero applications waiting for disbursement release.'
}

- Pending Payment Proof Submissions: ${pendingSubmissions.length}
- Delinquent / Overdue Cases: ${collectionCases.length}
      `);

      if (!summary) {
        summary = `Live LMS database state synchronized (${primaryRole})`;
      }
    } catch (err: any) {
      console.warn('Live database synchronization partial issue:', err?.message || err);
    }
  }

  const contextText =
    contextBlocks.length > 0
      ? contextBlocks.join('\n\n')
      : 'No specific records matched the query directly in the LMS database.';

  return { contextText, summary: summary || 'General LMS consultation', actorRole: primaryRole };
}

/**
 * Returns dynamic, database-backed prompt suggestions tailored to live active records.
 */
export async function getDynamicCopilotSuggestions(actor: {
  id?: string;
  email?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
}): Promise<string[]> {
  const primaryRole = (actor.roles?.[0] || 'CUSTOMER') as RoleName;
  const isCustomer = primaryRole === 'CUSTOMER';
  const isSuperAdmin = primaryRole === 'SUPER_ADMIN';

  const tenantFilter = actor.tenantId && !isSuperAdmin ? { tenantId: actor.tenantId } : {};

  if (isCustomer && actor.id) {
    const cust = await prisma.customer.findUnique({
      where: { userId: actor.id },
      include: { loans: true },
    }).catch(() => null);

    const activeLoan = cust?.loans?.[0];
    if (activeLoan) {
      return [
        `What is the status of my loan #${activeLoan.loanNo}?`,
        'When is my next EMI payment due and what is the amount?',
        'How can I submit my EMI payment reference proof?',
        'Show my loan interest rate and repayment tenure',
      ];
    }
    return [
      'What is my active loan status and outstanding balance?',
      'When is my next EMI due and what is the amount?',
      'How can I apply for a new loan or submit KYC documents?',
    ];
  }

  // For staff: fetch real live loans, applications, and customers
  const [activeLoan, pendingApp, pendingKycCust] = await Promise.all([
    prisma.loan.findFirst({
      where: { ...tenantFilter },
      include: { customer: true },
      orderBy: { updatedAt: 'desc' },
    }).catch(() => null),

    prisma.loanApplication.findFirst({
      where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'CREDIT_ASSESSMENT', 'UNDERWRITING'] }, ...tenantFilter },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    }).catch(() => null),

    prisma.customer.findFirst({
      where: { kycStatus: { in: ['NOT_STARTED', 'PENDING', 'SUBMITTED', 'UNDER_REVIEW'] }, ...tenantFilter },
      orderBy: { createdAt: 'desc' },
    }).catch(() => null),
  ]);

  const suggestions: string[] = [];

  if (activeLoan) {
    suggestions.push(`What is the status of loan #${activeLoan.loanNo} (${activeLoan.customer.firstName} ${activeLoan.customer.lastName})?`);
  } else {
    suggestions.push('Which loan accounts are currently active in the database?');
  }

  if (pendingApp) {
    suggestions.push(`Check pipeline status of application #${pendingApp.applicationNo} (${pendingApp.customer.firstName} ${pendingApp.customer.lastName})`);
  } else {
    suggestions.push('Show pending underwriting and credit assessment proposals');
  }

  if (pendingKycCust) {
    suggestions.push(`What is the KYC status of customer ${pendingKycCust.firstName} ${pendingKycCust.lastName}?`);
  } else {
    suggestions.push('Which borrowers have pending KYC verification?');
  }

  if (primaryRole === 'FINANCE_OFFICER') {
    suggestions.push('Show applications ready for disbursement payout release');
  } else if (primaryRole === 'COLLECTION_OFFICER') {
    suggestions.push('Summarize current delinquency and overdue loans');
  } else if (primaryRole === 'CREDIT_ANALYST' || primaryRole === 'UNDERWRITER') {
    suggestions.push('Show risk score and FOIR evaluation for pending files');
  } else {
    suggestions.push('Give me an overview of all registered customers in the database');
  }

  return suggestions;
}

/**
 * Main Copilot Chat Handler.
 * Integrates role-aware context building, conversational memory, and centralized Gemini generation.
 */
export async function handleCopilotChat(options: CopilotChatOptions): Promise<CopilotChatResponse> {
  const { userId, userEmail, roles, message, history = [], currentPath } = options;

  const primaryRole = (roles[0] || 'CUSTOMER') as RoleName;

  // 1. Fetch authorized context from PostgreSQL
  const { contextText, summary } = await buildAuthorizedContext(
    { id: userId, email: userEmail, roles, tenantId: options.tenantId, branchId: options.branchId },
    message,
    currentPath
  );

  // 2. Build centralized system instructions
  const systemInstruction = `
You are the official Adyapan LMS AI Copilot, a smart, friendly, and professional banking & credit AI assistant.
You interact with users naturally, answering both casual conversation and detailed operational/financial inquiries based on the verified LMS Database Context provided below.

Current User: ${userEmail}
Current User Role: ${primaryRole}

=== BEHAVIOR & GUIDELINES ===
1. DUAL-MODE CONVERSATION (NORMAL CHAT & DETAILED INQUIRIES):
   - CASUAL & FRIENDLY TALK: When the user greets you (e.g. "hi kaise ho", "kya krr rhe ho tum", "hello", "aur batao"), respond naturally, warmly, and casually in the user's language (Hindi, Hinglish, or English). Tell them you are feeling great and helping out with loan operations, applications, and customer queries on Adyapan LMS, and ask what they would like to work on today.
   - DETAILED & PRECISE DATA: When the user asks for specific loan accounts, customer profiles, outstanding balances, KYC status, pipeline applications, or collections, provide accurate, clean, structured facts (with bullet points and amounts) based on the Verified LMS Database Context below.
2. TRUTHFULNESS & ACCURACY: Never invent fake numbers, dates, or borrower accounts. If specific customer/loan details are requested but not found in the LMS Context, politely explain that no matching record exists in the system.
3. ROLE RESPECT: Always support the user according to their ${primaryRole} role:
   - LOAN_OFFICER: Customer intake, missing KYC documents, application tracking.
   - CREDIT_ANALYST: Debt capacity, FOIR/DTI calculations, policy rules.
   - UNDERWRITER: Sanction proposals, risk factors, approval limits.
   - BRANCH_MANAGER: Branch portfolio overview, operational supervision.
   - FINANCE_OFFICER: Disbursement payout queue, payment proofs verification.
   - COLLECTION_OFFICER: DPD aging, delinquent accounts, PTP tracking.
   - CUSTOMER: Personal loan status, EMI due date, repayment submission.
4. ADVISORY ONLY: You are an informational assistant; direct the user to their respective buttons/pages for mutations.
5. FORMATTING: Use clean markdown, bold headers, and concise bullet points. Avoid repeating instructions or raw code.

=== VERIFIED LMS DATABASE CONTEXT ===
${contextText}
`;

  // 3. Format bounded conversation history (last 4 turns = 8 messages max)
  const boundedHistory = history.slice(-6);
  const conversationLines: string[] = [];

  for (const h of boundedHistory) {
    const speaker = h.role === 'user' ? 'User' : 'Copilot';
    conversationLines.push(`${speaker}: ${h.content}`);
  }

  conversationLines.push(`User: ${message}`);
  conversationLines.push(`Copilot:`);

  const fullPrompt = conversationLines.join('\n\n');

  // 4. Execute via Central Gemini Service
  const response = await generateGeminiContent({
    prompt: fullPrompt,
    systemInstruction,
    temperature: 0.3,
  });

  return {
    answer: response.text.trim(),
    model: response.model,
    contextSummary: summary,
  };
}
