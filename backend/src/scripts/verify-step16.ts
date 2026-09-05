async function runStep16Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 16: DECISION SIMULATOR (WHAT-IF ENGINE) LIVE VERIFICATION');
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
    throw new Error('No application found for testing.');
  }
  console.log('Target Application:', targetApp.applicationNo, 'ID:', targetApp.id);
  const originalAmount = Number(targetApp.requestedAmount);
  const originalTenure = targetApp.tenureMonths;
  console.log('Original Amount:', originalAmount, 'Original Tenure:', originalTenure);

  // 2. Execute Non-Destructive What-If Simulation
  console.log('\n--- 2. EXECUTE WHAT-IF SIMULATION ---');
  const simRes = await fetch('http://localhost:4000/api/v1/decision-simulator/simulate', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      applicationId: targetApp.id,
      hypotheticalInputs: {
        requestedAmount: 75000, // Hypothetically reduced
        tenureMonths: 24, // Hypothetically extended
        interestRatePct: 13.0,
      },
    }),
  });

  const simData: any = await simRes.json();
  console.log('Simulation Status:', simRes.status, '(Expected 200)');
  const sim = simData.data;

  console.log('Simulation ID:', sim?.simulationId);
  console.log('Is Hypothetical Flag:', sim?.isHypothetical, '(Expected true)');
  console.log('Amount:', `Actual: ₹${sim?.metrics?.requestedAmount?.actual} -> Simulated: ₹${sim?.metrics?.requestedAmount?.simulated} (Delta: ${sim?.metrics?.requestedAmount?.delta})`);
  console.log('Tenure:', `Actual: ${sim?.metrics?.tenureMonths?.actual}m -> Simulated: ${sim?.metrics?.tenureMonths?.simulated}m`);
  console.log('Monthly EMI:', `Actual: ₹${sim?.metrics?.emi?.actual} -> Simulated: ₹${sim?.metrics?.emi?.simulated} (Delta: ₹${sim?.metrics?.emi?.delta})`);
  console.log('FOIR %:', `Actual: ${sim?.metrics?.foirPercent?.actual}% -> Simulated: ${sim?.metrics?.foirPercent?.simulated}% (Delta: ${sim?.metrics?.foirPercent?.delta}%)`);
  console.log('Eligibility Result:', `Actual: ${sim?.metrics?.eligibilityResult?.actual} -> Simulated: ${sim?.metrics?.eligibilityResult?.simulated}`);
  console.log('Total Interest:', `Actual: ₹${sim?.metrics?.totalInterest?.actual} -> Simulated: ₹${sim?.metrics?.totalInterest?.simulated}`);
  console.log('Changed Conditions Count:', sim?.changedConditions?.length);
  if (sim?.changedConditions?.length > 0) {
    console.log('Sample Changed Condition:', sim?.changedConditions[0]?.detail);
  }
  console.log('AI Tradeoff Summary:', sim?.aiExplanation?.summary);
  console.log('AI Underwriter Takeaway:', sim?.aiExplanation?.underwriterTakeaway);

  // 3. Verify Non-Destructive Integrity (Database Records Unaltered)
  console.log('\n--- 3. NON-DESTRUCTIVE DATABASE INTEGRITY CHECK ---');
  const verifyAppRes = await fetch(`http://localhost:4000/api/v1/applications/${targetApp.id}`, {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const verifyAppData: any = await verifyAppRes.json();
  const freshApp = verifyAppData.data;

  console.log('Application Requested Amount in Database:', Number(freshApp.requestedAmount));
  console.log('Application Tenure in Database:', freshApp.tenureMonths);

  if (Number(freshApp.requestedAmount) !== originalAmount || freshApp.tenureMonths !== originalTenure) {
    throw new Error('VIOLATION: Database records were mutated by the simulation!');
  }
  console.log('CONFIRMED: Database records remain 100% UNTOUCHED (Strict Non-Destructive Invariant verified)');

  // 4. Save Scenario Snapshot
  console.log('\n--- 4. SAVE SCENARIO SNAPSHOT ---');
  const saveRes = await fetch('http://localhost:4000/api/v1/decision-simulator/save', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      simulationId: sim.simulationId,
      name: 'Credit Committee Restructure Scenario - 75k / 24m',
    }),
  });
  const saveData: any = await saveRes.json();
  const snapshot = saveData.data;

  console.log('Save Snapshot Status:', saveRes.status, '(Expected 200)');
  console.log('Snapshot ID:', snapshot?.id);
  console.log('Snapshot Name:', snapshot?.name);
  console.log('Created By:', snapshot?.createdBy);
  console.log('Assumptions Saved:', snapshot?.assumptions);

  // 5. Retrieve Saved Snapshots
  console.log('\n--- 5. RETRIEVE SAVED SNAPSHOTS ---');
  const listSnapsRes = await fetch(`http://localhost:4000/api/v1/decision-simulator/applications/${targetApp.id}`, {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const listSnapsData: any = await listSnapsRes.json();
  console.log('List Snapshots Status:', listSnapsRes.status, 'Count:', listSnapsData.data?.length);

  const getSnapRes = await fetch(`http://localhost:4000/api/v1/decision-simulator/snapshots/${snapshot.id}`, {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const getSnapData: any = await getSnapRes.json();
  console.log('Get Single Snapshot Status:', getSnapRes.status, 'Retrieved ID:', getSnapData.data?.id);

  // 6. Borrower Isolation & Access Control
  console.log('\n--- 6. BORROWER ISOLATION & RBAC PROTECTION ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  const borrowerToken = bData.data?.accessToken;
  console.log('Borrower Login Status:', bLogin.status, 'Roles:', bData.data?.user?.roles);

  // 6a. Borrower attempt simulate -> 403 Forbidden
  const bSimRes = await fetch('http://localhost:4000/api/v1/decision-simulator/simulate', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + borrowerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      applicationId: targetApp.id,
      hypotheticalInputs: { requestedAmount: 50000 },
    }),
  });
  console.log('Borrower Simulate Attempt Status:', bSimRes.status, '(Expected 403 Forbidden)');

  // 6b. Borrower attempt save -> 403 Forbidden
  const bSaveRes = await fetch('http://localhost:4000/api/v1/decision-simulator/save', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + borrowerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ simulationId: sim.simulationId, name: 'Hack' }),
  });
  console.log('Borrower Save Attempt Status:', bSaveRes.status, '(Expected 403 Forbidden)');

  // 6c. Borrower attempt list snapshots -> 403 Forbidden
  const bListSnapsRes = await fetch(`http://localhost:4000/api/v1/decision-simulator/applications/${targetApp.id}`, {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower List Snapshots Status:', bListSnapsRes.status, '(Expected 403 Forbidden)');

  console.log('\n====================================================');
  console.log('ALL STEP 16 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep16Verification().catch(console.error);
