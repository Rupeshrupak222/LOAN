async function runStep41DeploymentVerification() {
  console.log('====================================================');
  console.log('STARTING STEP 41: COMMERCIAL DEPLOYMENT MODELS VERIFICATION');
  console.log('====================================================\n');

  // 1. Super Admin Authentication
  const saLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'superadmin@adyapan.dev', password: 'Passw0rd!123' }),
  });
  const saData: any = await saLogin.json();
  const saToken = saData.data?.accessToken;
  console.log('Super Admin Login Status:', saLogin.status, 'Token acquired:', Boolean(saToken));

  // 2. Deployment Profile Inspection
  console.log('\n--- 1. DEPLOYMENT PROFILE & ARCHITECTURE TOPOLOGY ---');
  const profileRes = await fetch('http://localhost:4000/api/v1/deployment/profile');
  const profileData: any = await profileRes.json();
  const prof = profileData.data;
  console.log('Profile Status:', profileRes.status);
  console.log('  - Deployment Model:', prof?.deploymentModel);
  console.log('  - Environment Tier:', prof?.environmentTier);
  console.log('  - Storage Driver:', prof?.storageDriver);
  console.log('  - Secret Provider:', prof?.secretProvider);
  console.log('  - AI Inference Mode:', prof?.aiInferenceMode);
  console.log('  - Multi-Tenant Isolation Enforced:', prof?.strictTenantIsolationEnforced);

  // 3. Deep Component Health Diagnostics
  console.log('\n--- 2. DETAILED COMPONENT HEALTH PROBES ---');
  const healthRes = await fetch('http://localhost:4000/api/v1/deployment/detailed-health');
  const healthData: any = await healthRes.json();
  const h = healthData.data;
  console.log('Detailed Health Status:', healthRes.status, 'Overall State:', h?.status);
  console.log('  - Database:', h?.components?.database?.status, `(Latency: ${h?.components?.database?.latencyMs}ms)`);
  console.log('  - App Server:', h?.components?.applicationServer?.status);
  console.log('  - Cache Tier:', h?.components?.cache?.status, `(${h?.components?.cache?.details})`);
  console.log('  - Audit Ledger Chain:', h?.components?.auditChain?.status);

  // 4. Super Admin Preflight Environment Validation
  console.log('\n--- 3. SUPER ADMIN PREFLIGHT SAFETY CHECK ---');
  const preflightRes = await fetch('http://localhost:4000/api/v1/deployment/preflight', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const preflightData: any = await preflightRes.json();
  const p = preflightData.data;
  console.log('Preflight Status:', preflightRes.status);
  console.log('  - Passed:', p?.passed);
  console.log('  - Total Checks:', p?.totalChecks, `(Passed: ${p?.passedCount}, Warnings: ${p?.warningCount}, Failed: ${p?.failedCount})`);
  p?.checks?.forEach((c: any) => {
    console.log(`    * [${c.category}] ${c.name} -> ${c.status}: ${c.message}`);
  });

  // 5. Non-Destructive Rollback Plan Generator
  console.log('\n--- 4. NON-DESTRUCTIVE ROLLBACK PLAN ---');
  const rollbackRes = await fetch('http://localhost:4000/api/v1/deployment/rollback-plan?fromVersion=2.4.0&toVersion=2.3.9', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const rollbackData: any = await rollbackRes.json();
  const r = rollbackData.data;
  console.log('Rollback Plan Status:', rollbackRes.status);
  console.log('  - Plan ID:', r?.planId);
  console.log('  - Strategy:', r?.databaseStrategy);
  console.log('  - Preserve Repayments:', r?.financialLedgerProtection?.preserveRepayments);
  console.log('  - Preserve Audit Trail:', r?.financialLedgerProtection?.preserveAuditTrail);
  console.log('  - Rollback Steps Count:', r?.steps?.length);

  console.log('\n====================================================');
  console.log('ALL STEP 41 DEPLOYMENT MODELS VERIFICATIONS COMPLETED!');
  console.log('====================================================');
}

runStep41DeploymentVerification().catch(console.error);
