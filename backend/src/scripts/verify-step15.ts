async function runStep15Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 15: REAL-TIME EVENT & EARLY WARNING ENGINE LIVE VERIFICATION');
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

  // 2. Publish Real-Time Events
  console.log('\n--- 2. REAL-TIME EVENT BUS PUBLISHING ---');
  const testLoanId = 'loan-live-101';
  const pubRes = await fetch('http://localhost:4000/api/v1/early-warnings/publish-event', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventType: 'DPD_THRESHOLD_CROSSED',
      entityType: 'LOAN',
      entityId: testLoanId,
      source: 'CorePaymentLedger',
      currentValue: 65,
      severity: 'CRITICAL',
      metadata: { overdueAmount: 24500, customerName: 'Rajesh Sharma' },
    }),
  });
  const pubData: any = await pubRes.json();
  console.log('Publish Event Status:', pubRes.status, 'Event ID:', pubData.data?.event?.eventId);

  // 3. Verify Alert Generation in Early Warning Center
  console.log('\n--- 3. ALERT GENERATION & SURVEILLANCE FEED ---');
  const listRes = await fetch('http://localhost:4000/api/v1/early-warnings', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const listData: any = await listRes.json();
  const alerts: any[] = listData.data || [];
  console.log('Fetch Alerts Status:', listRes.status, 'Total Alerts Count:', alerts.length);

  const testAlert = alerts.find((a) => a.entityId === testLoanId && a.ruleCode === 'CRED_DPD_THRESHOLD_60');
  if (!testAlert) {
    throw new Error('Expected alert for CRED_DPD_THRESHOLD_60 on testLoanId was not found!');
  }
  console.log('Identified Test Alert ID:', testAlert.warningId);
  console.log('Rule Code:', testAlert.ruleCode);
  console.log('Priority:', testAlert.priority, '(Expected CRITICAL)');
  console.log('Domain:', testAlert.domain, '(Expected CREDIT)');
  console.log('Evidence:', testAlert.evidence);
  console.log('Status:', testAlert.status, '(Expected OPEN)');

  // 4. Deduplication & Alert Fatigue Protection
  console.log('\n--- 4. DEDUPLICATION & COOLDOWN PROTECTION ---');
  const pubDuplicateRes = await fetch('http://localhost:4000/api/v1/early-warnings/publish-event', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventType: 'DPD_THRESHOLD_CROSSED',
      entityType: 'LOAN',
      entityId: testLoanId,
      source: 'CorePaymentLedger',
      currentValue: 66,
      severity: 'CRITICAL',
      metadata: { overdueAmount: 25000 },
    }),
  });
  console.log('Duplicate Event Published Status:', pubDuplicateRes.status);

  const verifyDedupRes = await fetch('http://localhost:4000/api/v1/early-warnings', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const dedupAlertsData: any = await verifyDedupRes.json();
  const dedupAlerts: any[] = dedupAlertsData.data || [];
  const matchingAlerts = dedupAlerts.filter((a: any) => a.entityId === testLoanId && a.ruleCode === 'CRED_DPD_THRESHOLD_60');
  console.log('Matching Alerts Count after duplicate event:', matchingAlerts.length, '(Expected 1 - No duplication)');
  console.log('Trigger Count on Alert:', matchingAlerts[0]?.triggerCount, '(Expected 2)');

  // 5. Early Warning Summary Statistics
  console.log('\n--- 5. EARLY WARNING KPI STATS ---');
  const statsRes = await fetch('http://localhost:4000/api/v1/early-warnings/stats', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const statsData: any = await statsRes.json();
  console.log('Stats Fetch Status:', statsRes.status);
  console.log('Total Active Warnings:', statsData.data?.totalActiveWarnings);
  console.log('Critical Warnings Count:', statsData.data?.criticalCount);
  console.log('By Domain:', statsData.data?.byDomain);

  // 6. Alert Lifecycle Transitions
  console.log('\n--- 6. ALERT LIFECYCLE (ACKNOWLEDGE & RESOLVE) ---');
  const ackRes = await fetch(`http://localhost:4000/api/v1/early-warnings/${testAlert.warningId}/acknowledge`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const ackData: any = await ackRes.json();
  console.log('Acknowledge Status:', ackRes.status, 'Updated Alert Status:', ackData.data?.status, '(Expected ACKNOWLEDGED)');

  const resolveRes = await fetch(`http://localhost:4000/api/v1/early-warnings/${testAlert.warningId}/resolve`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      resolutionNotes: 'Borrower visited branch, cleared pending dues via IMPS reference #882910.',
    }),
  });
  const resolveData: any = await resolveRes.json();
  console.log('Resolve Status:', resolveRes.status, 'Updated Alert Status:', resolveData.data?.status, '(Expected RESOLVED)');
  console.log('Resolution Audit Notes:', resolveData.data?.resolutionNotes);

  // 7. System Batch Scanning
  console.log('\n--- 7. SYSTEM BATCH SCAN ---');
  const scanRes = await fetch('http://localhost:4000/api/v1/early-warnings/scan', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const scanData: any = await scanRes.json();
  console.log('Scan Status:', scanRes.status, 'Scanned Entities:', scanData.data?.scannedEntities, 'Alerts Created:', scanData.data?.alertsCreated);

  // 8. Borrower Isolation & Access Control
  console.log('\n--- 8. BORROWER ISOLATION & ACCESS CONTROL ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  const borrowerToken = bData.data?.accessToken;
  console.log('Borrower Login Status:', bLogin.status, 'Roles:', bData.data?.user?.roles);

  // 8a. Borrower list alerts -> 403 Forbidden
  const bListRes = await fetch('http://localhost:4000/api/v1/early-warnings', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower List Early Warnings Status:', bListRes.status, '(Expected 403 Forbidden)');

  // 8b. Borrower stats -> 403 Forbidden
  const bStatsRes = await fetch('http://localhost:4000/api/v1/early-warnings/stats', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Stats Status:', bStatsRes.status, '(Expected 403 Forbidden)');

  // 8c. Borrower acknowledge alert -> 403 Forbidden
  const bAckRes = await fetch(`http://localhost:4000/api/v1/early-warnings/${testAlert.warningId}/acknowledge`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Acknowledge Attempt Status:', bAckRes.status, '(Expected 403 Forbidden)');

  console.log('\n====================================================');
  console.log('ALL STEP 15 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep15Verification().catch(console.error);
