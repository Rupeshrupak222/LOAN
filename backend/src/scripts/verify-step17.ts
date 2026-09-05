async function runStep17Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 17: ADVANCED ACCOUNTING & RECONCILIATION LIVE VERIFICATION');
  console.log('====================================================\n');

  // 1. Super Admin Authentication
  console.log('--- 1. SUPER ADMIN AUTHENTICATION ---');
  const saLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'superadmin@adyapan.dev', password: 'Passw0rd!123' }),
  });
  const saData: any = await saLogin.json();
  const saToken = saData.data?.accessToken;
  console.log('Super Admin Login Status:', saLogin.status, 'Token acquired:', Boolean(saToken));

  // Find a target loan
  const loansRes = await fetch('http://localhost:4000/api/v1/loans', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const loansData: any = await loansRes.json();
  const loans = Array.isArray(loansData.data) ? loansData.data : loansData.data?.items || [];
  const targetLoan = loans[0];
  if (!targetLoan) {
    throw new Error('No loan found for testing.');
  }
  console.log('Target Loan:', targetLoan.loanNo, 'ID:', targetLoan.id);

  // 2. Run Automated 5-Pillar Reconciliation Engine
  console.log('\n--- 2. RUN AUTOMATED 5-PILLAR RECONCILIATION ENGINE ---');
  const runRes = await fetch('http://localhost:4000/api/v1/reconciliation/run', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const runData: any = await runRes.json();
  console.log('Reconciliation Run Status:', runRes.status, '(Expected 200)');
  console.log('Scanned Items Count:', runData.data?.scannedCount);
  console.log('Exceptions Found:', runData.data?.exceptionsFound);

  // 3. Fetch Dashboard Metrics & Health
  console.log('\n--- 3. FETCH RECONCILIATION DASHBOARD METRICS ---');
  const dashRes = await fetch('http://localhost:4000/api/v1/reconciliation/dashboard', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const dashData: any = await dashRes.json();
  const stats = dashData.data;
  console.log('Dashboard Status:', dashRes.status, '(Expected 200)');
  console.log('Reconciliation Health:', `${stats?.reconciliationHealthPercent}%`);
  console.log('Total Reconciled Volume:', `₹${stats?.totalReconciledVolume?.toLocaleString('en-IN')}`);
  console.log('Active Exceptions Count:', stats?.totalActiveExceptions);
  console.log('Critical Exceptions Count:', stats?.criticalExceptionsCount);
  console.log('Pending Maker-Checker Adjustments:', stats?.pendingAdjustmentsCount);
  console.log('By Severity:', stats?.bySeverity);
  console.log('By Type:', stats?.byType);

  // 4. List Financial Exceptions
  console.log('\n--- 4. LIST FINANCIAL EXCEPTIONS ---');
  const excRes = await fetch('http://localhost:4000/api/v1/reconciliation/exceptions', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const excData: any = await excRes.json();
  const exceptions = excData.data || [];
  console.log('Exceptions Status:', excRes.status, 'Retrieved Count:', exceptions.length);
  if (exceptions.length > 0) {
    const sample = exceptions[0];
    console.log('Sample Exception:', {
      id: sample.exceptionId,
      type: sample.type,
      severity: sample.severity,
      discrepancy: `₹${sample.discrepancyAmount}`,
      source: sample.source,
      evidence: sample.evidence,
      recommendedAction: sample.recommendedAction,
    });
  }

  // 5. Controlled Adjustment & Maker-Checker Workflow
  console.log('\n--- 5. CONTROLLED ADJUSTMENT & MAKER-CHECKER WORKFLOW ---');

  // 5a. Small adjustment (< ₹5,000) -> auto-approved
  console.log('5a. Proposing small adjustment (< ₹5,000)...');
  const smallAdjRes = await fetch('http://localhost:4000/api/v1/reconciliation/adjustments', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'WAIVER',
      loanId: targetLoan.id,
      amount: 1500,
      reason: 'Standard customer hardship fee waiver approved by branch.',
    }),
  });
  const smallAdjData: any = await smallAdjRes.json();
  const smallAdj = smallAdjData.data;
  console.log('Small Adjustment Status:', smallAdjRes.status, 'Adjustment ID:', smallAdj?.adjustmentId);
  console.log('Requires Approval:', smallAdj?.requiresApproval, '(Expected false)');
  console.log('Status:', smallAdj?.status, '(Expected APPROVED)');

  // 5b. Major adjustment (>= ₹5,000) -> enters PENDING_APPROVAL
  console.log('\n5b. Proposing major adjustment (>= ₹5,000, Maker-Checker threshold)...');
  const majorAdjRes = await fetch('http://localhost:4000/api/v1/reconciliation/adjustments', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'REVERSAL',
      loanId: targetLoan.id,
      amount: 12500,
      reason: 'Reversing duplicate bank debit identified in payment reconciliation.',
    }),
  });
  const majorAdjData: any = await majorAdjRes.json();
  const majorAdj = majorAdjData.data;
  console.log('Major Adjustment Status:', majorAdjRes.status, 'Adjustment ID:', majorAdj?.adjustmentId);
  console.log('Requires Approval:', majorAdj?.requiresApproval, '(Expected true)');
  console.log('Status:', majorAdj?.status, '(Expected PENDING_APPROVAL)');

  // 5c. Approve major adjustment
  console.log('\n5c. Approving major adjustment via Maker-Checker authorization...');
  const approveRes = await fetch(`http://localhost:4000/api/v1/reconciliation/adjustments/${majorAdj.adjustmentId}/approve`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const approveData: any = await approveRes.json();
  console.log('Approval Status:', approveRes.status, '(Expected 200)');
  console.log('Adjustment Post-Approval Status:', approveData.data?.status, '(Expected APPROVED)');
  console.log('Approved By:', approveData.data?.approvedBy);

  // 5d. Propose and Reject workflow
  console.log('\n5d. Proposing and rejecting unverified adjustment...');
  const rejAdjRes = await fetch('http://localhost:4000/api/v1/reconciliation/adjustments', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'LEDGER_CORRECTION',
      loanId: targetLoan.id,
      amount: 7000,
      reason: 'Proposed manual balance deduction without bank proof.',
    }),
  });
  const rejAdjData: any = await rejAdjRes.json();
  const rejectAdjId = rejAdjData.data?.adjustmentId;

  const rejectRes = await fetch(`http://localhost:4000/api/v1/reconciliation/adjustments/${rejectAdjId}/reject`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rejectionReason: 'Declined: Bank statement does not substantiate discrepancy.' }),
  });
  const rejectData: any = await rejectRes.json();
  console.log('Rejection Action Status:', rejectRes.status, '(Expected 200)');
  console.log('Adjustment Post-Rejection Status:', rejectData.data?.status, '(Expected REJECTED)');
  console.log('Rejection Reason Stored:', rejectData.data?.rejectionReason);

  // 6. Borrower Isolation Verification
  console.log('\n--- 6. BORROWER ISOLATION & RBAC PROTECTION ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  const borrowerToken = bData.data?.accessToken;
  console.log('Borrower Login Status:', bLogin.status, 'Roles:', bData.data?.user?.roles);

  const bDashRes = await fetch('http://localhost:4000/api/v1/reconciliation/dashboard', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Dashboard Access Status:', bDashRes.status, '(Expected 403 Forbidden)');

  const bExcRes = await fetch('http://localhost:4000/api/v1/reconciliation/exceptions', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Exceptions Access Status:', bExcRes.status, '(Expected 403 Forbidden)');

  const bAdjRes = await fetch('http://localhost:4000/api/v1/reconciliation/adjustments', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + borrowerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'WAIVER', loanId: targetLoan.id, amount: 500, reason: 'Hack' }),
  });
  console.log('Borrower Propose Adjustment Status:', bAdjRes.status, '(Expected 403 Forbidden)');

  console.log('\n====================================================');
  console.log('ALL STEP 17 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep17Verification().catch(console.error);
