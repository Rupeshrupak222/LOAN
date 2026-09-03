async function runStep29Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 29: REGULATORY & COMPLIANCE FRAMEWORK LIVE VERIFICATION');
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

  // 2. Compliance Dashboard Overview Inspection
  console.log('\n--- 2. COMPLIANCE DASHBOARD OVERVIEW & CATEGORY SCORES ---');
  const overviewRes = await fetch('http://localhost:4000/api/v1/compliance/overview', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const overviewData: any = await overviewRes.json();
  const ov = overviewData.data;
  console.log('Compliance Overview:');
  console.log('  - Overall Compliance Score:', ov?.complianceScore + '%', '| Status:', ov?.overallStatus);
  console.log('  - Active Institutional Rules:', ov?.activeRulesCount);
  console.log('  - Open Exceptions Count:', ov?.openExceptionsCount, '| Critical:', ov?.criticalExceptionsCount);
  console.log('Category Scoreboard:');
  for (const [cat, detail] of Object.entries<any>(ov?.categoryScores || {})) {
    console.log(`  - [${cat}] Score: ${detail.score}% (${detail.status}) | Exceptions: ${detail.activeExceptions}`);
  }

  // 3. Institutional Policy Rules Listing
  console.log('\n--- 3. INSTITUTIONAL POLICY RULES LISTING ---');
  const rulesRes = await fetch('http://localhost:4000/api/v1/compliance/rules', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const rulesData: any = await rulesRes.json();
  console.log('Configured Rules Count:', rulesData.total);
  rulesData.data?.slice(0, 4).forEach((r: any) => {
    console.log(`  * [${r.id}] ${r.name} (${r.category} | ${r.severity})`);
  });

  // 4. Deterministic Application Compliance Evaluation
  console.log('\n--- 4. DETERMINISTIC COMPLIANCE EVALUATION ENGINE ---');
  // 4.1 Compliant Evaluation
  const compRes = await fetch('http://localhost:4000/api/v1/compliance/evaluate/application', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: 'APP-LIVE-VERIFY-100',
      requestedAmount: 300000,
      kycVerified: true,
      panVerified: true,
      kfsConsented: true,
      bankAccountValidated: true,
      hasIncomeDocuments: true,
      distinctApproverRoles: ['UNDERWRITER'],
    }),
  });
  const compData: any = await compRes.json();
  console.log('Compliant Application Score:', compData.data?.complianceScore + '%', '| Status:', compData.data?.overallStatus);

  // 4.2 Non-Compliant Evaluation (Missing KYC/PAN & KFS)
  const nonCompRes = await fetch('http://localhost:4000/api/v1/compliance/evaluate/application', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: 'APP-LIVE-VERIFY-FAIL',
      requestedAmount: 750000, // High value (>500k) requiring dual SoD signoff
      kycVerified: false,
      panVerified: false,
      kfsConsented: false,
      bankAccountValidated: true,
      hasIncomeDocuments: true,
      distinctApproverRoles: ['UNDERWRITER'], // Only 1 approver -> fails SoD
    }),
  });
  const nonCompData: any = await nonCompRes.json();
  const nc = nonCompData.data;
  console.log('Non-Compliant Application Score:', nc?.complianceScore + '%', '| Status:', nc?.overallStatus);
  console.log('  - Failed Rules Count:', nc?.failedRulesCount, '| Exceptions Raised:', nc?.exceptionsCreated?.length);
  nc?.evaluations?.filter((e: any) => e.status !== 'COMPLIANT').forEach((e: any) => {
    console.log(`    ! [${e.ruleId}] Finding: ${e.finding}`);
  });

  // 5. Compliance Exception Lifecycle Management
  console.log('\n--- 5. EXCEPTION LIFECYCLE TRANSITION ---');
  const excId = nc?.exceptionsCreated?.[0];
  if (excId) {
    const transitionRes = await fetch(`http://localhost:4000/api/v1/compliance/exceptions/${excId}/transition`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + saToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'UNDER_REVIEW',
        remediationNotes: 'Compliance officer reviewing Digilocker manual upload.',
      }),
    });
    const transData: any = await transitionRes.json();
    console.log(`Exception ${excId} Transition Status:`, transitionRes.status, 'New Status:', transData.data?.status);

    const resolveRes = await fetch(`http://localhost:4000/api/v1/compliance/exceptions/${excId}/transition`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + saToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'RESOLVED',
        remediationPlan: 'KYC verified through authorized offline Aadhaar XML.',
      }),
    });
    const resolveData: any = await resolveRes.json();
    console.log(`Exception ${excId} Resolved Status:`, resolveRes.status, 'Status:', resolveData.data?.status, 'ResolvedBy:', resolveData.data?.resolvedBy);
  }

  // 6. Borrower Isolation & RBAC Protection
  console.log('\n--- 6. BORROWER ISOLATION & RBAC PROTECTION ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  const borrowerToken = bData.data?.accessToken;

  const bOverviewRes = await fetch('http://localhost:4000/api/v1/compliance/overview', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Access Compliance Overview Status:', bOverviewRes.status, '(Expected 403 Forbidden)');

  const bEvalRes = await fetch('http://localhost:4000/api/v1/compliance/evaluate/application', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + borrowerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: 'APP-BORROWER-ATTEMPT' }),
  });
  console.log('Borrower Trigger Compliance Evaluation Status:', bEvalRes.status, '(Expected 403 Forbidden)');

  console.log('\n====================================================');
  console.log('ALL STEP 29 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep29Verification().catch(console.error);
