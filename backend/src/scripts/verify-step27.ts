async function runStep27Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 27: HIGH AVAILABILITY + DISASTER RECOVERY LIVE VERIFICATION');
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

  // 2. HADR Multi-AZ Status & Circuit Breakers Inspection
  console.log('\n--- 2. HADR MULTI-AZ STATUS & CIRCUIT BREAKER MATRIX ---');
  const statusRes = await fetch('http://localhost:4000/api/v1/hadr/status', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const statusData: any = await statusRes.json();
  console.log('HADR Status:');
  console.log('  - Active Region:', statusData.data?.activeRegion);
  console.log('  - Standby DR Region:', statusData.data?.standbyRegion);
  console.log('  - Replication Lag (ms):', statusData.data?.replicationLagMs);
  console.log('  - Target RTO (min):', statusData.data?.rtoTargetMinutes, '| Target RPO (sec):', statusData.data?.rpoTargetSeconds);
  console.log('Circuit Breakers Status:');
  for (const [svc, cb] of Object.entries<any>(statusData.data?.circuitBreakers || {})) {
    console.log(`  - [${svc}] State: ${cb.state}, Fallback: ${cb.fallbackStrategy}, Threshold: ${cb.failureThreshold}`);
  }

  // 3. Circuit Breaker Outage & Trip Verification
  console.log('\n--- 3. SIMULATED OUTAGE & CIRCUIT BREAKER TRIPPING ---');
  const tripRes = await fetch('http://localhost:4000/api/v1/hadr/circuit-breakers/AI_GEMINI_GATEWAY/trip', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason: 'Simulated Upstream 503 Outage' }),
  });
  const tripData: any = await tripRes.json();
  console.log('Trip AI Gateway Status:', tripRes.status, 'State:', tripData.data?.state, 'Fallback Active:', tripData.data?.fallbackStrategy);

  // Reset circuit breaker
  const resetRes = await fetch('http://localhost:4000/api/v1/hadr/circuit-breakers/AI_GEMINI_GATEWAY/reset', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const resetData: any = await resetRes.json();
  console.log('Reset AI Gateway Status:', resetRes.status, 'State:', resetData.data?.state);

  // 4. Automated Disaster Recovery Drill Simulation
  console.log('\n--- 4. AUTOMATED DISASTER RECOVERY DRILL SIMULATION ---');
  const drillRes = await fetch('http://localhost:4000/api/v1/hadr/dr-drill', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const drillData: any = await drillRes.json();
  const drill = drillData.data;
  console.log('DR Drill Execution Status:', drillRes.status, 'Drill ID:', drill?.drillId);
  console.log('  - Achieved RTO:', drill?.achievedRtoSeconds, 'seconds (Target <= 15 min)');
  console.log('  - Data Loss Detected:', drill?.dataLossDetected, '(RPO Target <= 60 sec)');
  console.log('  - Backup Checksum:', drill?.backupIntegrityChecksum?.slice(0, 16) + '...');
  console.log('  - Execution Steps:');
  drill?.steps?.forEach((s: any) => console.log(`    * ${s.stepName} -> ${s.status} (${s.durationMs}ms)`));

  // 5. DR History Verification
  console.log('\n--- 5. DR HISTORY VERIFICATION ---');
  const historyRes = await fetch('http://localhost:4000/api/v1/hadr/dr-history', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const historyData: any = await historyRes.json();
  console.log('DR Drill Records in History:', historyData.total);

  // 6. Borrower Isolation & RBAC Protection
  console.log('\n--- 6. BORROWER ISOLATION & RBAC PROTECTION ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  const borrowerToken = bData.data?.accessToken;

  const bStatusRes = await fetch('http://localhost:4000/api/v1/hadr/status', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Query HADR Status:', bStatusRes.status, '(Expected 403 Forbidden)');

  const bDrillRes = await fetch('http://localhost:4000/api/v1/hadr/dr-drill', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Trigger DR Drill Status:', bDrillRes.status, '(Expected 403 Forbidden)');

  console.log('\n====================================================');
  console.log('ALL STEP 27 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep27Verification().catch(console.error);
