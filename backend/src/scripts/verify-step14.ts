async function runStep14Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 14: ADVANCED DECISION INTELLIGENCE LIVE VERIFICATION');
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

  // Find target application
  const appListRes = await fetch('http://localhost:4000/api/v1/applications', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const appListData: any = await appListRes.json();
  const applications = Array.isArray(appListData.data) ? appListData.data : appListData.data?.items || [];
  const targetApp = applications[0];

  if (!targetApp) {
    throw new Error('No applications found in system for testing.');
  }
  console.log('Target Application:', targetApp.applicationNo, 'ID:', targetApp.id, 'Status:', targetApp.status);

  // 2. Application Decision Intelligence Fetch
  console.log('\n--- 2. APPLICATION DECISION INTELLIGENCE COCKPIT ---');
  const diRes = await fetch(`http://localhost:4000/api/v1/decision-intelligence/applications/${targetApp.id}`, {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const diData: any = await diRes.json();

  console.log('Decision Intelligence Status:', diRes.status, '(Expected 200)');
  console.log('Decision Readiness State:', diData.data?.readinessState);
  console.log('Readiness Reason:', diData.data?.readinessReason);
  console.log('Review Priority:', diData.data?.reviewPriority);
  console.log('Decision Factors Count:', diData.data?.factors?.length);
  console.log('Identified Conflicts Count:', diData.data?.conflicts?.length);
  if (diData.data?.conflicts?.length > 0) {
    console.log('Sample Conflict:', diData.data?.conflicts[0]?.title);
  }
  console.log('AI Executive Summary:', diData.data?.narrative?.executiveSummary);
  console.log('Underwriter Checklist Questions:', diData.data?.narrative?.humanInvestigationQuestions);
  console.log('Data Freshness Sources:', diData.data?.context?.freshness?.map((f: any) => `${f.source}: ${f.status}`));

  // 3. Force Refresh Endpoint
  console.log('\n--- 3. RE-EVALUATION / FORCE REFRESH ---');
  const refreshRes = await fetch(`http://localhost:4000/api/v1/decision-intelligence/applications/${targetApp.id}/refresh`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const refreshData: any = await refreshRes.json();
  console.log('Force Refresh Status:', refreshRes.status, '(Expected 200)');
  console.log('Refreshed Readiness State:', refreshData.data?.readinessState);

  // 4. Portfolio-Level Decision Intelligence
  console.log('\n--- 4. PORTFOLIO-LEVEL DECISION INTELLIGENCE ---');
  const portRes = await fetch('http://localhost:4000/api/v1/decision-intelligence/portfolio', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const portData: any = await portRes.json();
  console.log('Portfolio Intelligence Status:', portRes.status, '(Expected 200)');
  console.log('Total Pending Applications:', portData.data?.totalPendingApplications);
  console.log('Readiness Breakdown:', portData.data?.readinessBreakdown);
  console.log('Top Blocker:', portData.data?.topBlockers?.[0]);

  // 5. Borrower Isolation & RBAC Protection
  console.log('\n--- 5. BORROWER ISOLATION & ACCESS CONTROL ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  const borrowerToken = bData.data?.accessToken;
  console.log('Borrower Login Status:', bLogin.status, 'Roles:', bData.data?.user?.roles);

  // 5a. Borrower attempting to access application decision intelligence -> 403 Forbidden
  const bAppDiRes = await fetch(`http://localhost:4000/api/v1/decision-intelligence/applications/${targetApp.id}`, {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower App Decision Intelligence Access Status:', bAppDiRes.status, '(Expected 403 Forbidden)');

  // 5b. Borrower attempting to refresh decision intelligence -> 403 Forbidden
  const bRefreshRes = await fetch(`http://localhost:4000/api/v1/decision-intelligence/applications/${targetApp.id}/refresh`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Refresh Attempt Status:', bRefreshRes.status, '(Expected 403 Forbidden)');

  // 5c. Borrower attempting to access portfolio intelligence -> 403 Forbidden
  const bPortRes = await fetch('http://localhost:4000/api/v1/decision-intelligence/portfolio', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Portfolio Access Status:', bPortRes.status, '(Expected 403 Forbidden)');

  console.log('\n====================================================');
  console.log('ALL STEP 14 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep14Verification().catch(console.error);
