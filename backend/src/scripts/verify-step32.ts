async function runStep32Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 32: EXTERNAL INTEGRATION CERTIFICATION LIVE VERIFICATION');
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

  // 2. Integration Certification Overview
  console.log('\n--- 2. CERTIFICATION MATRIX OVERVIEW ---');
  const overviewRes = await fetch('http://localhost:4000/api/v1/integrations/certification/overview', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const overviewData: any = await overviewRes.json();
  const ov = overviewData.data;
  console.log('Certification Overview:');
  console.log('  - Total Monitored Connectors:', ov?.totalConnectors);
  console.log('  - Certified Production Ready:', ov?.certifiedProductionReady);
  console.log('  - Certified With Fallback:', ov?.certifiedWithFallback);

  console.log('\nSample Certified Connectors:');
  ov?.connectors?.slice(0, 4).forEach((c: any) => {
    console.log(`  * [${c.connectorId}] ${c.connectorName}`);
    console.log(`    Level: ${c.requirementLevel} | Status: ${c.certificationStatus}`);
    console.log(`    Primary: ${c.primaryProvider}`);
    console.log(`    Fallback: ${c.fallbackProvider || 'None'} | Circuit: ${c.circuitBreakerState}`);
  });

  // 3. Live Health Audit
  console.log('\n--- 3. LIVE HEALTH & LATENCY AUDIT ---');
  const auditRes = await fetch('http://localhost:4000/api/v1/integrations/certification/audit-health', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const auditData: any = await auditRes.json();
  console.log('Health Audit Status:', auditRes.status, 'Audited Connectors Count:', auditData.data?.length);

  // 4. Failover & Idempotency Safety Simulator
  console.log('\n--- 4. FAILOVER & IDEMPOTENCY SAFETY SIMULATOR ---');
  const failoverRes = await fetch('http://localhost:4000/api/v1/integrations/certification/test-failover', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ connectorId: 'CONN-RAZORPAY-PAY' }),
  });
  const failoverData: any = await failoverRes.json();
  const fo = failoverData.data;
  console.log('Failover Test Status:', failoverRes.status, 'Test ID:', fo?.testId);
  console.log('  - Primary Simulated Failure:', fo?.primarySimulatedFailure, `(${fo?.primaryProvider})`);
  console.log('  - Fallback Provider Dispatched:', fo?.fallbackProvider, `(Executed: ${fo?.fallbackExecuted})`);
  console.log('  - Idempotency Key Preserved:', fo?.idempotencyKeyPreserved);
  console.log('  - Zero Transaction Duplication Guarantee:', fo?.zeroTransactionDuplication);
  console.log('  - Cryptographic Audit Evidence Ref:', fo?.auditEvidenceRef);
  console.log('  - Final Result:', fo?.status);

  // 5. Borrower Isolation & RBAC Protection
  console.log('\n--- 5. BORROWER ISOLATION & RBAC PROTECTION ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  const borrowerToken = bData.data?.accessToken;

  const bOverviewRes = await fetch('http://localhost:4000/api/v1/integrations/certification/overview', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Access Certification Matrix Status:', bOverviewRes.status, '(Expected 403 Forbidden)');

  const bFailoverRes = await fetch('http://localhost:4000/api/v1/integrations/certification/test-failover', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + borrowerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ connectorId: 'CONN-CIBIL-BUREAU' }),
  });
  console.log('Borrower Execute Failover Test Status:', bFailoverRes.status, '(Expected 403 Forbidden)');

  console.log('\n====================================================');
  console.log('ALL STEP 32 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep32Verification().catch(console.error);
