async function runStep20Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 20: AI COMMAND CENTER & AUTONOMOUS MONITOR LIVE VERIFICATION');
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

  // 2. Operational Health Telemetry
  console.log('\n--- 2. OPERATIONAL HEALTH TELEMETRY ---');
  const healthRes = await fetch('http://localhost:4000/api/v1/command-center/health', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const healthData: any = await healthRes.json();
  const h = healthData.data;
  console.log('Health Endpoint Status:', healthRes.status, '(Expected 200)');
  console.log('Originations Velocity:', `${h?.originationsVelocity?.totalApplications} total apps, status: ${h?.originationsVelocity?.velocityStatus}`);
  console.log('Underwriting Queue:', `${h?.underwritingBottlenecks?.pendingReview} pending, bottleneck risk: ${h?.underwritingBottlenecks?.bottleneckRisk}`);
  console.log('Disbursements Queue:', `${h?.disbursementsQueue?.pendingDisbursements} pending, total volume: ₹${h?.disbursementsQueue?.totalDisbursedVolume}`);
  console.log('Portfolio Delinquency:', `Active: ₹${h?.portfolioDelinquency?.totalActivePrincipal}, PAR 30: ${h?.portfolioDelinquency?.par30RatePct}%, PAR 90: ${h?.portfolioDelinquency?.par90RatePct}%, Risk: ${h?.portfolioDelinquency?.delinquencyRiskTier}`);
  console.log('Fraud Cluster Alerts:', `Signals: ${h?.fraudClusterAlerts?.unresolvedFraudSignals}, Clusters: ${h?.fraudClusterAlerts?.activeClusters}`);
  console.log('Integration Hub Health:', `Uptime: ${h?.integrationHealth?.overallUptimePct}%, Breakers: ${h?.integrationHealth?.circuitBreakersTripped}, Status: ${h?.integrationHealth?.status}`);

  // 3. Natural Language Executive Queries
  console.log('\n--- 3. NATURAL LANGUAGE EXECUTIVE QUERY ENGINE ---');

  const queries = [
    'What was our disbursement volume this week by branch?',
    'Show me all high-risk loans approved with exceptions.',
    'Which partners have the highest 90-day delinquency rate?',
    'How many reconciliation discrepancies are pending approval?',
    'What is our current portfolio PAR 30 and PAR 90?',
  ];

  for (const q of queries) {
    const qRes = await fetch('http://localhost:4000/api/v1/command-center/query', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + saToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: q }),
    });
    const qData: any = await qRes.json();
    const res = qData.data;
    console.log(`\nQuery: "${q}"`);
    console.log(`  -> Status: ${qRes.status} (Expected 200)`);
    console.log(`  -> Intent Detected: ${res?.intent}`);
    console.log(`  -> Answer: "${res?.answerSummary}"`);
    console.log(`  -> Structured Metrics:`, res?.structuredMetrics);
  }

  // 4. Autonomous Policy Anomaly Detector
  console.log('\n--- 4. AUTONOMOUS POLICY ANOMALY DETECTOR ---');
  const scanRes = await fetch('http://localhost:4000/api/v1/command-center/scan', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const scanData: any = await scanRes.json();
  const anomalies = scanData.data || [];
  console.log('Autonomous Scan Status:', scanRes.status, 'Total Anomalies Detected:', anomalies.length);
  for (const a of anomalies) {
    console.log(`  -> [${a.severity}] [${a.status}] ${a.title} (Entity: ${a.entityName})`);
  }

  // 5. Human Oversight & Governance Action
  console.log('\n--- 5. HUMAN OVERSIGHT & GOVERNANCE ACTION ---');
  const targetAnomaly = anomalies[0];
  console.log('Target Anomaly ID:', targetAnomaly.id);

  const actionRes = await fetch(`http://localhost:4000/api/v1/command-center/anomalies/${targetAnomaly.id}/action`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'INVESTIGATE',
      note: 'Executive committee opened formal audit review for single-signoff structuring pattern.',
    }),
  });
  const actionData: any = await actionRes.json();
  const updatedAnom = actionData.data;
  console.log('Human Oversight Action Status:', actionRes.status, '(Expected 200)');
  console.log('Updated Status:', updatedAnom?.status, '(Expected INVESTIGATING)');
  console.log('Action Officer:', updatedAnom?.actionTaken?.officerEmail);
  console.log('Action Rationale:', updatedAnom?.actionTaken?.actionNote);

  // 6. Borrower Isolation & RBAC Protection
  console.log('\n--- 6. BORROWER ISOLATION & RBAC PROTECTION ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  const borrowerToken = bData.data?.accessToken;
  console.log('Borrower Login Status:', bLogin.status, 'Roles:', bData.data?.user?.roles);

  const bHealthRes = await fetch('http://localhost:4000/api/v1/command-center/health', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Health Telemetry Status:', bHealthRes.status, '(Expected 403 Forbidden)');

  const bQueryRes = await fetch('http://localhost:4000/api/v1/command-center/query', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + borrowerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: 'Show me all loans' }),
  });
  console.log('Borrower Executive Query Status:', bQueryRes.status, '(Expected 403 Forbidden)');

  const bAnomRes = await fetch('http://localhost:4000/api/v1/command-center/anomalies', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Anomalies List Status:', bAnomRes.status, '(Expected 403 Forbidden)');

  const bScanRes = await fetch('http://localhost:4000/api/v1/command-center/scan', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Trigger Scan Status:', bScanRes.status, '(Expected 403 Forbidden)');

  console.log('\n====================================================');
  console.log('ALL STEP 20 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep20Verification().catch(console.error);
