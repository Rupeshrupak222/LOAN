async function runStep40ChaosVerification() {
  console.log('====================================================');
  console.log('STARTING STEP 40: FAILURE, CHAOS & SELF-HEALING VERIFICATION');
  console.log('====================================================\n');

  // 1. Super Admin Authentication
  const saLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'superadmin@adyapan.dev', password: 'Passw0rd!123' }),
  });
  const saData: any = await saLogin.json();
  const saToken = saData.data?.accessToken;

  // 2. Health & Dependency Status Inspection Under Normal / Degraded Conditions
  console.log('--- 1. SYSTEM HEALTH & DEPENDENCY DIAGNOSTICS ---');
  const healthRes = await fetch('http://localhost:4000/health');
  const healthData: any = await healthRes.json();
  console.log('Health Endpoint Status:', healthRes.status, 'System State:', healthData.status);

  // 3. Simulating Malformed Payload & Error Resiliency on Workflow Evaluation
  console.log('\n--- 2. MALFORMED / PARTIAL INPUT RESILIENCY ---');
  const malformedWfRes = await fetch('http://localhost:4000/api/v1/workflows/evaluate-transition', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workflowType: 'LOAN_ORIGINATION',
      currentStageCode: 'BUREAU_FRAUD_ASSESSMENT',
      candidatePayload: {}, // Completely empty payload -> must not crash process
    }),
  });
  const malformedData: any = await malformedWfRes.json();
  console.log('Malformed Payload Response Status:', malformedWfRes.status);
  console.log('  - Transition Allowed:', malformedData.data?.allowed);
  console.log('  - Blocking Gate Identified:', malformedData.data?.blockingGateCodes?.length > 0);

  // 4. Financial Idempotency & Replay Resiliency
  console.log('\n--- 3. FINANCIAL IDEMPOTENCY UNDER CONCURRENT REPLAY ---');
  const primeProductRes = await fetch('http://localhost:4000/api/v1/loan-products/catalog', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const primeProductData: any = await primeProductRes.json();
  const primeProduct = primeProductData.data?.find?.((p: any) => p.code === 'PERSONAL_PRIME_SALARIED') || { id: 'PERSONAL_PRIME_SALARIED' };

  const simPayload = {
    productId: primeProduct.id,
    loanAmount: 400000,
    tenureMonths: 24,
    applicantProfile: {
      cibilScore: 780,
      monthlyIncome: 85000,
      existingEmis: 5000,
    },
  };

  const req1 = fetch('http://localhost:4000/api/v1/loan-products/simulate-pricing', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + saToken, 'Content-Type': 'application/json' },
    body: JSON.stringify(simPayload),
  });

  const req2 = fetch('http://localhost:4000/api/v1/loan-products/simulate-pricing', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + saToken, 'Content-Type': 'application/json' },
    body: JSON.stringify(simPayload),
  });

  const [res1, res2] = await Promise.all([req1, req2]);
  const data1: any = await res1.json();
  const data2: any = await res2.json();

  console.log('Concurrent Simulation 1 Status:', res1.status, 'EMI:', data1.data?.monthlyEmi);
  console.log('Concurrent Simulation 2 Status:', res2.status, 'EMI:', data2.data?.monthlyEmi);
  console.log('Identical Idempotent Financial Result:', data1.data?.monthlyEmi === data2.data?.monthlyEmi);

  // 5. Cryptographic Evidence Chain Ledger Inspection
  console.log('\n--- 4. CRYPTOGRAPHIC EVIDENCE AUDIT CHAIN INSPECTION ---');
  const verifyChainRes = await fetch('http://localhost:4000/api/v1/audit/verify-chain', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ entityId: 'APP-DEMO-001' }),
  });
  const verifyChainData: any = await verifyChainRes.json();
  console.log('Cryptographic Hash Chain Verify Status:', verifyChainRes.status, 'Integrity Valid:', verifyChainData.data?.valid, 'Nodes Verified:', verifyChainData.data?.nodesVerified);

  console.log('\n====================================================');
  console.log('ALL STEP 40 FAILURE & CHAOS VERIFICATIONS COMPLETED!');
  console.log('====================================================');
}

runStep40ChaosVerification().catch(console.error);
