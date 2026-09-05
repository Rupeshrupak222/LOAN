async function runStep44SupportVerification() {
  console.log('====================================================');
  console.log('STARTING STEP 44: SLA & ENTERPRISE SUPPORT VERIFICATION');
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

  // 2. Create Support Ticket with Dynamic SLA Target
  console.log('\n--- 1. CREATE SUPPORT TICKET WITH DYNAMIC SLA TARGETS ---');
  const createTktRes = await fetch('http://localhost:4000/api/v1/support/tickets', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Disbursement IMPS transfer timeout for Loan #LN-9921',
      description: 'IMPS payment failed with gateway code 504. Borrower awaiting payout verification.',
      category: 'DISBURSEMENT_FAILURE',
      severity: 'P1_CRITICAL',
      customerEmail: 'finance@kotakprime.com',
    }),
  });
  const tktData: any = await createTktRes.json();
  const tkt = tktData.data;
  console.log('Create Ticket Status:', createTktRes.status);
  console.log('  - Ticket ID:', tkt?.id);
  console.log('  - Severity:', tkt?.severity);
  console.log('  - Assigned Team:', tkt?.assignedTeam);
  console.log('  - Response Deadline:', tkt?.responseDeadline);
  console.log('  - Resolution Deadline:', tkt?.resolutionDeadline);

  // 3. Acknowledge and Resolve Ticket
  console.log('\n--- 2. ACKNOWLEDGE & RESOLVE SUPPORT TICKET ---');
  const updateRes = await fetch(`http://localhost:4000/api/v1/support/tickets/${tkt.id}/status`, {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'RESOLVED',
      resolutionNotes: 'Disbursement saga compensating action reconciled via Cashfree connector replay.',
    }),
  });
  const upData: any = await updateRes.json();
  console.log('Resolve Status:', updateRes.status, 'Ticket State:', upData.data?.status, 'Resolution Breached:', upData.data?.isResolutionBreached);

  // 4. Declare Enterprise Incident & Advance Lifecycle Stage
  console.log('\n--- 3. DECLARE ENTERPRISE INCIDENT & ADVANCE STAGE ---');
  const incRes = await fetch('http://localhost:4000/api/v1/support/incidents', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Primary Credit Bureau CRIF Gateway Intermittent 504 Timeouts',
      impactedService: 'INTEGRATION_HUB_BUREAU',
      severity: 'P1_CRITICAL',
      impactSummary: '14 credit inquiry calls delayed during peak morning origination window.',
    }),
  });
  const incData: any = await incRes.json();
  const inc = incData.data;
  console.log('Declare Incident Status:', incRes.status);
  console.log('  - Incident ID:', inc?.id);
  console.log('  - Stage:', inc?.stage);
  console.log('  - Severity:', inc?.severity);

  // Advance to INVESTIGATING
  const stageRes = await fetch(`http://localhost:4000/api/v1/support/incidents/${inc.id}/stage`, {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      stage: 'INVESTIGATING',
      rootCause: 'Upstream vendor maintenance window packet drop.',
      mitigationSteps: 'Circuit breaker diverted traffic to secondary Experian connector.',
    }),
  });
  const stData: any = await stageRes.json();
  console.log('Advance Stage Status:', stageRes.status, 'New Stage:', stData.data?.stage);

  // 5. Query SLA Metrics & Compliance Report
  console.log('\n--- 4. SLA METRICS & COMPLIANCE REPORT ---');
  const repRes = await fetch('http://localhost:4000/api/v1/support/sla-report', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const repData: any = await repRes.json();
  const r = repData.data;
  console.log('SLA Report Status:', repRes.status);
  console.log('  - Total Tickets Tracked:', r?.totalTickets);
  console.log('  - SLA Compliance Rate:', `${r?.slaCompliancePercentage}%`);
  console.log('  - Mean Time to Acknowledge (MTTA):', `${r?.meanTimeToAcknowledgeMinutes} mins`);
  console.log('  - Mean Time to Resolve (MTTR):', `${r?.meanTimeToResolveMinutes} mins`);

  console.log('\n====================================================');
  console.log('ALL STEP 44 SLA & SUPPORT VERIFICATIONS COMPLETED!');
  console.log('====================================================');
}

runStep44SupportVerification().catch(console.error);
