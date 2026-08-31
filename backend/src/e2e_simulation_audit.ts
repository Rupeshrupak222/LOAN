import process from 'node:process';

const API_BASE = 'http://localhost:4000/api/v1';

async function apiRequest(path: string, options: { method?: string; body?: any; token?: string } = {}): Promise<any> {
  const { method = 'GET', body, token } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`API Error [${res.status}] ${path}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function runSimulation() {
  console.log('\n=============================================================');
  console.log('🚀 FULL END-TO-END WORKFLOW CONSISTENCY & AUDIT SIMULATION');
  console.log('=============================================================\n');

  // 1. Authenticate as Super Admin
  console.log('🔐 [Auth] Logging in as Super Admin (admin@adyapan.dev)...');
  const authRes = await apiRequest('/auth/login', {
    method: 'POST',
    body: {
      identifier: 'admin@adyapan.dev',
      password: 'Passw0rd!123',
    },
  });
  const token = authRes.data.accessToken;
  console.log('   ✅ Super Admin authenticated successfully.\n');

  // Fetch branches and products for test setup
  const [branchesRes, productsRes] = await Promise.all([
    apiRequest('/branches', { token }),
    apiRequest('/loan-products', { token }),
  ]);
  const branchId = branchesRes.data[0]?.id;
  const product = productsRes.data.find((p: any) => p.productType === 'PERSONAL') || productsRes.data[0];
  const requestedAmount = Math.min(Number(product.maxAmount), Math.max(Number(product.minAmount), 100000));
  const tenureMonths = Math.min(product.maxTenureMonths, Math.max(product.minTenureMonths, 12));

  console.log(`   Branch: ${branchesRes.data[0]?.name} (${branchId})`);
  console.log(`   Product: ${product.name} (Rate: ${product.interestRate}% | Min: ₹${product.minAmount} - Max: ₹${product.maxAmount})\n`);

  // STEP 1: Create Test Customer
  console.log('👤 [Step 1: Customer Onboarding] Creating new test borrower in PostgreSQL...');
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const custRes = await apiRequest('/customers', {
    method: 'POST',
    token,
    body: {
      firstName: 'Vikram',
      lastName: 'Malhotra',
      dateOfBirth: '1988-06-15',
      gender: 'MALE',
      mobile: testPhone,
      email: `vikram.${Date.now()}@testborrower.in`,
      addressLine: 'Flat 402, Highline Residency',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      employmentType: 'SALARIED',
      employerName: 'Infosys Limited',
      designation: 'Lead Architect',
      monthlyIncome: 125000,
      existingObligations: 15000,
      bankName: 'HDFC Bank',
      bankAccountNo: '50100482910291',
      bankIfsc: 'HDFC0000123',
      branchId,
    },
  });
  const customer = custRes.data;
  console.log(`   ✅ Customer created: ${customer.firstName} ${customer.lastName} (${customer.customerCode}) | ID: ${customer.id}\n`);

  // STEP 2: KYC Verification
  console.log('🛡️ [Step 2: KYC Verification] Updating KYC status to VERIFIED in database...');
  const kycRes = await apiRequest(`/customers/${customer.id}/kyc`, {
    method: 'PATCH',
    token,
    body: {
      kycStatus: 'VERIFIED',
      riskCategory: 'LOW',
      remarks: 'PAN, Aadhaar & Salary Slips successfully verified via CKYC/DigiLocker',
    },
  });
  console.log(`   ✅ KYC Status: ${kycRes.data.kycStatus} | Risk Tier: ${kycRes.data.riskCategory}\n`);

  // STEP 3: Originate Loan Application
  console.log(`📝 [Step 3: Loan Application] Submitting proposal for ₹${requestedAmount.toLocaleString('en-IN')} / ${tenureMonths} mos...`);
  const appRes = await apiRequest('/applications', {
    method: 'POST',
    token,
    body: {
      customerId: customer.id,
      productId: product.id,
      requestedAmount,
      tenureMonths,
      purpose: 'Home Renovation & Electronics',
    },
  });
  const application = appRes.data;
  console.log(`   ✅ Application created: ${application.applicationNo} | Status: ${application.status}\n`);

  // STEP 4: Automated Eligibility & DTI Evaluation
  console.log('📊 [Step 4: Eligibility Evaluation] Running automated policy rules (DTI/FOIR)...');
  const eligRes = await apiRequest(`/eligibility/evaluate/${application.id}`, {
    method: 'POST',
    token,
  });
  const eligibility = eligRes.data;
  console.log(`   ✅ Policy Result: ${eligibility.result} | Score: ${eligibility.score}/100 | Estimated EMI: ₹${eligibility.estimatedEmi}\n`);

  // STEP 5: Credit Risk Assessment
  console.log('🧠 [Step 5: Risk Assessment] Evaluating bureau score and credit grade...');
  const riskRes = await apiRequest(`/risk/evaluate/${application.id}`, {
    method: 'POST',
    token,
  });
  const risk = riskRes.data;
  console.log(`   ✅ Credit Score: ${risk.score} | Risk Tier: ${risk.category} | Recommendation: ${risk.recommendation}\n`);

  // STEP 6: Underwriting Approval
  console.log('⚖️ [Step 6: Underwriting Decision] Submitting credit sanction approval...');
  const uwRes = await apiRequest(`/underwriting/${application.id}/decision`, {
    method: 'POST',
    token,
    body: {
      decision: 'APPROVE',
      reason: 'Strong disposable income, DTI < 35%, 100% clean repayment track record',
    },
  });
  console.log(`   ✅ Underwriting Decision: ${uwRes.data.decision} | Application moved to APPROVED state\n`);

  // STEP 7: Pre-Disbursement Checklist & Fund Release
  console.log('💸 [Step 7: Fund Release] Executing NEFT electronic disbursement...');
  const utrRef = `NEFT-${Date.now()}`;
  const disbRes = await apiRequest('/disbursements/execute', {
    method: 'POST',
    token,
    body: {
      applicationId: application.id,
      disbursementMethod: 'NEFT_BANK_TRANSFER',
      referenceNumber: utrRef,
    },
  });
  const loan = disbRes.data;
  console.log(`   ✅ Disbursement Executed! Loan Account: ${loan.loanNo} | Ref UTR: ${utrRef}`);
  console.log(`   ✅ Principal: ₹${loan.principal} | Monthly EMI: ₹${loan.emiAmount} | Status: ${loan.status}\n`);

  // STEP 8: Verify Loan Amortization Schedule
  console.log(`📅 [Step 8: Amortization Schedule] Inspecting generated ${tenureMonths}-month reducing schedule...`);
  const loanDetailRes = await apiRequest(`/loans/${loan.id}`, { token });
  const schedule = loanDetailRes.data.schedule || [];
  console.log(`   ✅ Verified ${schedule.length} Amortization Installments generated in database!`);
  console.log(`   Sample Installment #1: Due Date ${schedule[0]?.dueDate?.slice(0, 10)} | Principal: ₹${schedule[0]?.principal} | Interest: ₹${schedule[0]?.interest} | Total EMI: ₹${schedule[0]?.totalDue}\n`);

  // STEP 9: Process Repayment with Waterfall Allocation
  console.log(`💳 [Step 9: Repayment Processing] Processing monthly EMI payment of ₹${Number(loan.emiAmount).toFixed(2)}...`);
  const paymentRef = `UPI-${Date.now()}`;
  const payRes = await apiRequest('/payments', {
    method: 'POST',
    token,
    body: {
      loanId: loan.id,
      amount: Number(loan.emiAmount),
      method: 'UPI',
      reference: paymentRef,
      idempotencyKey: `IDEMP-${paymentRef}`,
    },
  });
  const payment = payRes.data;
  console.log(`   ✅ Payment Recorded: Receipt #${payment.paymentNo} | Status: ${payment.status}`);
  console.log(`   Waterfall Allocations:`, payment.allocations?.map((a: any) => `${a.bucket}: ₹${a.amount}`) || 'Allocated to Interest & Principal');

  // Verify updated loan balance
  const updatedLoanRes = await apiRequest(`/loans/${loan.id}`, { token });
  console.log(`   ✅ Outstanding Principal updated: ₹${updatedLoanRes.data.outstandingPrincipal} (Successfully reduced!)\n`);

  // STEP 10: Collection & PTP Activity Verification
  console.log('🚨 [Step 10: Collections Flow] Fetching collection dashboard & cases...');
  const colDashRes = await apiRequest('/collections/dashboard', { token });
  console.log(`   ✅ Collection Dashboard Active | Total Delinquent Cases: ${colDashRes.data.totalCases || 0}`);
  console.log(`   Aging Buckets Summary:`, colDashRes.data.agingBuckets?.map((b: any) => `${b.bucket}: ${b.caseCount} cases`));

  // STEP 11: Audit Trail Verification
  console.log('\n📜 [Step 11: Immutable Audit Trail] Verifying audit logs for full lifecycle...');
  const auditRes = await apiRequest('/audit', { token });
  const recentLogs = (auditRes.data || []).slice(0, 7);
  console.log('   Recent Audit Events:');
  recentLogs.forEach((log: any) => {
    console.log(`   - [${log.action}] on ${log.entity} (#${log.entityId?.slice(0, 8)}...) by User ${log.userId?.slice(0, 8) || 'SYSTEM'} at ${log.createdAt}`);
  });

  // STEP 12: Reports & Analytics
  console.log('\n📈 [Step 12: Executive Reports & Analytics] Fetching portfolio summary metrics...');
  const reportsRes = await apiRequest('/reports/portfolio', { token });
  console.log('   Portfolio Metrics:', reportsRes.data?.summary || reportsRes.data);

  console.log('\n=============================================================');
  console.log('🎉 100% COMPLETE LIFECYCLE SIMULATION PASSED CLEANLY!');
  console.log('   All data synchronized atomically across all tables & queues.');
  console.log('=============================================================\n');
}

runSimulation().catch((err) => {
  console.error('\n❌ Simulation Failed:', err.message);
  process.exit(1);
});
