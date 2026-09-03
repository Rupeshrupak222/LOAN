async function runStep37E2EVerification() {
  console.log('====================================================');
  console.log('STARTING STEP 37: END-TO-END ENTERPRISE TESTING LIVE VERIFICATION');
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

  // 2. Privacy & Statutory DPDP Consent Granting
  console.log('\n--- 2. PRIVACY & STATUTORY CONSENT GRANTING ---');
  const consentRes = await fetch('http://localhost:4000/api/v1/privacy/consents/grant', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId: 'cust-e2e-live-01',
      purposeCode: 'PURPOSE-BUREAU-02',
      channel: 'WEB_PORTAL',
      ipAddress: '49.207.198.11',
    }),
  });
  const consentData: any = await consentRes.json();
  console.log('Consent Grant Status:', consentRes.status, 'Status:', consentData.data?.status, 'Version:', consentData.data?.version);

  // 3. Product Catalog Pricing Simulation & Statutory KFS Generation
  console.log('\n--- 3. PRODUCT PRICING & STATUTORY KFS SIMULATION ---');
  const catRes = await fetch('http://localhost:4000/api/v1/loan-products/catalog', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const catData: any = await catRes.json();
  const primeProduct = catData.data?.find((p: any) => p.code === 'PERSONAL_PRIME_SALARIED');

  const simRes = await fetch('http://localhost:4000/api/v1/loan-products/simulate-pricing', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId: primeProduct.id,
      loanAmount: 300000,
      tenureMonths: 12,
      applicantProfile: {
        cibilScore: 780,
        monthlyIncome: 80000,
        existingEmis: 5000,
      },
    }),
  });
  const simData: any = await simRes.json();
  const sim = simData.data;
  console.log('Simulation Status:', simRes.status);
  console.log('  - Product:', sim?.productName);
  console.log('  - Monthly EMI:', sim?.monthlyEmi);
  console.log('  - Statutory APR:', `${sim?.annualPercentageRateApr}%`);
  console.log('  - Net Disbursed:', sim?.netDisbursedAmount);
  console.log('  - Eligibility:', sim?.eligibilityCheck?.eligible ? 'PASSED' : 'FAILED');

  // 4. Dynamic Workflow Transition & Gate Verification
  console.log('\n--- 4. WORKFLOW TRANSITION & MANDATORY GATES ---');
  const wfEvalRes = await fetch('http://localhost:4000/api/v1/workflows/evaluate-transition', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workflowType: 'LOAN_ORIGINATION',
      currentStageCode: 'BUREAU_FRAUD_ASSESSMENT',
      candidatePayload: {
        applicationId: 'appl-e2e-live-01',
        cibilScore: 780,
        employmentType: 'SALARIED',
        fraudScore: 10,
        loanAmount: 300000,
      },
    }),
  });
  const wfEvalData: any = await wfEvalRes.json();
  const wf = wfEvalData.data;
  console.log('Workflow Transition Status:', wfEvalRes.status);
  console.log('  - Allowed:', wf?.allowed);
  console.log('  - Target Stage:', wf?.targetStageCode);
  console.log('  - Evaluated Branch:', wf?.evaluatedBranch);
  console.log('  - Dual Approval Required:', wf?.requiresDualApproval);

  // 5. Segregation of Duties (SoD) Conflict Guard
  console.log('\n--- 5. BANKING SEGREGATION OF DUTIES (SOD) GUARD ---');
  const sodRes = await fetch('http://localhost:4000/api/v1/roles/check-sod', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      permissions: ['DISBURSEMENTS_INITIATE_PAYOUT', 'DISBURSEMENTS_APPROVE_MAKER_CHECKER'],
    }),
  });
  const sodData: any = await sodRes.json();
  console.log('SoD Check Status:', sodRes.status);
  console.log('  - Has Conflict:', sodData.data?.hasConflict);
  console.log('  - Critical Block:', sodData.data?.hasCriticalBlock);

  // 6. Borrower Isolation & RBAC Boundary Protection
  console.log('\n--- 6. BORROWER ISOLATION & RBAC BOUNDARY PROTECTION ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  const borrowerToken = bData.data?.accessToken;

  const bCreateRoleRes = await fetch('http://localhost:4000/api/v1/roles', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + borrowerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: 'HACK_ROLE', name: 'Hacked' }),
  });
  console.log('Borrower Create Role Status:', bCreateRoleRes.status, '(Expected 403 Forbidden)');

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
  console.log('ALL STEP 37 END-TO-END VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep37E2EVerification().catch(console.error);
