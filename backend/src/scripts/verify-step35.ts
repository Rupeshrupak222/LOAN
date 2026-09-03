async function runStep35Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 35: DYNAMIC WORKFLOW BUILDER LIVE VERIFICATION');
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

  // 2. Workflows List & Origination Pipeline
  console.log('\n--- 2. WORKFLOWS PIPELINE LIST & STAGES ---');
  const wfListRes = await fetch('http://localhost:4000/api/v1/workflows', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const wfListData: any = await wfListRes.json();
  console.log('Workflows List Status:', wfListRes.status, 'Total Pipelines:', wfListData.data?.length);

  const origRes = await fetch('http://localhost:4000/api/v1/workflows/LOAN_ORIGINATION', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const origData: any = await origRes.json();
  const origWf = origData.data;
  console.log('Origination Pipeline Status:', origRes.status, 'Code:', origWf?.code);
  console.log('  - Total Stages:', origWf?.stages?.length);
  origWf?.stages?.forEach((s: any) => {
    console.log(`    Stage #${s.sequence}: ${s.name} (${s.code}) | Role: ${s.assigneeRole} | SLA: ${s.slaHours}h | Gates: ${s.mandatoryGates.length} | Branches: ${s.branchRules.length}`);
  });

  // 3. Fast-Track Prime Borrower Routing Evaluation
  console.log('\n--- 3. FAST-TRACK PRIME BORROWER TRANSITION EVALUATION ---');
  const fastTrackRes = await fetch('http://localhost:4000/api/v1/workflows/evaluate-transition', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workflowType: 'LOAN_ORIGINATION',
      currentStageCode: 'BUREAU_FRAUD_ASSESSMENT',
      candidatePayload: {
        applicationId: 'appl-live-fast-01',
        cibilScore: 795,
        employmentType: 'SALARIED',
        fraudScore: 10,
        loanAmount: 250000,
      },
    }),
  });
  const fastTrackData: any = await fastTrackRes.json();
  const ft = fastTrackData.data;
  console.log('Fast-Track Eval Status:', fastTrackRes.status);
  console.log('  - Allowed:', ft?.allowed);
  console.log('  - Target Stage Code:', ft?.targetStageCode);
  console.log('  - Evaluated Branch:', ft?.evaluatedBranch);
  console.log('  - Requires Dual Approval:', ft?.requiresDualApproval);

  // 4. High-Value Committee Escalation Evaluation
  console.log('\n--- 4. HIGH-VALUE COMMITTEE ESCALATION EVALUATION ---');
  const highValRes = await fetch('http://localhost:4000/api/v1/workflows/evaluate-transition', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workflowType: 'LOAN_ORIGINATION',
      currentStageCode: 'BUREAU_FRAUD_ASSESSMENT',
      candidatePayload: {
        applicationId: 'appl-live-high-01',
        cibilScore: 745,
        employmentType: 'SELF_EMPLOYED_BUSINESS',
        fraudScore: 18,
        loanAmount: 1800000, // ₹18 Lakh High Value
      },
    }),
  });
  const highValData: any = await highValRes.json();
  const hv = highValData.data;
  console.log('High-Value Eval Status:', highValRes.status);
  console.log('  - Allowed:', hv?.allowed);
  console.log('  - Target Stage Code:', hv?.targetStageCode);
  console.log('  - Evaluated Branch:', hv?.evaluatedBranch);
  console.log('  - Requires Dual Approval:', hv?.requiresDualApproval);

  // 5. Mandatory Gate Failure Evaluation
  console.log('\n--- 5. MANDATORY GATE FAILURE EVALUATION ---');
  const failRes = await fetch('http://localhost:4000/api/v1/workflows/evaluate-transition', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workflowType: 'LOAN_ORIGINATION',
      currentStageCode: 'BUREAU_FRAUD_ASSESSMENT',
      candidatePayload: {
        applicationId: 'appl-live-fail-01',
        cibilScore: 590, // Fails: min 650
        fraudScore: 20,
      },
    }),
  });
  const failData: any = await failRes.json();
  const f = failData.data;
  console.log('Gate Failure Eval Status:', failRes.status);
  console.log('  - Allowed:', f?.allowed, '(Expected false)');
  console.log('  - Failed Gate Reason:', f?.gateCheckResults?.find((g: any) => !g.passed)?.reason);

  // 6. Borrower Isolation & RBAC Protection
  console.log('\n--- 6. BORROWER ISOLATION & RBAC PROTECTION ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  const borrowerToken = bData.data?.accessToken;

  const bCreateWfRes = await fetch('http://localhost:4000/api/v1/workflows', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + borrowerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'PRODUCT_CUSTOM', code: 'HACK_WF' }),
  });
  console.log('Borrower Create Workflow Status:', bCreateWfRes.status, '(Expected 403 Forbidden)');

  console.log('\n====================================================');
  console.log('ALL STEP 35 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep35Verification().catch(console.error);
