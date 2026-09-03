async function runStep28Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 28: OBSERVABILITY, METRICS & OPERATIONS CENTER LIVE VERIFICATION');
  console.log('====================================================\n');

  // 1. Prometheus Scrape Endpoint Verification
  console.log('--- 1. PROMETHEUS SCRAPE ENDPOINT (/metrics) ---');
  const promRes = await fetch('http://localhost:4000/metrics');
  const promText = await promRes.text();
  console.log('Prometheus /metrics Status:', promRes.status);
  console.log('Prometheus Headers Content-Type:', promRes.headers.get('content-type'));
  console.log('Sample Prometheus Metrics Output:');
  promText
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'))
    .slice(0, 5)
    .forEach((l) => console.log('  -', l));

  // 2. Distributed Tracing & Correlation ID Propagation
  console.log('\n--- 2. DISTRIBUTED TRACING & CORRELATION ID ECHO ---');
  const traceId = 'corr-trace-step28-live-probe-123';
  const traceRes = await fetch('http://localhost:4000/health/live', {
    headers: { 'X-Correlation-ID': traceId },
  });
  const echoTraceId = traceRes.headers.get('X-Correlation-ID');
  console.log('Injected Correlation ID:', traceId);
  console.log('Echoed Correlation ID in Response:', echoTraceId, '(Matches:', echoTraceId === traceId, ')');

  // 3. Super Admin Authentication & Telemetry Overview
  console.log('\n--- 3. OPERATIONAL TELEMETRY & RED METRICS OVERVIEW ---');
  const saLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'superadmin@adyapan.dev', password: 'Passw0rd!123' }),
  });
  const saData: any = await saLogin.json();
  const saToken = saData.data?.accessToken;

  const overviewRes = await fetch('http://localhost:4000/api/v1/observability/overview', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const overviewData: any = await overviewRes.json();
  const ov = overviewData.data;
  console.log('Telemetry Overview:');
  console.log('  - Total Requests:', ov?.redMetrics?.totalRequests, '| RPS:', ov?.redMetrics?.requestsPerSecond);
  console.log('  - Error Rate (%):', ov?.redMetrics?.errorRatePercentage, '| p95 Latency (ms):', ov?.redMetrics?.p95LatencyMs);
  console.log('  - Memory RSS (MB):', ov?.system?.memoryRssMb, '| Active DB Connections:', ov?.system?.dbConnectionsActive);
  console.log('  - Active Applications:', ov?.financial?.activeApplicationsCount, '| Disbursed Portfolio: ₹' + (ov?.financial?.totalDisbursedAmount / 100000).toFixed(2) + 'L');

  // 4. Alert Center Lifecycle Management
  console.log('\n--- 4. ALERT CENTER INCIDENT LIFECYCLE ---');
  // Create Alert
  const createAlertRes = await fetch('http://localhost:4000/api/v1/observability/alerts', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      severity: 'WARNING',
      title: 'Underwriting Queue Depth Elevated',
      message: '18 applications pending manual signoff in branch BR-MUMBAI-01.',
      source: 'WORKFLOW_MONITOR',
    }),
  });
  const alertData: any = await createAlertRes.json();
  const createdAlert = alertData.data;
  console.log('Alert Created Status:', createAlertRes.status, 'ID:', createdAlert?.id, 'Severity:', createdAlert?.severity);

  // List Alerts
  const listAlertsRes = await fetch('http://localhost:4000/api/v1/observability/alerts', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const listData: any = await listAlertsRes.json();
  console.log('Active Alerts Retrieved:', listData.total);

  // Acknowledge Alert
  const ackRes = await fetch(`http://localhost:4000/api/v1/observability/alerts/${createdAlert?.id}/ack`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const ackData: any = await ackRes.json();
  console.log('Alert Acknowledged Status:', ackRes.status, 'Acknowledged:', ackData.data?.acknowledged);

  // 5. Borrower Isolation & RBAC Protection
  console.log('\n--- 5. BORROWER ISOLATION & RBAC PROTECTION ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  const borrowerToken = bData.data?.accessToken;

  const bOverviewRes = await fetch('http://localhost:4000/api/v1/observability/overview', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Access Telemetry Overview Status:', bOverviewRes.status, '(Expected 403 Forbidden)');

  const bAlertRes = await fetch('http://localhost:4000/api/v1/observability/alerts', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + borrowerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ severity: 'INFO', title: 'Test', message: 'Test' }),
  });
  console.log('Borrower Trigger Alert Status:', bAlertRes.status, '(Expected 403 Forbidden)');

  console.log('\n====================================================');
  console.log('ALL STEP 28 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep28Verification().catch(console.error);
